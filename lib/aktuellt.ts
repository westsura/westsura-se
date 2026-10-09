import { supabasePublik } from "@/lib/supabase";
import type { Sittning } from "@/lib/sittning";

/** Ett evenemang under Aktuellt — en rad i tillfalle med typ 'evenemang', ev. med flera sittningar. */
export type Evenemang = {
  id: string; slug: string; titel: string; ingress: string | null; beskrivning: string | null; program: string | null;
  datum: string; datum_till: string | null; tid: string | null; pris: number | null; platser: number; kvar: number;
  bild: string | null; bild_alt: string | null; anmalan: boolean;
  sittningar: Sittning[];
};

const FALT = "id, slug, titel, ingress, beskrivning, program, datum, datum_till, tid, pris, platser, bild, bild_alt, anmalan";
type Rad = Omit<Evenemang, "kvar" | "sittningar">;

async function komplettera(rader: Rad[]): Promise<Evenemang[]> {
  const db = supabasePublik();
  return Promise.all(rader.map(async (r) => {
    const { data: s } = await db.from("sittning").select("id, datum, tid, platser, pris").eq("tillfalle_id", r.id).order("datum").order("tid");
    const sittningar: Sittning[] = await Promise.all(((s ?? []) as Omit<Sittning, "kvar">[]).map(async (x) => {
      const { data } = await db.rpc("sittning_kvar", { s: x.id });
      return { ...x, kvar: typeof data === "number" ? data : x.platser };
    }));
    let kvar = r.platser;
    if (r.anmalan && !sittningar.length) {
      const { data } = await db.rpc("platser_kvar", { t: r.id });
      if (typeof data === "number") kvar = data;
    }
    return { ...r, kvar, sittningar };
  }));
}

/** Kommande publicerade evenemang, närmast först. Ligger kvar tills sista sittningen har varit. */
export async function kommandeEvenemang(): Promise<Evenemang[]> {
  try {
    const idag = new Date().toISOString().slice(0, 10);
    const { data } = await supabasePublik().from("tillfalle").select(FALT)
      .eq("typ", "evenemang").eq("publicerad", true).eq("synlighet", "publik").not("slug", "is", null)
      .or(`datum.gte.${idag},datum_till.gte.${idag}`).order("datum");
    return komplettera((data ?? []) as Rad[]);
  } catch (e) { console.error("Kunde inte hämta evenemang", e); return []; }
}

/** Ett evenemang efter adress — även passerade, så att gamla länkar fortsätter fungera. */
export async function evenemang(slug: string): Promise<Evenemang | null> {
  const { data } = await supabasePublik().from("tillfalle").select(FALT)
    .eq("typ", "evenemang").eq("publicerad", true).eq("slug", slug).maybeSingle();
  if (!data) return null;
  return (await komplettera([data as Rad]))[0];
}

/** Alla publicerade evenemangsadresser, till sitemapen. */
export async function evenemangAdresser(): Promise<{ slug: string; datum: string }[]> {
  try {
    const { data } = await supabasePublik().from("tillfalle").select("slug, datum, datum_till").eq("typ", "evenemang").eq("publicerad", true).not("slug", "is", null);
    return ((data ?? []) as { slug: string; datum: string; datum_till: string | null }[]).map((e) => ({ slug: e.slug, datum: e.datum_till ?? e.datum }));
  } catch { return []; }
}

const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const DAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

/** "Lördag 26 september 2026" */
export function langtDatum(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${DAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())} ${d.getDate()} ${MAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** Datum och tid som rubrikrad: en dag med tid, en dag med flera sittningar, eller ett spann av dagar. */
export function nar(e: Evenemang) {
  const dagar = new Set(e.sittningar.map((s) => s.datum));
  if (dagar.size > 1) {
    const [a, b] = [e.sittningar[0].datum, e.sittningar[e.sittningar.length - 1].datum];
    const da = new Date(a + "T12:00:00"), db = new Date(b + "T12:00:00");
    return da.getMonth() === db.getMonth()
      ? `${da.getDate()}–${db.getDate()} ${MAN[db.getMonth()]} ${db.getFullYear()} · flera sittningar`
      : `${da.getDate()} ${MAN[da.getMonth()]} – ${db.getDate()} ${MAN[db.getMonth()]} ${db.getFullYear()} · flera sittningar`;
  }
  if (e.sittningar.length > 1) return `${langtDatum(e.sittningar[0].datum)} · flera sittningar`;
  if (e.sittningar.length === 1) return `${langtDatum(e.sittningar[0].datum)}${e.sittningar[0].tid ? " · " + e.sittningar[0].tid : ""}`;
  return `${langtDatum(e.datum)}${e.tid ? " · " + e.tid : ""}`;
}
