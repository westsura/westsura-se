/** Vak & pyrsch — typer och etiketter som delas av server och klient. Får inte importera next/headers. */

export type Omrade = {
  id: string; namn: string; typ: "torn" | "vakplats" | "pyrschomrade" | "pass" | "samling";
  beskrivning: string | null; vagbeskrivning: string | null;
  nord: number | null; ost: number | null; aktiv: boolean; ordning: number;
};

export type Utbud = {
  id: string; datum: string; typ: "vak" | "pyrsch" | "bada"; omrade_id: string | null;
  pris: number; platser: number; beskrivning: string | null; publicerad: boolean;
  /** 'medlem' = bara medlemmar, 'alla' = även gästjägare (syns på /jakt). */
  synlighet: "medlem" | "alla"; kvar?: number;
};

export const SYNLIGHET: Record<Utbud["synlighet"], string> = { medlem: "Bara medlemmar", alla: "Medlemmar och gäster" };

export type Vakbokning = {
  id: string; jagare_id: string; utbud_id: string | null; sasong_id: string | null;
  datum: string; typ: "vak" | "pyrsch"; onskat_omrade_id: string | null; omrade_id: string | null;
  status: "onskad" | "bekraftad" | "avbojd" | "avbokad"; pris: number;
  meddelande: string | null; svar: string | null; underlag_id: string | null; skapad: string;
};

export const OMRADETYP: Record<Omrade["typ"], string> = { torn: "Torn", vakplats: "Vakplats", pyrschomrade: "Pyrschområde", pass: "Pass (drevjakt)", samling: "Samlingsplats" };
/** Typer som går att tilldela för vak och pyrsch. Pass och samlingsplatser finns för drevjakten och kartan. */
export const VAKTYPER: Omrade["typ"][] = ["torn", "vakplats", "pyrschomrade"];
export const forVak = (o: Omrade) => VAKTYPER.includes(o.typ);
export const VAKTYP: Record<string, string> = { vak: "Vak", pyrsch: "Pyrsch", bada: "Vak eller pyrsch" };
export const VAKSTATUS: Record<Vakbokning["status"], string> = {
  onskad: "Väntar på jaktledaren", bekraftad: "Bekräftad", avbojd: "Avböjd", avbokad: "Avbokad",
};

/** Kvoten per nivå: null = obegränsat, annars antal ingående dygn per säsong. */
export function vakPris(niva: { vakdygn_ingar: number | null; vakdygn_pris: number } | null, anvanda: number) {
  if (!niva) return 0;
  if (niva.vakdygn_ingar == null) return 0;
  return anvanda < niva.vakdygn_ingar ? 0 : niva.vakdygn_pris;
}

export const kr = (n: number) => (n === 0 ? "Ingår" : n.toLocaleString("sv-SE") + " kr");
