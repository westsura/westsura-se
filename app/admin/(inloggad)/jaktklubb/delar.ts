/** Delas av server och klient — får inte importera något som kräver next/headers. */

export type Niva = { id: string; namn: string; beskrivning: string | null; avgift: number; platser: number; ordning: number };
export type Sasong = { id: string; namn: string; fran: string; till: string; moms: number };
export type Medlem = {
  id: string; anvandare_id: string | null;
  namn: string; epost: string; telefon: string; ort: string | null;
  jakterfarenhet: string; hund: string | null; meddelande: string | null;
  status: string; sasong_id: string | null; niva_id: string | null; onskad_niva_id: string | null;
  underlag_id: string | null; kurs_genomford: boolean; anteckning: string | null; skapad: string;
};
export type Klubbmeddelande = { id: string; rubrik: string; text: string; datum: string; publicerad: boolean };
export type Dokument = { id: string; medlem_id: string; typ: string; fil: string; giltig_till: string | null; status: string; kommentar: string | null; granskad: string | null };

export const MEDLEMSSTATUS: Record<string, string> = {
  sokande: "Sökande", vantelista: "Väntelista", godkand: "Medlem", avslutad: "Avslutad", avbojd: "Avböjd",
};

export const DOKUMENT: { typ: string; namn: string }[] = [
  { typ: "jaktkort", namn: "Statligt jaktkort" },
  { typ: "id", namn: "ID-handling" },
  { typ: "algskyttemarke", namn: "Älgskyttemärke" },
];

export const DOKUMENTSTATUS: Record<string, string> = {
  saknas: "Saknas", inskickad: "Inskickad", godkand: "Godkänd", underkand: "Underkänd",
};

export const datumtid = (d: string) => new Date(d).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });

/** Jaktåret löper 1 juli–30 juni. Förslaget när ett jaktkort godkänns. */
export function jaktaretsSlut(d = new Date()) {
  const ar = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
  return `${ar}-06-30`;
}
