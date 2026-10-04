/** Adminroller och de områden de ger. Ingen serverkod här — filen används även i klientkomponenter. */

export type Roll = "superadmin" | "vardskap" | "ekonomi" | "kommunikation" | "jaktadmin" | "jaktledare" | "butik" | "tomter";

/** De områden en admin kan få tillgång till, i den ordning de visas på Användare. */
export const OMRADEN: { roll: Roll; namn: string; ger: string }[] = [
  { roll: "vardskap", namn: "Boende & bokningar", ger: "Kalender, bokningar, förfrågningar, kurser, tillfällen, Westsuras Vänner" },
  { roll: "ekonomi", namn: "Ekonomi", ger: "Priser och fakturering" },
  { roll: "jaktadmin", namn: "Jakt", ger: "Jaktklubben, vak & pyrsch, avskjutning, säkerhetskurs, tillfällen" },
  { roll: "kommunikation", namn: "Vänner & nyhetsbrev", ger: "Westsuras Vänner" },
  { roll: "superadmin", namn: "Allt", ger: "Hela admin, även användare och behörigheter" },
];

export const ROLLNAMN: Record<string, string> = Object.fromEntries(OMRADEN.map((o) => [o.roll, o.namn]));
