import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero } from "@/components/Blocks";
import Signup from "@/components/Signup";
import Tillfallen from "@/components/Tillfallen";
import { evenemang, langtDatum } from "@/lib/aktuellt";
import { site } from "@/lib/site";

export const revalidate = 300;

const STANDARDBILD = "/bilder/julmarknad-fasad.jpg";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = await evenemang(slug);
  if (!e) return { title: "Evenemanget hittades inte" };
  const beskrivning = `${langtDatum(e.datum)}${e.tid ? ", " + e.tid : ""}. ${e.ingress ?? e.beskrivning?.split("\n")[0] ?? ""}`.slice(0, 160);
  return {
    title: `${e.titel} — ${langtDatum(e.datum).toLowerCase()}`,
    description: beskrivning,
    alternates: { canonical: `/aktuellt/${e.slug}` },
    openGraph: {
      type: "website", locale: "sv_SE", siteName: site.name, url: `/aktuellt/${e.slug}`, title: e.titel, description: beskrivning,
      images: [{ url: e.bild ?? STANDARDBILD, alt: e.bild_alt ?? e.titel }],
    },
    twitter: { card: "summary_large_image", images: [e.bild ?? STANDARDBILD] },
  };
}

/** "10.00–16.00" → start- och sluttid för Google. */
function tider(datum: string, tid: string | null) {
  const m = tid?.match(/(\d{1,2})[.:](\d{2})(?:\s*[–-]\s*(\d{1,2})[.:](\d{2}))?/);
  if (!m) return { start: datum };
  const p = (h: string, mi: string) => `${datum}T${h.padStart(2, "0")}:${mi}:00+02:00`;
  return { start: p(m[1], m[2]), slut: m[3] ? p(m[3], m[4]) : undefined };
}

export default async function EvenemangSida({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await evenemang(slug);
  if (!e) notFound();

  const passerat = e.datum < new Date().toISOString().slice(0, 10);
  const bild = e.bild ?? STANDARDBILD;
  const t = tider(e.datum, e.tid);
  const ld = {
    "@context": "https://schema.org", "@type": "Event", name: e.titel, description: e.ingress ?? undefined,
    startDate: t.start, endDate: t.slut, image: bild.startsWith("http") ? bild : site.url + bild,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: site.name, address: { "@type": "PostalAddress", streetAddress: "Lisjövägen 50", postalCode: "735 91", addressLocality: "Surahammar", addressCountry: "SE" } },
    organizer: { "@type": "Organization", name: site.name, url: site.url },
    isAccessibleForFree: !e.pris,
    ...(e.pris ? { offers: { "@type": "Offer", price: e.pris, priceCurrency: "SEK", url: `${site.url}/aktuellt/${e.slug}` } } : {}),
  };
  const stycken = (e.beskrivning ?? "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const program = (e.program ?? "").split("\n").map((x) => x.trim()).filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Hero remote={bild.startsWith("http")} src={bild} alt={e.bild_alt ?? e.titel} sub
        label={`${langtDatum(e.datum)}${e.tid ? " · " + e.tid : ""}`} title={e.titel.toLowerCase()} lede={e.ingress ?? undefined} />

      <section className="section section--tight">
        <div className="container split split--start">
          <div className="prose">
            {passerat && <p className="notice">Det här evenemanget har redan varit. <Link href="/#aktuellt">Se vad som är på gång →</Link></p>}
            {stycken.map((p, i) => <p key={i} style={{ whiteSpace: "pre-line" }}>{p}</p>)}
            {!!program.length && (
              <>
                <h2 className="lower">program</h2>
                <ul>{program.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </>
            )}
            <p className="muted">{site.name} · Lisjövägen 50, Surahammar{e.pris === 0 ? " · Fri entré" : e.pris ? ` · ${e.pris.toLocaleString("sv-SE")} kr per person` : ""}</p>
          </div>
          <div>
            {e.anmalan && !passerat ? (
              <Tillfallen rubrik="Anmälan" tillfallen={[{ id: e.id, typ: "evenemang", titel: e.titel, beskrivning: null, datum: e.datum, tid: e.tid, pris: e.pris, vanpris: null, platser: e.platser, kvar: e.kvar }]} />
            ) : (
              <div className="card card--plain">
                <p className="label">{passerat ? "Missa inte nästa" : "Välkommen"}</p>
                <p className="mb-0">{passerat ? "Bli Westsuras Vän så får du inbjudan till nästa evenemang först." : "Ingen anmälan behövs — kom när det passar. Frågor? Ring "}{!passerat && <a href={site.phoneHref}>{site.phone}</a>}{!passerat && "."}</p>
              </div>
            )}
          </div>
        </div>
      </section>

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
