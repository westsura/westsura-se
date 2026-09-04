import Link from "next/link";
import Image from "next/image";
import { site, kungCitat } from "@/lib/site";

/* ---------- Hero ---------- */
export function Hero({
  src, alt, label, title, lede, sub = false, remote = false,
}: { src: string; alt: string; label?: string; title: string; lede?: string; sub?: boolean; remote?: boolean }) {
  return (
    <section className={`hero${sub ? " hero--sub" : ""}`}>
      <div className="hero__img">
        {remote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} />
        ) : (
          <Image src={src} alt={alt} fill sizes="100vw" priority style={{ objectFit: "cover" }} />
        )}
      </div>
      <div className="hero__inner">
        <div className="container">
          {label && <p className="label">{label}</p>}
          <h1>{title}</h1>
          {lede && <p className="lede">{lede}</p>}
        </div>
      </div>
    </section>
  );
}

/* ---------- Sidhuvud utan bild ---------- */
export function PageHead({ label, title, lede }: { label?: string; title: string; lede?: string }) {
  return (
    <div className="container">
      <div className="page-head">
        {label && <p className="label">{label}</p>}
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
    </div>
  );
}

/* ---------- Vapnet ----------
   Westsura Herrgårds vapen (Sven-Åke Larsson & riksheraldikern, ca 2000).
   "linje" = enfärgad linjeteckning som tar färg från `color`; "skold" = bara skölden; "farg" = fullfärg. */
export function Vapen({ variant = "linje", size = 240, className, style }: { variant?: "linje" | "skold" | "farg"; size?: number; className?: string; style?: React.CSSProperties }) {
  if (variant === "farg") {
    return <Image className={className} src="/bilder/vapen.png" alt="Westsura Herrgårds vapen" width={size} height={Math.round(size * 0.985)} style={style} />;
  }
  const src = variant === "skold" ? "/bilder/skold-linje.svg" : "/bilder/vapen-linje.svg";
  const ratio = variant === "skold" ? 626 / 497 : 1269 / 1288;
  return (
    <span className={`vapen${className ? " " + className : ""}`} aria-hidden style={{ width: size, height: Math.round(size * ratio), WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, ...style }} />
  );
}

/* ---------- Kungens almanacka ---------- */
export function Kung() {
  return (
    <section className="kung" id="almanackan">
      <Vapen className="kung__art" size={470} />
      <div className="container">
        <p className="label">Ur Karl XI:s almanacka · 1687</p>
        <blockquote>
          ”{kungCitat}”
          <cite>Karl XI, på jaktresa genom Västmanland</cite>
        </blockquote>
      </div>
    </section>
  );
}

/* ---------- Hundvänligt ---------- */
export function DogBand({ short = false }: { short?: boolean }) {
  return (
    <section className="section section--tight dark">
      <div className="container split">
        <div style={{ aspectRatio: "5 / 4", overflow: "hidden", position: "relative" }}>
          <Image src="/bilder/hund.jpg" alt="Hund och barn i soffan på herrgården" fill sizes="(max-width: 860px) 100vw, 50vw" style={{ objectFit: "cover", objectPosition: "50% 22%" }} />
        </div>
        <div>
          <p className="label">Hunden följer med</p>
          <h2 className="lower" style={{ color: "var(--ws-cream)" }}>samtliga rum är hundvänliga</h2>
          <p>Hos oss är hunden välkommen i alla gästrum, utan tillägg och utan undantag — och gärna upp i soffan, om ni lägger en filt under.</p>
          {!short && (
            <p>Hunden är välkommen även när vi firar. Känn efter om er hund trivs i sällskap med många människor inomhus, och hör av er i förväg så ordnar vi en lugn plats där den kan dra sig undan en stund.</p>
          )}
          <p style={{ marginBottom: 0 }}><Link className="link-more" href="/hundar" style={{ color: "var(--ws-gold-400)", borderColor: "rgba(215,174,98,.5)" }}>Läs om hundar på Westsura →</Link></p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Ring oss / förfrågan ---------- */
export function CtaRow({ primaryHref = "/event#forfragan", primaryLabel = "Skicka en förfrågan" }: { primaryHref?: string; primaryLabel?: string }) {
  return (
    <div className="cta-row">
      <Link className="btn" href={primaryHref}>{primaryLabel}</Link>
      <a className="btn btn--ghost" href={site.phoneHref}>Ring {site.phone}</a>
    </div>
  );
}

/* ---------- Ornament ---------- */
export function Ornament() {
  return (
    <div className="ornament">
      <Image src="/bilder/herrgard-linje-gron.png" alt="" aria-hidden width={553} height={231} />
    </div>
  );
}
