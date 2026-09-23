import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";

export type Medlem = {
  id: string; anvandare_id: string | null;
  namn: string; epost: string; telefon: string; ort: string | null;
  status: string; sasong_id: string | null; niva_id: string | null;
  underlag_id: string | null; kurs_genomford: boolean;
  kurs_godkand: string | null; kurs_version: number | null;
};

export type Kursinstallning = { antal_fragor: number; godkant_procent: number; giltighet: "sasong" | "version" | "alltid"; version: number; ingress: string | null };

/**
 * Är säkerhetskursen godkänd för den här medlemmen just nu?
 * Beror på inställningen: per säsong (godkänd inom aktiv säsong), per version
 * (godkänd på nuvarande innehåll) eller för alltid.
 */
export async function kursStatus(medlem: Medlem): Promise<{ godkand: boolean; datum: string | null; installning: Kursinstallning }> {
  const adm = supabaseAdmin();
  const [{ data: inst }, { data: sasong }] = await Promise.all([
    adm.from("kursinstallning").select("antal_fragor, godkant_procent, giltighet, version, ingress").eq("id", 1).single(),
    adm.from("jaktsasong").select("fran, till").eq("aktiv", true).maybeSingle(),
  ]);
  const installning = (inst ?? { antal_fragor: 15, godkant_procent: 80, giltighet: "sasong", version: 1, ingress: null }) as Kursinstallning;
  const datum = medlem.kurs_godkand;
  let godkand = false;
  if (datum) {
    if (installning.giltighet === "alltid") godkand = true;
    else if (installning.giltighet === "version") godkand = medlem.kurs_version === installning.version;
    else godkand = !!sasong && datum.slice(0, 10) >= sasong.fran && datum.slice(0, 10) <= sasong.till;
  }
  return { godkand, datum, installning };
}

/**
 * Hämtar inloggad medlem, eller skickar till inloggningen.
 * Motsvarar kravAdmin i lib/admin.ts.
 */
export async function kravMedlem(): Promise<Medlem> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/jaktklubb/login");

  // Läses med servicenyckeln: RLS på jaktmedlem kräver att anvandare_id redan är
  // satt, och innan kopplingen gjorts ser medlemmen inte sin egen rad.
  const adm = supabaseAdmin();
  const { data, error } = await adm.from("jaktmedlem").select("*").eq("anvandare_id", user.id).maybeSingle();
  if (error) throw new Error(`Kunde inte läsa medlemskapet: ${error.message}`);
  let medlem = data as Medlem | null;

  // Triggern auth_user_medlem sätter anvandare_id när kontot skapas. Fanns kontot
  // redan sedan tidigare — till exempel för att adressen också är admin — kopplas
  // raden i stället här, första gången medlemmen går in.
  if (!medlem && user.email) {
    const { data: viaEpost, error: felEpost } = await adm.from("jaktmedlem").select("*").eq("epost", user.email.toLowerCase()).maybeSingle();
    if (felEpost) throw new Error(`Kunde inte läsa medlemskapet: ${felEpost.message}`);
    medlem = viaEpost as Medlem | null;
    if (medlem) {
      const { error: felKoppling } = await adm.from("jaktmedlem").update({ anvandare_id: user.id }).eq("id", medlem.id);
      if (felKoppling) console.error("kunde inte koppla medlemmen till inloggningen", medlem.id, felKoppling.message);
    }
  }

  // Medlemmar och gästjägare har konto; sökande, avslutade och avböjda kommer inte in.
  if (!medlem || (medlem.status !== "godkand" && medlem.status !== "gast")) redirect("/jaktklubb/login?fel=ingen-behorighet");
  return medlem;
}

/** Gästjägare har konto men inte medlemskap: inga ingående dagar, ingen förtur, inget klubbmaterial. */
export const arMedlem = (m: Medlem) => m.status === "godkand";

/* ---------- Jaktledare ---------- */

export type Jaktledarbehorighet = { via: "admin" | "medlem"; namn: string; adminRoller?: string[] };

/**
 * Vem får jobba i jaktledarvyn för en jaktdag: admin med rollen jaktadmin/jaktledare
 * (eller superadmin), eller den medlem som är utpekad jaktledare för dagen.
 * Kastar om ingen av dem — anropas från server actions och sidor.
 */
export async function kravJaktledare(tillfalleId: string): Promise<Jaktledarbehorighet> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error("Inte inloggad.");
  const adm = supabaseAdmin();

  const { data: admin } = await adm.from("admin_anvandare").select("namn, epost, roller").eq("id", user.id).maybeSingle();
  const roller: string[] = admin?.roller ?? [];
  if (admin && (roller.includes("superadmin") || roller.includes("jaktadmin") || roller.includes("jaktledare"))) {
    return { via: "admin", namn: admin.namn ?? admin.epost, adminRoller: roller };
  }

  const { data: t } = await adm.from("tillfalle").select("jaktledare_id").eq("id", tillfalleId).maybeSingle();
  if (t?.jaktledare_id) {
    const { data: m } = await adm.from("jaktmedlem").select("namn").eq("id", t.jaktledare_id).eq("anvandare_id", user.id).maybeSingle();
    if (m) return { via: "medlem", namn: m.namn };
  }
  throw new Error("Du är inte jaktledare för den här jaktdagen.");
}

/** Skickar gäster till översikten om sidan är bara för medlemmar. */
export async function kravRiktigMedlem(): Promise<Medlem> {
  const m = await kravMedlem();
  if (!arMedlem(m)) redirect("/jaktklubb/medlem");
  return m;
}
