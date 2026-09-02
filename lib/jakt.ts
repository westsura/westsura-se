import type { Tillfalle } from "@/components/Tillfallen";

/* Utlysta tillfällen. Exempel tills kalendern finns i databasen (etapp II). */
export const jakttillfallen: Tillfalle[] = [
  { id: "j1", datum: "2026-10-10", tid: "07.00–15.00", titel: "Drevjakt på vildsvin", typ: "Jakttillfälle", platser: 4, pris: "2 900 kr",
    text: "Gemensam jaktdag på herrgårdens marker med samling i biblioteket, genomgång och lunch i fält. Passar erfarna jägare med giltigt vapenlicens och jägarexamen." },
  { id: "j2", datum: "2026-11-07", tid: "07.00–15.00", titel: "Drevjakt på vildsvin och rådjur", typ: "Jakttillfälle", platser: 0, pris: "2 900 kr",
    text: "Höstens andra gemensamma jaktdag. Middag i matsalen efteråt för den som vill stanna." },
  { id: "j3", datum: "2026-11-21", tid: "Från kl. 15.00", titel: "Vakjakt på vildsvin, kväll", typ: "Jakttillfälle", platser: 2, pris: "1 800 kr",
    text: "Kvällspass från torn med jaktledare. Övernattning i flyglarna kan bokas till." },
];

export const hundtraning: Tillfalle[] = [
  { id: "h1", datum: "2026-09-27", tid: "09.00–15.00", titel: "Apportering för nybörjare", typ: "Hundträning", platser: 5, pris: "950 kr",
    text: "Grunderna i apportering för unga hundar och förare. Små grupper, mycket praktik, fika i herrgården." },
  { id: "h2", datum: "2026-10-18", tid: "09.00–15.00", titel: "Spår och eftersök", typ: "Hundträning", platser: 3, pris: "1 150 kr",
    text: "Träningsdag för hund och förare med fokus på spårarbete i skogsterräng." },
];

export const jaktkurser: Tillfalle[] = [
  { id: "k1", datum: "2026-10-03", tid: "10.00–16.00", titel: "Vilthantering — från fält till kök", typ: "Jaktkurs", platser: 8, pris: "1 495 kr",
    text: "Flåning, styckning och tillagning av vilt. Vi avslutar med middag lagad av dagens råvara." },
  { id: "k2", datum: "2026-11-14", tid: "09.00–16.00", titel: "Säkerhet och skytte inför säsongen", typ: "Jaktkurs", platser: 6, pris: "1 295 kr",
    text: "Teori på förmiddagen, skjutbana på eftermiddagen. Obligatorisk för jaktklubbens medlemmar, öppen för alla." },
];
