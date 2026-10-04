/** Hundekipage — delas av server och klient. */

export const EKIPAGETYP: Record<string, string> = { hundforare: "Hundförare", eftersok: "Eftersöksekipage" };
export const EKIPAGESTATUS: Record<string, string> = { sokande: "Att godkänna", godkand: "Godkänt", avbojd: "Avböjt" };

/** Vad hunden används till. Värdena sparas i hund.driver. */
export const DRIVER: { v: string; t: string }[] = [
  { v: "radjur", t: "Rådjur (drivande)" },
  { v: "vildsvin", t: "Vildsvin" },
  { v: "alg", t: "Älg (ståndskall)" },
  { v: "hare", t: "Hare" },
  { v: "rav", t: "Räv" },
  { v: "fagel", t: "Fågel (stående / apport)" },
];
export const DRIVERNAMN: Record<string, string> = Object.fromEntries(DRIVER.map((d) => [d.v, d.t]));

export type Hund = { id?: string; namn: string; ras: string | null; fodd: number | null; regnr: string | null; driver: string[]; eftersok: boolean; meriter: string | null };
