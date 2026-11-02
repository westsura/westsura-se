import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero } from "@/components/Blocks";
import Signup from "@/components/Signup";
import Tillfallen from "@/components/Tillfallen";
import Sittningar from "@/components/Sittningar";
import Bildgalleri from "@/components/Bildgalleri";
import { evenemang, nar } from "@/lib/aktuellt";
import { site } from "@/lib/site";

export const revalidate = 300;

const STANDARDBILD = "/bilder/julmarknad-fasad.jpg";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await evenemang(slug);
  if (!e) return { title: "Evenemanget hittades inte" };
  const beskrivning = `${nar(e)}. ${e.ingress ?? e.beskrivning?.split("\n")[0] ?? ""}`.slice(0, 160);
  return {
    title: `${e.titel} — ${nar(e).replace(/ · .*$/, "").toLowerCase()}`,
    description: beskrivning,
    alternates: { canonical: `/aktuellt/${e.slug}` },
    openGraph: {
      type: "website", locale: "sv_SE", siteName: site.name, url: `/aktuellt/${e.slug}`, title: e.titel, description: beskrivning,
      images: [{ url: e.bild ?? STANDARDBILD, alt: e.bild_alt ?? e.titel }],
    },
    twitter: { card: "summary_large_image", images: [e.bild ?? STANDARDBILD] },
  };
}

/** Svensk tidszon för ett datum: +02:00 sommartid, +01:00 vintertid. */
function zon(datum: string) {
  const namn = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Stockholm", timeZoneName: "shortOffset" })
    .formatToParts(new Date(datum + "T12:00:00Z")).find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  return namn.includes("+2") ? "+02:00" : "+01:00";
}

/** "10.00–16.00" → start- och sluttid för Google. Utan sluttid blir slutet samma dag. */
function tider(datum: string, tid: string | null) {
  const m = tid?.match(/(\d{1,2})[.:](\d{2})(?:\s*[–-]\s*(\d{1,2})[.:](\d{2}))?/);
  if (!m) return { start: datum, slut: datum };
  const p = (h: string, mi: string) => `${datum}T${h.padStart(2, "0")}:${mi}:00${zon(datum)}`;
  return { start: p(m[1], m[2]), slut: m[3] ? p(m[3], m[4]) : datum };
}

/**
 * Delar upp brödtexten: inledning före första "## Rubrik", ett avsnitt per rubrik, och
 * "## Praktisk information" som blir faktarutan (rader "Etikett: värde") + avslutande ord.
 */
function delaUpp(beskrivning: string) {
  const stycken = beskrivning.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const intro: string[] = [], avsnitt: { rubrik: string; stycken: string[] }[] = [], fakta: [string, string][] = [], avslut: string[] = [];
  let i = 0, praktiskt = false;
  for (const p of stycken) {
    if (p.startsWith("#")) {
      const rubrik = p.replace(/^#+\s*/, "");
      praktiskt = /^praktisk/i.test(rubrik);
      if (!praktiskt) avsnitt.push({ rubrik, stycken: [] });
      i++; continue;
    }
    if (praktiskt) {
      const rader = p.split("\n").map((r) => r.match(/^([A-ZÅÄÖ][^:]{1,18}):\s+(.+)$/));
      if (rader.every(Boolean)) rader.forEach((m) => fakta.push([m![1], m![2]]));
      else avslut.push(p);
    } else if (i === 0) intro.push(p);
    else avsnitt[avsnitt.length - 1].stycken.push(p);
  }
  return { intro, avsnitt, fakta, avslut };
}

export default async function EvenemangSida({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await evenemang(slug);
  if (!e) notFound();

  const passerat = (e.datum_till ?? e.datum) < new Date().toISOString().slice(0, 10);
  const bild = e.bild ?? STANDARDBILD;
  // Strukturerad data för Google: start vid första sittningen, slut vid sista.
  const forstaS = e.sittningar[0], sistaS = e.sittningar[e.sittningar.length - 1];
  const start = forstaS ? tider(forstaS.datum, forstaS.tid).start : tider(e.datum, e.tid).start;
  const slut = sistaS ? tider(sistaS.datum, sistaS.tid).slut : tider(e.datum_till ?? e.datum, e.tid).slut;
  const ledigt = !e.anmalan || (e.sittningar.length ? e.sittningar.some((s) => s.kvar > 0) : e.kvar > 0);
  const erbjudande = (namn: string, pris: number) => ({
    "@type": "Offer", name: namn, price: pris, priceCurrency: "SEK", url: `${site.url}/aktuellt/${e.slug}`,
    availability: ledigt ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    validFrom: (e.skapad ?? new Date().toISOString()).slice(0, 10),
  });
  const ld = {
    "@context": "https://schema.org", "@type": "Event", name: e.titel, description: e.ingress ?? undefined,
    startDate: start, endDate: slut, image: bild.startsWith("http") ? bild : site.url + bild,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: site.name, address: { "@type": "PostalAddress", streetAddress: "Lisjövägen 50", postalCode: "735 91", addressLocality: "Surahammar", addressCountry: "SE" } },
    organizer: { "@type": "Organization", name: site.name, url: site.url },
    performer: { "@type": "Organization", name: site.name, url: site.url },
    isAccessibleForFree: !e.pris && !e.barnpris,
    ...(e.pris || e.barnpris ? {
      offers: [
        ...(e.pris ? [erbjudande("Vuxen", e.pris)] : []),
        ...(e.barnpris != null ? [erbjudande(`Barn upp till ${e.barn_alder} år`, e.barnpris)] : []),
      ],
    } : {}),
  };
  const text = delaUpp(e.beskrivning ?? "");
  const program = (e.program ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  // Faktarutan: datum, tid, plats och pris från fälten, plus egna rader under "## Praktisk information".
  const fakta: [string, string][] = [
    ["Datum", nar(e).replace(/ · .*$/, "")],
    ...(e.tid && !e.sittningar.length ? [["Tid", e.tid] as [string, string]] : []),
    ["Plats", `${site.name}, Lisjövägen 50, Surahammar`],
    ["Entré", e.pris === 0 ? "Fri entré" : e.pris ? `${e.pris.toLocaleString("sv-SE")} kr per person${e.barnpris != null ? `, barn upp till ${e.barn_alder} år ${e.barnpris.toLocaleString("sv-SE")} kr` : ""}` : "Se texten"],
  ];
  // Det som står i texten vinner — "Söndag 6 december 2026, andra advent" säger mer än bara datumet.
  for (const [k, v] of text.fakta) {
    const finns = fakta.findIndex(([f]) => f.toLowerCase() === k.toLowerCase());
    if (finns >= 0) fakta[finns] = [k, v]; else fakta.push([k, v]);
  }
  // Avsnitten får var sin bild ur galleriet (inte huvudbilden), så länge det räcker.
  const avsnittsbilder = e.bilder.filter((x) => x.src !== bild);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Hero remote={bild.startsWith("http")} src={bild} alt={e.bild_alt ?? e.titel} sub
        label={nar(e)} title={e.titel.toLowerCase()} lede={e.ingress ?? undefined} />

      {/* Inledning + praktisk ruta */}
      <section className="section section--tight">
        <div className="container split split--start ev-intro">
          <div className="prose">
            {passerat && <p className="notice">Det här evenemanget har redan varit. <Link href="/#aktuellt">Se vad som är på gång →</Link></p>}
            {text.intro.map((p, i) => <p key={i} className={i === 0 ? "ev-lede" : undefined}>{p}</p>)}
            {!!program.length && (
              <>
                <h2 className="lower">program</h2>
                <ul className="ev-program">{program.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </>
            )}
          </div>
          <div className="ev-sida">
            {e.anmalan && !passerat && e.sittningar.length > 0 ? (
              <Sittningar tillfalleId={e.id} titel={e.titel} pris={e.pris} barnpris={e.barnpris} barnAlder={e.barn_alder} sittningar={e.sittningar} />
            ) : e.anmalan && !passerat ? (
              <Tillfallen rubrik="Anmälan" barn={e.barnpris != null ? { pris: e.barnpris, alder: e.barn_alder } : null}tillfallen={[{ id: e.id, typ: "evenemang", titel: e.titel, beskrivning: null, datum: e.datum, tid: e.tid, pris: e.pris, vanpris: null, platser: e.platser, kvar: e.kvar }]} />
            ) : null}
            <div className="ev-fakta">
              <p className="label">Praktiskt</p>
              <dl>
                {fakta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              {!e.anmalan && !passerat && <p className="ev-fakta__not">Ingen anmälan behövs — kom när det passar dig.</p>}
              <p className="ev-fakta__not">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("Westsura Herrgård, Lisjövägen 50, Surahammar")}`} target="_blank" rel="noopener">Vägbeskrivning →</a><br />
                Frågor? Ring <a href={site.phoneHref}>{site.phone}</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avsnitten — varannan med bild till vänster, varannan till höger */}
      {text.avsnitt.map((a, i) => {
        const b = avsnittsbilder[i];
        return (
          <section key={a.rubrik} className={`section section--tight${i % 2 === 0 ? " tint" : ""}`}>
            <div className={`container${b ? " split ev-avsnitt" : " narrow"}${b && i % 2 ? " ev-avsnitt--om" : ""}`}>
              {b && (
                <div className="fig fig--45">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.src} alt={b.alt} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div className="prose">
                <h2 className="lower">{a.rubrik.toLowerCase()}</h2>
                {a.stycken.map((p, j) => <p key={j} className={j === 0 && a.stycken.length > 1 && p.length < 60 ? "ev-kicker" : undefined}>{p}</p>)}
              </div>
            </div>
          </section>
        );
      })}

      {text.avslut.length > 0 && (
        <section className="section section--tight">
          <div className="container narrow center">
            {text.avslut.map((p, i) => <p key={i} className="motto">{p}</p>)}
          </div>
        </section>
      )}

      {e.bilder.length > 1 && (
        <section className={`section section--tight${text.avsnitt.length % 2 === 0 ? " tint" : ""}`}>
          <div className="container">
            <p className="label">Bilder</p>
            <h2 className="lower">{passerat ? "så här blev det" : "från förra året"}</h2>
            <Bildgalleri max={12} bilder={e.bilder} rubrik={e.titel} foto={e.bilder.some((x) => x.src.includes("/julmarknad/")) ? "Lizette Kullberg" : undefined} />
          </div>
        </section>
      )}

      <section className="section tint">
        <div className="container narrow center">
          <p className="label">Missa inte nästa</p>
          <h2 className="lower">få inbjudan först</h2>
          <p className="mx-auto">Westsuras Vänner får inbjudan till höstdagar, julmarknad och temakvällar några dagar innan de blir offentliga.</p>
          <Signup />
        </div>
      </section>
    </>
  );
}
