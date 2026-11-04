import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Hero } from "@/components/Blocks";
import KursBokning, { type Kurs } from "@/components/KursBokning";
import { supabasePublik } from "@/lib/supabase";
import { site } from "@/lib/site";

export const revalidate = 60;

type KursSida = Kurs & {
  med_boende: boolean; publicerad: boolean; ingress: string | null; beskrivning: string | null; bild: string | null; bild_alt: string | null;
  kursledare: string | null; ingar: string | null; villkor: string | null;
};
const STANDARDBILD = "/bilder/herrgarden.jpg";
const FALT = "id, namn, datum_text, platser, oppen, pris_dubbel, pris_enkel, earlybird_dubbel, earlybird_enkel, earlybird_till, med_boende, publicerad, ingress, beskrivning, bild, bild_alt, kursledare, ingar, villkor";

async function hamta(id: string): Promise<KursSida | null> {
  const db = supabasePublik();
  const { data } = await db.from("kurs").select(FALT).eq("id", id).eq("publicerad", true).maybeSingle();
  if (!data) return null;
  const { data: kvar } = await db.rpc("kurs_platser_kvar", { k: id });
  return { ...(data as Omit<KursSida, "kvar">), kvar: typeof kvar === "number" ? kvar : data.platser };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const k = id === "naturfoto" ? null : await hamta(id);
  if (!k) return { title: "Kursen hittades inte" };
  const beskrivning = `${k.datum_text} på Westsura Herrgård. ${k.ingress ?? ""}`.slice(0, 160);
  return {
    title: `${k.namn} — kurs på Westsura Herrgård`, description: beskrivning, alternates: { canonical: `/kurser/${k.id}` },
    openGraph: { type: "website", locale: "sv_SE", siteName: site.name, url: `/kurser/${k.id}`, title: k.namn, description: beskrivning, images: [{ url: k.bild ?? STANDARDBILD, alt: k.bild_alt ?? k.namn }] },
  };
}

/** En kurs med egen sida: text, vad som ingår, pris och bindande bokning. */
export default async function KursSidan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "naturfoto") permanentRedirect("/paket/naturfoto");
  const k = await hamta(id);
  if (!k) notFound();
  const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";
  const bild = k.bild ?? STANDARDBILD;
  const stycken = (k.beskrivning ?? "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const ingar = (k.ingar ?? "").split("\n").map((x) => x.trim()).filter(Boolean);
  const ebDatum = k.earlybird_till ? new Date(k.earlybird_till + "T12:00:00").toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" }) : null;
  const ebAktiv = !!k.earlybird_till && new Date().toISOString().slice(0, 10) <= k.earlybird_till;

  return (
    <>
      <Hero remote={bild.startsWith("http")} src={bild} alt={k.bild_alt ?? k.namn} sub label={`Kurs · ${k.datum_text}`} title={k.namn.toLowerCase()} lede={k.ingress ?? undefined} />

      <section className="section">
        <div className="container split split--start split--form">
          <div className="prose">
            <p className="label">{k.datum_text} · Westsura Herrgård, Surahammar</p>
            {stycken.map((p, i) => p.startsWith("#")
              ? <h2 key={i} className="lower">{p.replace(/^#+\s*/, "").toLowerCase()}</h2>
              : <p key={i} style={{ whiteSpace: "pre-line" }}>{p}</p>)}
            {!!ingar.length && (
              <>
                <p className="label paket__ingar">Det här ingår</p>
                <ul className="ticks">{ingar.map((x) => <li key={x}>{x}</li>)}</ul>
              </>
            )}
            {k.kursledare && (
              <details className="faq"><summary>Om kursledaren</summary><p style={{ whiteSpace: "pre-line" }}>{k.kursledare}</p></details>
            )}
            <details className="faq">
              <summary>Bokningsvillkor</summary>
              {k.villkor
                ? <p style={{ whiteSpace: "pre-line" }}>{k.villkor}</p>
                : <>
                    <p>Bokningen är bindande och betalning sker i samband med bokning, mot faktura. Om du får förhinder går det bra att överlåta din plats till någon annan utan extra kostnad — meddela oss namn och kontaktuppgifter till den som tar över platsen.</p>
                    <p>Westsura Herrgård förbehåller sig rätten att ställa in kursen om det inte blir tillräckligt många deltagare. Vid inställd kurs återbetalas hela det inbetalda beloppet.</p>
                  </>}
            </details>
          </div>

          <div className="card card--accent">
            <p className="label">Pris och bokning</p>
            {k.med_boende ? (
              <table className="admin__table" style={{ marginBottom: 12 }}>
                <thead><tr><th></th><th className="num">Delat dubbelrum</th><th className="num">Enkelrum</th></tr></thead>
                <tbody>
                  {k.earlybird_dubbel != null && k.earlybird_till && (
                    <tr style={ebAktiv ? undefined : { opacity: 0.5 }}><td><b>Early Bird</b><br /><small>bokning senast {ebDatum}</small></td><td className="num">{kr(k.earlybird_dubbel)}</td><td className="num">{kr(k.earlybird_enkel ?? k.pris_enkel)}</td></tr>
                  )}
                  <tr><td><b>Ordinarie pris</b></td><td className="num">{kr(k.pris_dubbel)}</td><td className="num">{kr(k.pris_enkel)}</td></tr>
                </tbody>
              </table>
            ) : (
              <p className="price price--lg">
                {ebAktiv && k.earlybird_dubbel != null ? <>{kr(k.earlybird_dubbel)}<small>per person · Early Bird t.o.m. {ebDatum} (ordinarie {kr(k.pris_dubbel)})</small></> : <>{kr(k.pris_dubbel)}<small>per person</small></>}
              </p>
            )}
            <p className="small">Pris per person. Begränsat antal platser.</p>
            <KursBokning kurs={k} />
          </div>
        </div>
      </section>

      <section className="section section--tight tint">
        <div className="container center">
          <p className="lede mb-0">Frågor om kursen? Ring <a href={site.phoneHref}>{site.phone}</a>. <Link href="/paket">Se alla paket och kurser →</Link></p>
        </div>
      </section>
    </>
  );
}
