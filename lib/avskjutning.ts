/** Jaktledarvy och avskjutning — typer och etiketter som delas av server och klient. Får inte importera next/headers. */

export type Sat = { id: string; tillfalle_id: string; namn: string; beskrivning: string | null; ordning: number; pass: Pass[] };
export type Pass = { id: string; sat_id: string; nummer: string; plats_id: string | null; anmalan_id: string | null; anteckning: string | null; ordning: number };

/** En deltagare på jaktdagen = en anmälan som inte är avbokad. */
export type Deltagare = {
  id: string; namn: string; epost: string; telefon: string | null; antal: number; status: string; meddelande: string | null;
  jagare_id: string | null; jagare_status: string | null; dokument_ok: boolean; kurs_ok: boolean;
};

export type Skott = {
  id: string; sasong_id: string | null; tillfalle_id: string | null; sat_id: string | null; pass_id: string | null; vakbokning_id: string | null;
  jagare_id: string | null; jagare_namn: string | null; datum: string; tid: string | null;
  vilt: string; antal: number; kon: string; alder: string; resultat: string; vikt: number | null; anteckning: string | null; registrerad_av: string | null; skapad: string;
};

export type Plats = { id: string; namn: string; typ: string };

export const VILT: Record<string, string> = {
  vildsvin: "Vildsvin", radjur: "Rådjur", alg: "Älg", dovhjort: "Dovhjort", kronhjort: "Kronhjort",
  rav: "Räv", hare: "Hare", gravling: "Grävling", fagel: "Fågel", annat: "Annat",
};
export const KON: Record<string, string> = { hane: "Hane", hona: "Hona", okant: "Okänt" };
export const ALDER: Record<string, string> = { vuxen: "Vuxen", fjoling: "Fjoling", arsunge: "Årsunge", okant: "Okänd" };
export const RESULTAT: Record<string, string> = {
  fallt: "Fällt", bom: "Bom", paskjutet: "Påskjutet — eftersök pågår", eftersok_fallt: "Fällt efter eftersök", eftersok_ej_funnet: "Eftersök utan resultat",
};

/** Kort etikett för listor. */
export const resultatKort: Record<string, string> = { fallt: "Fällt", bom: "Bom", paskjutet: "Påskjutet", eftersok_fallt: "Eftersök, fällt", eftersok_ej_funnet: "Eftersök, ej funnet" };

export const fallt = (s: Skott) => s.resultat === "fallt" || s.resultat === "eftersok_fallt";
