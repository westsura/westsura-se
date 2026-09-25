export const site = {
  name: "Westsura Herrgård",
  url: "https://www.westsura.se",
  phone: "0220-312 30",
  phoneHref: "tel:+4622031230",
  email: "boka@westsura.se",
  address: { street: "Lisjövägen 50", zip: "735 91", city: "Surahammar", region: "Västmanland" },
  company: "Westsura Jakt & Konferens AB",
  orgNr: "559197-2905",
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
    linkedin: "https://www.linkedin.com/",
  },
};

/** Sökmotorer släpps på först när den riktiga domänen är kopplad: sätt INDEXERA=1 i Vercel. */
export const indexera = process.env.INDEXERA === "1";

export const nav = [
  { href: "/boende", label: "Boende" },
  { href: "/konferens", label: "Konferens" },
  { href: "/event", label: "Event" },
  { href: "/jakt", label: "Jakt" },
  { href: "/paket", label: "Paket" },
  { href: "/om-oss", label: "Om oss" },
];

/**
 * Bilder från gamla WordPress-sajten, nu kopierade till public/bilder/wp/ (samma filnamn).
 * Byts mot nya bilder när fotografen varit här.
 */
const wp = "/bilder/wp/";
export const img = {
  heroMatsal: wp + "foretagsfotograf-stockholm-vasteras-brandingfoto-lumavisual-71.jpg",
  sang: wp + "Hemsida-Framsida4-958x1024.jpg",
  sangStor: wp + "Hemsida-Framsida4.jpg",
  skal: wp + "Skal-958x1024.jpg",
  sovrum: wp + "Hemsida-Avlanga-bilder10.jpg",
  fasan: wp + "Hemsida-Framsida3-958x1024.jpg",
  brud: wp + "brud.png",
  konferensrum: wp + "foretagsfotograf-stockholm-vasteras-brandingfoto-lumavisual-21.jpg",
  /* Historiska bilder från Om oss på gamla sajten */
  hist1760: wp + "Westsura_Herrgard.jpg",
  histTersmeden: wp + "PerReinholdTersmeden.jpg",
  hist1928: wp + "westsura-1928-1536x1139.jpg",
  histSkola: wp + "Skogsbruksskola.jpg",
  /* Paketbilder från gamla sajten */
  paketKanotDag: wp + "Div.-mallar-600-x-400-px3.jpg",
  paketKanotKvall: wp + "Div.-mallar-600-x-400-px4.jpg",
  paketGlod: wp + "Laga-mat-utomus-i-Westsura-1.jpg",
  paketGolf: wp + "4.jpg",
  eld: wp + "Mat-over-oppen-eld-wetsura-herrgard.jpg",
};

export const kungCitat =
  "Ätit middag och övernattat hos Erick Christiernin och jagat i Östersura, där jag skjutit en björn.";
