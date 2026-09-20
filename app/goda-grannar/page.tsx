import type { Metadata } from "next";
import Image from "next/image";
import { PageHead } from "@/components/Blocks";

export const metadata: Metadata = {
  title: "Goda grannar — producenter och hantverkare vi arbetar med",
  description: "Maten och dryckerna på Westsura Herrgård kommer så långt det går från trakten. Här är producenterna och hantverkarna vi samarbetar med: Hantverksbryggeriet, Köpings Musteri, Bodas Keramik med flera.",
  alternates: { canonical: "/goda-grannar" },
};

const partners = [
  { namn: "Hantverksbryggeriet", kategori: "Dryck", text: "Öl från Västerås som serveras i matsalen och vid festerna.", url: "https://hantverksbryggeriet.se" },
  { namn: "Köpings Musteri", kategori: "Dryck", text: "Must och cider från Köping — i frukostkorgen och som alkoholfritt alternativ vid bordet.", url: "https://kopingsmusteri.se" },
  { namn: "Bodas Keramik", kategori: "Hantverk", text: "Keramikverkstad med öppen ateljé under höstdagen och julmarknaden.", url: "#" },
];

export default function GodaGrannar() {
  return (
    <>
      <PageHead label="Goda grannar" title="i samarbete med trakten" lede="Maten och dryckerna på Westsura kommer så långt det går från producenter i närheten. Här är några av dem vi arbetar med." />
      <section className="section--after-head">
        <div className="container">
          <div className="grid grid-3">
            {partners.map((p) => (
              <article key={p.namn} className="card">
                <p className="label label--tight">{p.kategori}</p>
                <h3>{p.namn}</h3>
                <p className="small">{p.text}</p>
                <a className="link-more" href={p.url} rel="noopener" target="_blank">Besök {p.namn} →</a>
              </article>
            ))}
          </div>
          <div className="split split--after">
            <div className="fig fig--43">
              <Image src="/bilder/lingon.jpg" alt="Skålar med lingon och groddar i köket" fill sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
            <div>
              <h2 className="lower">därför</h2>
              <p>Måltiderna på herrgården ska berätta om platsen, årstiderna och människorna bakom råvarorna. Det går inte att göra med varor från andra sidan jorden. Därför köper vi från grannarna — och därför lyfter vi fram dem här.</p>
              <p className="mb-0">Är du producent i trakten och vill samarbeta? Hör av dig till <a href="mailto:boka@westsura.se">boka@westsura.se</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
