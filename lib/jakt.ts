import { redirect } from "next/navigation";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";

export type Medlem = {
  id: string; anvandare_id: string | null;
  namn: string; epost: string; telefon: string; ort: string | null;
  status: string; sasong_id: string | null; niva_id: string | null;
  underlag_id: string | null; kurs_genomford: boolean;
};

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

  if (!medlem || medlem.status !== "godkand") redirect("/jaktklubb/login?fel=ingen-behorighet");
  return medlem;
}
