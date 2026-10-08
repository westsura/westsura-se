import { supabasePublik } from "@/lib/supabase";

/** Ett evenemang under Aktuellt — en rad i tillfalle med typ 'evenemang'. */
export type Evenemang = {
  id: string; slug: string; titel: string; ingress: string | null; beskrivning: string | null; program: string | null;
  datum: string; tid: string | null; pris: number | null; platser: number; kvar: number;
  bild: string | null; bild_alt: string | null; anmalan: boolean;
};

const FALT = "id, slug, titel, ingress, beskrivning, program, datum, tid, pris, platser, bild, bild_alt, anmalan";

async function medKvar(rader: Omit<Evenemang, "kvar">[]): Promise<Evenemang[]> {
  const db = supabasePublik();
  return Promise.all(rader.map(async (r) => {
    if (!r.anmalan) return { ...r, kvar: r.platser };
    const { data } = await db.rpc("platser_kvar", { t: r.id });
    return { ...r, kvar: typeof data === "number" ? data : r.platser };
  }));
}

/** Kommande publicerade evenemang, närmast först. Passerade försvinner av sig själva. */
export async function kommandeEvenemang(): Promise<Evenemang[]> {
  try {
    const idag = new Date().toISOString().slice(0, 10);
    const { data } = await supabasePublik().from("tillfalle").select(FALT)
      .eq("typ", "evenemang").eq("publicerad", true).eq("synlighet", "publik").not("slug", "is", null)
      .gte("datum", idag).order("datum");
    return medKvar((data ?? []) as Omit<Evenemang, "kvar">[]);
  } catch (e) { console.error("Kunde inte hämta evenemang", e); return []; }
}

/** Ett evenemang efter adress — även passerade, så att gamla länkar fortsätter fungera. */
export async function evenemang(slug: string): Promise<Evenemang | null> {
  const { data } = await supabasePublik().from("tillfalle").select(FALT)
    .eq("typ", "evenemang").eq("publicerad", true).eq("slug", slug).maybeSingle();
  if (!data) return null;
  return (await medKvar([data as Omit<Evenemang, "kvar">]))[0];
}

/** Alla publicerade evenemangsadresser, till sitemapen. */
export async function evenemangAdresser(): Promise<{ slug: string; datum: string }[]> {
  try {
    const { data } = await supabasePublik().from("tillfalle").select("slug, datum").eq("typ", "evenemang").eq("publicerad", true).not("slug", "is", null);
    return (data ?? []) as { slug: string; datum: string }[];
  } catch { return []; }
}

const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const DAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

/** "Lördag 26 september 2026" */
export function langtDatum(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${DAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())} ${d.getDate()} ${MAN[d.getMonth()]} ${d.getFullYear()}`;
}
