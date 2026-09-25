import Link from "next/link";
import { notFound } from "next/navigation";
import { kravAdmin, kr, FAKTURASTATUS } from "@/lib/admin";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import MedlemsKort from "./MedlemsKort";
import Granskning from "./Granskning";
import Redigera from "./Redigera";
import TaBortKnapp from "@/components/TaBortKnapp";
import { taBortJaktmedlem } from "@/app/admin/actions";
import { DOKUMENT, MEDLEMSSTATUS, datumtid, jaktaretsSlut, type Dokument, type Medlem, type Niva, type Sasong } from "../delar";

export const dynamic = "force-dynamic";

export default async function MedlemsSida({ params }: { params: Promise<{ id: string }> }) {
  await kravAdmin("jaktadmin");
  const { id } = await params;
  const db = await supabaseServer();

  const { data: medlem } = await db.from("jaktmedlem").select("*").eq("id", id).maybeSingle<Medlem>();
  if (!medlem) notFound();

  const [{ data: sasong }, { data: niva }, { data: dokument }, { data: nivaerSasong }] = await Promise.all([
    medlem.sasong_id ? db.from("jaktsasong").select("*").eq("id", medlem.sasong_id).maybeSingle<Sasong>() : Promise.resolve({ data: null }),
    medlem.niva_id ? db.from("medlemsniva").select("*").eq("id", medlem.niva_id).maybeSingle<Niva>() : Promise.resolve({ data: null }),
    db.from("medlemsdokument").select("*").eq("medlem_id", id),
    medlem.sasong_id ? db.from("medlemsniva").select("*").eq("sasong_id", medlem.sasong_id).order("ordning") : Promise.resolve({ data: [] }),
  ]);

  // Avgiftsunderlaget når bara vardskap genom RLS — jaktadmin läser det med servicenyckeln.
  const { data: underlag } = medlem.underlag_id
    ? await supabaseAdmin().from("fakturaunderlag").select("id, status, forfallodatum, fortnox_nummer").eq("id", medlem.underlag_id).maybeSingle()
    : { data: null };

  const dok = (typ: string) => (dokument as Dokument[] | null)?.find((d) => d.typ === typ);

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="label"><Link href="/admin/jaktklubb">← Jaktklubben</Link></p>
          <h1 className="admin__h1">{medlem.namn}</h1>
        </div>
        <div className="admin__actions">
          <span className={`pill pill--${medlem.status}`}>{MEDLEMSSTATUS[medlem.status]}</span>
          <TaBortKnapp gor={taBortJaktmedlem.bind(null, medlem.id)} efter="/admin/jaktklubb"
            fraga={`Ta bort ${medlem.namn} helt? Uppladdade dokument, kursförsök och vakbokningar raderas, och inloggningen tas bort. Tidigare anmälningar och skott finns kvar i historiken. Det går inte att ångra.${medlem.status === "godkand" ? "\n\nVill du bara avsluta medlemskapet — använd hellre \"Avsluta medlemskap\" längre ner." : ""}`} />
        </div>
      </header>
      <div style={{ marginBottom: 16 }}><Redigera m={medlem} nivaer={(nivaerSasong ?? []) as Niva[]} /></div>

      <div className="admin__cols">
        <section className="admin__panel">
          <h2 className="admin__h2">Uppgifter</h2>
          <div className="row"><span className="row__main">E-post</span><span className="row__meta">{medlem.epost}</span></div>
          <div className="row"><span className="row__main">Telefon</span><span className="row__meta"><a href={`tel:${medlem.telefon}`}>{medlem.telefon}</a></span></div>
          <div className="row"><span className="row__main">Ort</span><span className="row__meta">{medlem.ort || "—"}</span></div>
          <div className="row"><span className="row__main">Nivå</span><span className="row__meta">{niva ? `${niva.namn} · ${kr(niva.avgift)}` : "—"}</span></div>
          <div className="row"><span className="row__main">Säsong</span><span className="row__meta">{sasong?.namn ?? "—"}</span></div>
          <div className="row"><span className="row__main">Ansökte</span><span className="row__meta">{datumtid(medlem.skapad)}</span></div>
          <div className="row"><span className="row__main">Inloggning kopplad</span><span className="row__meta">{medlem.anvandare_id ? "Ja" : "Inte än"}</span></div>
        </section>

        <section className="admin__panel">
          <h2 className="admin__h2">Avgift</h2>
          {!underlag && <p className="empty">Inget underlag skapat.</p>}
          {underlag && (
            <>
              <div className="row"><span className="row__main">Status</span><span className="row__meta"><span className={`pill pill--${underlag.status}`}>{FAKTURASTATUS[underlag.status]}</span></span></div>
              <div className="row"><span className="row__main">Förfaller</span><span className="row__meta">{underlag.forfallodatum ?? "—"}</span></div>
              <div className="row"><span className="row__main">Fortnox</span><span className="row__meta">{underlag.fortnox_nummer || "inte fakturerad än"}</span></div>
              <p className="admin__meta" style={{ marginTop: 12 }}><Link href={`/admin/fakturering/${underlag.id}`}>Öppna underlaget →</Link></p>
            </>
          )}
        </section>
      </div>

      <section className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Ansökan</h2>
        <p className="admin__meta" style={{ margin: "0 0 4px" }}><b>Jakterfarenhet</b></p>
        <p style={{ fontSize: 15, margin: 0, whiteSpace: "pre-wrap" }}>{medlem.jakterfarenhet}</p>
        {medlem.hund && <><p className="admin__meta" style={{ margin: "12px 0 4px" }}><b>Hund</b></p><p style={{ fontSize: 15, margin: 0 }}>{medlem.hund}</p></>}
        {medlem.meddelande && <><p className="admin__meta" style={{ margin: "12px 0 4px" }}><b>Meddelande</b></p><p style={{ fontSize: 15, margin: 0, whiteSpace: "pre-wrap" }}>{medlem.meddelande}</p></>}
      </section>

      <section className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Dokument</h2>
        {DOKUMENT.map((d) => (
          <Granskning key={d.typ} namn={d.namn} typ={d.typ} d={dok(d.typ)} forslagGiltigTill={sasong?.till ?? jaktaretsSlut()} />
        ))}
        <p className="admin__meta" style={{ marginTop: 12 }}>Öppna visar kopian via en länk som gäller i tio minuter.</p>
      </section>

      <MedlemsKort m={medlem} />
    </>
  );
}
