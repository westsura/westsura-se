import { site } from "@/lib/site";

/**
 * Kurser och aktiviteter: standardtexter för mejl och villkor, och platshållare som fylls i
 * från bokningen. Texterna kan skrivas om per aktivitet i admin.
 */

export const BETALNING: Record<string, string> = { faktura: "Faktura", swish: "Swish i förskott" };
export const KURSSTATUS: Record<string, string> = { bokad: "Bokad (faktura)", vantar: "Väntar på Swish", bekraftad: "Bekräftad", avbokad: "Avbokad" };

export const MEJLPLATSHALLARE: [string, string][] = [
  ["{namn}", "Bokarens namn"],
  ["{aktivitet}", "Aktivitetens namn"],
  ["{datum}", "Datum som visas på sajten"],
  ["{bokning}", "Sammanfattning: antal, ev. barn och rum, pris och totalsumma"],
  ["{summa}", "Totalbelopp"],
  ["{swish}", "Westsuras Swishnummer"],
  ["{nummer}", "Bokningsnummer"],
  ["{telefon}", "Westsuras telefonnummer"],
];

export function standardMejlBokning(betalning: string) {
  return betalning === "swish"
    ? `Hej {namn}!

Tack för din bokning av {aktivitet}, {datum}.

{bokning}

Säkra din plats genom att swisha {summa} till {swish} (Westsura Herrgård). Skriv ditt namn och bokningsnummer {nummer} i meddelandet. Platsen är din när betalningen har kommit in — då får du en bekräftelse från oss.

Frågor? Svara på det här mejlet eller ring {telefon}.`
    : `Hej {namn}!

Tack för din bokning av {aktivitet}, {datum}.

{bokning}

Bokningen är bindande. Faktura skickas separat och betalas inom tio dagar. Får du förhinder kan du överlåta platsen till någon annan utan kostnad — meddela oss namn och kontaktuppgifter.

Vi skickar program och praktisk information närmare dagen. Frågor? Svara på det här mejlet eller ring {telefon}.`;
}

export const STANDARD_BEKRAFTELSE = `Hej {namn}!

Tack — vi har tagit emot din betalning, och din plats på {aktivitet}, {datum}, är bekräftad.

{bokning}

Vi skickar program och praktisk information närmare dagen. Frågor? Svara på det här mejlet eller ring {telefon}.

Varmt välkommen!`;

export function standardVillkor(betalning: string) {
  return betalning === "swish"
    ? `Bokningen är bindande när betalningen har kommit in. Betalning sker i förskott med Swish till ${site.swish}. Får du förhinder går det bra att överlåta din plats till någon annan utan extra kostnad — meddela oss namn och kontaktuppgifter till den som tar över platsen.

Westsura Herrgård förbehåller sig rätten att ställa in vid för få deltagare. Då återbetalas hela beloppet.`
    : `Bokningen är bindande och betalning sker i samband med bokning, mot faktura. Får du förhinder går det bra att överlåta din plats till någon annan utan extra kostnad — meddela oss namn och kontaktuppgifter till den som tar över platsen.

Westsura Herrgård förbehåller sig rätten att ställa in vid för få deltagare. Då återbetalas hela beloppet.`;
}

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

/** Sammanfattningen som {bokning} blir. */
export function bokningsrader(o: { antal: number; barn: number; rum: string | null; prisPerPerson: number; barnpris: number | null; barnAlder: string | null; summa: number; nummer: number; earlybird: boolean }) {
  const vuxna = o.antal - o.barn;
  return [
    `Bokningsnummer: ${o.nummer}`,
    o.barn ? `Deltagare: ${vuxna} vuxna och ${o.barn} barn${o.barnAlder ? ` (${o.barnAlder})` : ""}` : `Deltagare: ${o.antal}`,
    o.rum ? `Boende: ${o.rum}` : null,
    o.barn ? `Pris: ${vuxna} × ${kr(o.prisPerPerson)} + ${o.barn} × ${kr(o.barnpris ?? o.prisPerPerson)}${o.earlybird ? " (Early Bird)" : ""}` : `Pris: ${kr(o.prisPerPerson)} per person${o.earlybird ? " (Early Bird)" : ""}`,
    `Totalt: ${kr(o.summa)}`,
  ].filter(Boolean).join("\n");
}

export function fyllAktivitetsmejl(t: string, v: { namn: string; aktivitet: string; datum: string; bokning: string; summa: number; nummer: number }) {
  return t.split("{namn}").join(v.namn).split("{aktivitet}").join(v.aktivitet).split("{datum}").join(v.datum)
    .split("{bokning}").join(v.bokning).split("{summa}").join(kr(v.summa)).split("{swish}").join(site.swish)
    .split("{nummer}").join(String(v.nummer)).split("{telefon}").join(site.phone);
}

/** "barn 4–12 år" — åldersspannet som det visas. */
export const barnAlderText = (fran: number | null, till: number | null) =>
  fran != null && till != null ? `barn ${fran}–${till} år` : till != null ? `barn upp till ${till} år` : fran != null ? `barn från ${fran} år` : "barn";
