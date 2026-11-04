/** Intern bokningshantering i admin: typer, statusar och färger som delas av lista, detaljsida och kalender. */

export const ARENDETYP: Record<string, string> = {
  boende: "Boende", konferens: "Konferens", middag: "Middag", evenemang: "Evenemang", privat: "Privat arrangemang", intern: "Intern aktivitet",
};
export const ARENDESTATUS: Record<string, string> = {
  forfragan: "Förfrågan", preliminar: "Preliminär", bekraftad: "Bekräftad", avbokad: "Avbokad",
};
/** Typ av del (tjänst) i en bokning. */
export const DELTYP: Record<string, string> = {
  konferens: "Konferens", middag: "Middag", boende: "Boende", evenemang: "Evenemang", aktivitet: "Aktivitet", intern: "Intern aktivitet",
};

/** Kalenderns kategorier — färg per typ, statusen syns som fyllnad (se .kal-post i CSS). */
export const KATEGORI: Record<string, { namn: string; farg: string }> = {
  boende: { namn: "Boende", farg: "#2e5547" },
  konferens: { namn: "Konferens", farg: "#b68e40" },
  middag: { namn: "Middag", farg: "#8a4b3a" },
  evenemang: { namn: "Evenemang", farg: "#5f7f9a" },
  privat: { namn: "Privat arrangemang", farg: "#7a5a8c" },
  intern: { namn: "Internt", farg: "#7d7d73" },
  jakt: { namn: "Jakt & kurser", farg: "#4f6b3a" },
};

export type Arende = {
  id: string; nummer: number; typ: string; status: string; rubrik: string | null;
  kund_namn: string | null; kund_foretag: string | null; kund_epost: string | null; kund_telefon: string | null;
  antal_gaster: number | null; svara_senast: string | null; onskemal: string | null; anteckningar: string | null;
  mejllage: string; fakturastatus: string; forfragan_id: string | null; bokning_id: string | null;
  skapad: string; uppdaterad: string;
};
export type Del = {
  id: string; arende_id: string; typ: string; fran: string; till: string; tid_fran: string | null; tid_till: string | null;
  enhet_ids: string[]; lokal_ids: string[]; antal: number | null; beskrivning: string | null; blockerar: boolean;
};

/** Namn att visa: rubrik, företag eller kund. */
export const arendeNamn = (a: Pick<Arende, "rubrik" | "kund_namn" | "kund_foretag" | "typ">) =>
  a.typ === "intern" ? a.rubrik || "Intern aktivitet" : [a.kund_foretag || a.kund_namn, a.rubrik].filter(Boolean).join(" · ") || "Utan namn";

/** "09:00:00" → "09.00" */
export const tid = (t: string | null) => (t ? t.slice(0, 5).replace(":", ".") : "");

/** Preliminär bokning vars sista svarsdatum passerat eller är inom två dagar. */
export function foljUpp(a: Pick<Arende, "status" | "svara_senast">, idag = new Date().toISOString().slice(0, 10)) {
  if (a.status !== "preliminar" || !a.svara_senast) return null;
  const dagar = Math.round((new Date(a.svara_senast + "T12:00:00").getTime() - new Date(idag + "T12:00:00").getTime()) / 86400000);
  if (dagar < 0) return { niva: "passerat" as const, text: `Svarsdatum passerat (${-dagar} d)` };
  if (dagar <= 2) return { niva: "snart" as const, text: dagar === 0 ? "Svar senast i dag" : `Svar senast om ${dagar} d` };
  return null;
}
