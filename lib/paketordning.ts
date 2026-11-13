/** De fasta paketen på paketsidan (i standardordning). Aktiviteter med egen sida läggs till från databasen. */
export const FASTA_PAKET: { id: string; namn: string }[] = [
  { id: "naturfoto", namn: "Grundkurs i naturfoto" },
  { id: "kanot-dag", namn: "Kanot & Herrgård — dagsäventyret" },
  { id: "kanot-kvall", namn: "Kanot & Herrgård — kvällsturen" },
  { id: "glod", namn: "Från glöd till gourmet" },
  { id: "golf", namn: "Golfpaket" },
];

/**
 * Sorterar paketsidans poster efter sparad ordning. Poster utan sparad plats (t.ex. en ny
 * aktivitet) hamnar sist; finns ingen sparad ordning alls gäller standardlistan
 * (naturfoto, aktiviteterna, sedan övriga fasta paket).
 */
export function sorteraPaket<T extends { id: string }>(poster: T[], ordning: { id: string; ordning: number }[]) {
  const plats = new Map(ordning.map((o) => [o.id, o.ordning]));
  return poster.map((p, i) => ({ p, i })).sort((a, b) => {
    const pa = plats.get(a.p.id), pb = plats.get(b.p.id);
    if (pa != null && pb != null) return pa - pb;
    if (pa != null) return -1;
    if (pb != null) return 1;
    return a.i - b.i;
  }).map((x) => x.p);
}
