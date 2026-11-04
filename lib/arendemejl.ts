import { ARENDETYP, DELTYP, tid, type Arende, type Del } from "@/lib/arende";

/** En mejlmall i admin. Platshållare i {klamrar} fylls i från bokningen. */
export type Mejlmall = { id: string; namn: string; syfte: string; typ: string | null; amne: string; rubrik: string; text: string; ordning: number };

export const SYFTE: Record<string, string> = {
  bekraftelse: "Bekräftelse", preliminar: "Preliminär bokning", uppdaterad: "Uppdaterad bekräftelse", avbokning: "Avbokning", fritt: "Eget mejl",
};

export const PLATSHALLARE: [string, string][] = [
  ["{kontakt}", "Kontaktpersonens namn"],
  ["{foretag}", "Företag eller sällskap"],
  ["{foretag_eller_er}", "Företaget, annars ”er”"],
  ["{rubrik_eller_typ}", "Bokningens rubrik, annars typen (t.ex. konferens)"],
  ["{antal}", "Antal gäster"],
  ["{svara_senast}", "Sista svarsdatum"],
  ["{nummer}", "Bokningsnummer"],
  ["{tjanster}", "Alla tjänster med datum, tid och lokal — en rad per tjänst"],
  ["{onskemal}", "Kundens önskemål"],
];

const DAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const langt = (d: string) => { const x = new Date(d + "T12:00:00"); return `${DAG[x.getDay()]} ${x.getDate()} ${MAN[x.getMonth()]} ${x.getFullYear()}`; };
const stor = (t: string) => t.replace(/^./, (c) => c.toUpperCase());
const dagEfter = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };

/** "Lördag 6 december 2026, kl. 09.00–16.00 · Konferens i Salongen · 20 personer" */
export function tjanstRad(d: Del, lokalNamn: (id: string) => string, enhetNamn: (id: string) => string) {
  const nar = d.typ === "boende"
    ? `${stor(langt(d.fran))} – ${langt(dagEfter(d.till))}`
    : `${stor(langt(d.fran))}${d.till !== d.fran ? ` – ${langt(d.till)}` : ""}${d.tid_fran ? `, kl. ${tid(d.tid_fran)}${d.tid_till ? "–" + tid(d.tid_till) : ""}` : ""}`;
  const var_ = [...d.lokal_ids.map(lokalNamn), ...d.enhet_ids.map(enhetNamn)].join(", ");
  const vad = d.beskrivning || DELTYP[d.typ];
  return `${nar} · ${vad}${var_ ? ` (${var_})` : ""}${d.antal ? ` · ${d.antal} personer` : ""}`;
}

export function fyllMall(t: string, a: Arende, delar: Del[], lokalNamn: (id: string) => string, enhetNamn: (id: string) => string) {
  const v: Record<string, string> = {
    "{kontakt}": a.kund_namn || a.kund_foretag || "",
    "{foretag}": a.kund_foretag || "",
    "{foretag_eller_er}": a.kund_foretag || "er",
    "{rubrik_eller_typ}": a.rubrik || ARENDETYP[a.typ]?.toLowerCase() || "bokning",
    "{antal}": a.antal_gaster != null ? String(a.antal_gaster) : "—",
    "{svara_senast}": a.svara_senast ? langt(a.svara_senast) : "[sista svarsdatum]",
    "{nummer}": String(a.nummer),
    "{tjanster}": delar.length ? delar.map((d) => "– " + tjanstRad(d, lokalNamn, enhetNamn)).join("\n") : "[inga tjänster inlagda]",
    "{onskemal}": a.onskemal || "",
  };
  return Object.entries(v).reduce((s, [k, x]) => s.split(k).join(x), t);
}

/** Bästa mallen för ett syfte och en bokningstyp. */
export const valjMall = (mallar: Mejlmall[], syfte: string, typ: string) =>
  mallar.find((m) => m.syfte === syfte && m.typ === typ) ?? mallar.find((m) => m.syfte === syfte && !m.typ) ?? mallar.find((m) => m.syfte === syfte);
