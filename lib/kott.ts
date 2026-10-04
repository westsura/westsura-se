import { supabaseAdmin } from "@/lib/supabase";
import { fallt, type Skott } from "@/lib/avskjutning";

/**
 * Köttfördelningen i jaktlaget:
 *  - Älg: köttet delas mellan medlemmar som deltagit på minst hälften av säsongens genomförda älgjakter.
 *  - Rådjur och vildsvin: det första djuret en jägare fäller på hösten (jul–dec) och på våren (jan–jun)
 *    behåller hen själv; därefter går köttet till lagets gemensamma middagar.
 * Bara på servern — läser med servicenyckeln.
 */

export type Algdeltagare = { id: string; namn: string; deltagit: number; berattigad: boolean };
export type Kottlage = { algjakter: { id: string; titel: string; datum: string }[]; kravAntal: number; deltagare: Algdeltagare[] };

/** Höst eller vår för ett datum (jaktåret börjar 1 juli). */
export const halvar = (datum: string) => (Number(datum.slice(5, 7)) >= 7 ? "höst" : "vår");

/** Id på de skott som räknas som jägarens "första" rådjur/vildsvin för halvåret — köttet är jägarens eget. */
export function forstaSkott(skott: Skott[]): Set<string> {
  const sorterade = skott
    .filter((s) => s.jagare_id && (s.vilt === "radjur" || s.vilt === "vildsvin") && fallt(s))
    .sort((a, b) => (a.datum + (a.tid ?? "") + a.skapad).localeCompare(b.datum + (b.tid ?? "") + b.skapad));
  const sett = new Set<string>(), forsta = new Set<string>();
  for (const s of sorterade) {
    const nyckel = `${s.jagare_id}|${s.sasong_id ?? ""}|${halvar(s.datum)}`;
    if (!sett.has(nyckel)) { sett.add(nyckel); forsta.add(s.id); }
  }
  return forsta;
}

/** Älgjakterna under säsongen som redan genomförts, och hur många varje medlem deltagit på. */
export async function kottlage(sasong: { fran: string; till: string }): Promise<Kottlage> {
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const slut = sasong.till < idag ? sasong.till : idag;
  const [{ data: jakter }, { data: medlemmar }] = await Promise.all([
    adm.from("tillfalle").select("id, titel, datum").eq("algjakt", true).gte("datum", sasong.fran).lte("datum", slut).order("datum"),
    adm.from("jaktmedlem").select("id, namn, epost").eq("status", "godkand").order("namn"),
  ]);
  const algjakter = (jakter ?? []) as { id: string; titel: string; datum: string }[];
  const { data: anm } = algjakter.length
    ? await adm.from("anmalan").select("tillfalle_id, jagare_id, epost").in("tillfalle_id", algjakter.map((j) => j.id)).eq("status", "bekraftad")
    : { data: [] as { tillfalle_id: string; jagare_id: string | null; epost: string }[] };
  const kravAntal = Math.ceil(algjakter.length / 2);
  const deltagare = ((medlemmar ?? []) as { id: string; namn: string; epost: string }[]).map((m) => {
    const dagar = new Set((anm ?? []).filter((a) => a.jagare_id === m.id || a.epost?.toLowerCase() === m.epost.toLowerCase()).map((a) => a.tillfalle_id));
    return { id: m.id, namn: m.namn, deltagit: dagar.size, berattigad: algjakter.length > 0 && dagar.size >= kravAntal };
  });
  return { algjakter, kravAntal, deltagare };
}
