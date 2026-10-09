/** Sittningar — delas av server och klient. */

export type Sittning = { id: string; datum: string; tid: string | null; platser: number; pris: number | null; kvar: number };

/**
 * Vad gästen ser om platserna. Antal visas aldrig — bara knapphet:
 * "Få platser kvar" när högst en femtedel (minst 4) återstår.
 */
export function platsstatus(kvar: number, platser: number): { text: string; full: boolean; fa: boolean } {
  if (kvar <= 0) return { text: "Fullbokat — väntelista", full: true, fa: false };
  if (kvar <= Math.max(4, Math.ceil(platser * 0.2))) return { text: "Få platser kvar", full: false, fa: true };
  return { text: "Platser kvar", full: false, fa: false };
}

const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const DAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
export const dagRubrik = (iso: string) => { const d = new Date(iso + "T12:00:00"); return `${DAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())} ${d.getDate()} ${MAN[d.getMonth()]}`; };
