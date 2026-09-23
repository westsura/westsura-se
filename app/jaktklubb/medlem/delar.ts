/** Delas av server och klient — får inte importera något som kräver next/headers. */

/** `medlem: false` = syns även för gästjägare. */
export const FLIKAR: { href: string; label: string; kort: string; medlem?: boolean; gastLabel?: string }[] = [
  { href: "/jaktklubb/medlem", label: "Översikt", kort: "Hem" },
  { href: "/jaktklubb/medlem/boka", label: "Boka jakt", kort: "Boka jakt" },
  { href: "/jaktklubb/medlem/vak", label: "Vak & pyrsch", kort: "" },
  { href: "/jaktklubb/medlem/bokningar", label: "Mina bokningar", kort: "Bokningar" },
  { href: "/jaktklubb/medlem/dokument", label: "Marker & dokument", kort: "", medlem: true },
  { href: "/jaktklubb/medlem/sakerhetskurs", label: "Säkerhetskurs", kort: "" },
  { href: "/jaktklubb/medlem/medlemskap", label: "Mitt medlemskap", kort: "Profil", gastLabel: "Mitt jägarkonto" },
];
export const flikarFor = (arMedlem: boolean) => FLIKAR.filter((f) => arMedlem || !f.medlem).map((f) => ({ ...f, label: !arMedlem && f.gastLabel ? f.gastLabel : f.label }));

export const DOKUMENT: { typ: string; namn: string; hjalp: string }[] = [
  { typ: "jaktkort", namn: "Statligt jaktkort", hjalp: "Kopia på giltigt inlöst jaktkort för säsongen." },
  { typ: "id", namn: "ID-handling", hjalp: "Körkort, pass eller nationellt id-kort." },
  { typ: "algskyttemarke", namn: "Älgskyttemärke", hjalp: "Intyg eller märke från årets skjutprov." },
];

export const MAX_MB = 10;
export const TILLATNA = ["application/pdf", "image/jpeg", "image/png"];

/** '2026/2027' → '2026 / 27', som i sidhuvudet. */
export const sasongKort = (namn?: string | null) => {
  const d = (namn ?? "").split("/");
  return d.length === 2 ? `${d[0]} / ${d[1].slice(2)}` : namn ?? "";
};

/** Årstiden som etiketten på översikten använder. */
export function sasongsdel(d = new Date()) {
  const m = d.getMonth();
  if (m >= 8 && m <= 10) return "hösten";
  if (m === 11 || m <= 1) return "vintern";
  if (m >= 2 && m <= 4) return "våren";
  return "sommaren";
}

export const VECKODAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
export const MANAD = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

/** '2026-09-20' → '20 september 2026' */
export const langtDatum = (d: string) => {
  const dt = new Date(d);
  return `${dt.getDate()} ${MANAD[dt.getMonth()]} ${dt.getFullYear()}`;
};

export const ANMALANSTATUS: Record<string, string> = {
  bekraftad: "● Bokad", anmald: "● Anmäld", vantelista: "● Kölista", avbokad: "● Avbokad",
};
/** Statusraden i det gröna kortet sätts i versaler, som i designen. */
