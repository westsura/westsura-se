import { supabaseServer } from "@/lib/supabase";
import { arendeNamn, type Arende, type Del } from "@/lib/arende";

/**
 * Allt som ska synas i adminkalendern för ett datumintervall, som en gemensam lista:
 * interna bokningar (varje tjänst för sig), boende bokat på sajten, blockeringar,
 * tillfällen (evenemang, jakt, kurser) och kurser. Inget kopieras — allt läses där det ligger.
 */
export type Post = {
  id: string;
  kalla: "arende" | "webb" | "block" | "tillfalle" | "kurs";
  kategori: string;             // nyckel i KATEGORI (färg + filter)
  status: "forfragan" | "preliminar" | "bekraftad" | "avbokad" | "info";
  titel: string;
  under: string | null;
  fran: string; till: string;   // datum, till och med
  tid_fran: string | null; tid_till: string | null; // "09.00"
  enheter: string[]; lokaler: string[];
  reserverar: boolean;
  href: string;
};

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const plus = (d: string, n: number) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return iso(x); };
const hhmm = (t: string | null) => (t ? t.slice(0, 5).replace(":", ".") : null);
/** "10.00–16.00" → ["10.00", "16.00"] */
const tidtext = (t: string | null): [string | null, string | null] => {
  const m = t?.match(/(\d{1,2})[.:](\d{2})(?:\s*[–-]\s*(\d{1,2})[.:](\d{2}))?/);
  return m ? [`${m[1].padStart(2, "0")}.${m[2]}`, m[3] ? `${m[3].padStart(2, "0")}.${m[4]}` : null] : [null, null];
};

export async function hamtaPoster(fran: string, till: string, visaAvbokade = false): Promise<Post[]> {
  const db = await supabaseServer();
  const [{ data: delar }, { data: webb }, { data: block }, { data: tillfallen }, { data: kurser }] = await Promise.all([
    db.from("arende_del").select("*, arende:arende_id(*)").lte("fran", till).gte("till", fran),
    db.from("bokningar_admin").select("id, nummer, status, ankomst, avresa, gast_namn, enheter, enhet_ids, antal_personer, paket_namn").lte("ankomst", till).gt("avresa", fran),
    db.from("blockering").select("*").lte("fran", till).gt("till", fran),
    db.from("tillfalle").select("id, typ, titel, datum, datum_till, tid, publicerad, slug").lte("datum", till),
    db.from("kurs").select("id, namn, datum_fran, datum_till").not("datum_fran", "is", null).lte("datum_fran", till),
  ]);

  const poster: Post[] = [];
  for (const d of (delar ?? []) as (Del & { arende: Arende })[]) {
    const a = d.arende;
    if (!a || (a.status === "avbokad" && !visaAvbokade)) continue;
    const kategori = a.typ === "intern" || d.typ === "intern" || d.typ === "aktivitet" ? "intern"
      : d.typ === "evenemang" && a.typ === "privat" ? "privat" : d.typ;
    poster.push({
      id: d.id, kalla: "arende", kategori, status: a.typ === "intern" ? (d.blockerar ? "bekraftad" : "info") : (a.status as Post["status"]),
      titel: arendeNamn(a), under: d.beskrivning, fran: d.fran, till: d.till, tid_fran: hhmm(d.tid_fran), tid_till: hhmm(d.tid_till),
      enheter: d.enhet_ids, lokaler: d.lokal_ids,
      reserverar: d.blockerar && (a.status === "preliminar" || a.status === "bekraftad"),
      href: `/admin/bokningar/${a.id}`,
    });
  }
  for (const b of (webb ?? []) as { id: string; nummer: number; status: string; ankomst: string; avresa: string; gast_namn: string; enheter: string | null; enhet_ids: string[] | null; antal_personer: number; paket_namn: string | null }[]) {
    if (b.status === "avbokad" && !visaAvbokade) continue;
    poster.push({
      id: b.id, kalla: "webb", kategori: "boende", status: b.status as Post["status"],
      titel: b.gast_namn, under: `${b.paket_namn ? b.paket_namn + " · " : ""}${b.enheter ?? ""} · ${b.antal_personer} pers · bokat på sajten`,
      fran: b.ankomst, till: plus(b.avresa, -1), tid_fran: null, tid_till: null,
      enheter: b.enhet_ids ?? [], lokaler: [], reserverar: b.status !== "avbokad", href: `/admin/bokningar/boende#${b.nummer}`,
    });
  }
  for (const bl of (block ?? []) as { id: string; enhet_id: string; fran: string; till: string; orsak: string | null }[]) {
    poster.push({
      id: bl.id, kalla: "block", kategori: "intern", status: "bekraftad", titel: `Blockerat${bl.orsak ? ": " + bl.orsak : ""}`, under: null,
      fran: bl.fran, till: plus(bl.till, -1), tid_fran: null, tid_till: null, enheter: [bl.enhet_id], lokaler: [], reserverar: true,
      href: "/admin/kalender?vy=resurser",
    });
  }
  for (const t of (tillfallen ?? []) as { id: string; typ: string; titel: string; datum: string; datum_till: string | null; tid: string | null; publicerad: boolean; slug: string | null }[]) {
    const slut = t.datum_till ?? t.datum;
    if (slut < fran) continue;
    const [tf, tt] = tidtext(t.tid);
    poster.push({
      id: t.id, kalla: "tillfalle", kategori: t.typ === "evenemang" ? "evenemang" : "jakt", status: "info",
      titel: t.titel, under: `${t.typ === "evenemang" ? "Evenemang på sajten" : t.typ === "jakt" ? "Jakt" : t.typ === "hundtraning" ? "Hundträning" : "Jaktkurs"}${t.publicerad ? "" : " · ej publicerad"}`,
      fran: t.datum, till: slut, tid_fran: tf, tid_till: tt, enheter: [], lokaler: [], reserverar: false,
      href: t.typ === "jakt" ? `/admin/tillfallen/${t.id}` : "/admin/tillfallen",
    });
  }
  for (const k of (kurser ?? []) as { id: string; namn: string; datum_fran: string; datum_till: string | null }[]) {
    const slut = k.datum_till ?? k.datum_fran;
    if (slut < fran) continue;
    poster.push({
      id: k.id, kalla: "kurs", kategori: "evenemang", status: "info", titel: k.namn, under: "Kurs",
      fran: k.datum_fran, till: slut, tid_fran: null, tid_till: null, enheter: [], lokaler: [], reserverar: false, href: "/admin/kurser",
    });
  }
  return poster.sort((a, b) => a.fran.localeCompare(b.fran) || (a.tid_fran ?? "99").localeCompare(b.tid_fran ?? "99"));
}

/** Poster en viss dag. */
export const paDag = (poster: Post[], d: string) => poster.filter((p) => p.fran <= d && p.till >= d);
