import type { Metadata } from "next";
import Link from "next/link";
import { Vapen } from "@/components/Blocks";
import MedlemsansokanForm, { type Niva } from "@/components/MedlemsansokanForm";
import { site } from "@/lib/site";
import { supabasePublik } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Jaktklubben — ansök om medlemskap",
  description: "Westsura Herrgårds jaktklubb: en sluten klubb med begränsat antal platser på herrgårdens egna marker. Ansök om medlemskap, eller logga in om du redan är medlem.",
  alternates: { canonical: "/jaktklubb" },
  robots: { index: false },
};

export const revalidate = 300;

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";
const RAKNEORD = ["", "ett", "två", "tre", "fyra", "fem"];

/** Antal platser visas aldrig — bara knapphet när den finns. "20 av 20 lediga" säger att ingen sökt. */
function platsText(kvar: number) {
  if (kvar <= 0) return "Fullt för säsongen — ansökan hamnar på väntelistan";
  if (kvar <= 3) return "Ett fåtal platser kvar";
  return "Begränsat antal platser";
}

export default async function Jaktklubb() {
  let nivaer: Niva[] = [];
  try {
    const db = supabasePublik();
    const { data: sasong } = await db.from("jaktsasong").select("id").eq("aktiv", true).maybeSingle();
    if (sasong) {
      const { data } = await db.from("medlemsniva").select("id, namn, beskrivning, avgift, platser").eq("sasong_id", sasong.id).order("ordning");
      // Platser kvar räknas i databasen — jaktmedlem är RLS-skyddad och syns inte härifrån.
      nivaer = await Promise.all((data ?? []).map(async (n) => {
        const { data: kvar } = await db.rpc("platser_kvar_niva", { niva: n.id });
        return { ...n, kvar: typeof kvar === "number" ? kvar : n.platser } as Niva;
      }));
    }
  } catch (e) { console.error("Kunde inte hämta jaktklubbens nivåer", e); }

  const flera = nivaer.length > 1;

  return (
    <>
      {/* Emblemhuvud: vapnet i guld på mörk botten — jaktklubbens egen signatur */}
      <section className="section dark emblem">
        <div className="container center">
          <Vapen size={190} className="emblem__vapen" />
          <p className="label emblem__label">Westsura Herrgårds jaktklubb</p>
          <h1 className="lower emblem__h1">bli en del av jakten på westsura</h1>
          <p className="emblem__lede">En sluten jaktklubb med begränsat antal platser på herrgårdens egna marker — där kungen sköt sin björn 1687. Medlemskap söks, och beviljas av herrgården.</p>
          <div className="cta-row cta-row--center cta-row--space">
            <a className="btn" href="#ansokan">Ansök om medlemskap</a>
            <a className="btn btn--ghost" href="#medlem">Redan medlem — logga in</a>
          </div>
        </div>
      </section>

      {/* Medlemskapet */}
      <section className="section">
        <div className="container">
          <div className="split split--start">
            <div className="prose">
              <p className="label">Medlemskapet</p>
              <h2 className="lower">{flera ? `${RAKNEORD[nivaer.length] ?? nivaer.length} sätt att höra till` : "att vara medlem"}</h2>
              <p>Klubben är sluten och platserna är få. Alla medlemmar jagar på samma marker, samlas i samma salong och följer samma regler.</p>
              <p>Säsongen följer jaktåret, 1 juli till 30 juni. Årsavgiften faktureras vid säsongsstart. Säkerhetskursen görs online i medlemsklubben och ska vara godkänd före första jaktdagen. Övernattning i flyglarna och mat bokas till efter behov.</p>
              <p className="mb-0">Medlemskap söks här och beviljas av herrgården. Är säsongen fullsatt när du söker sätter vi upp dig på väntelistan och hör av oss när en plats blir ledig.</p>
            </div>
            <div className="stack">
              {nivaer.map((n) => (
                <div key={n.id} className="card">
                  <div className="title-row">
                    <h3>{n.namn}</h3>
                    <span className="price">{kr(n.avgift)}<small> per år</small></span>
                  </div>
                  {n.beskrivning && <p className="small">{n.beskrivning}</p>}
                  <p className="muted">{platsText(n.kvar)}</p>
                </div>
              ))}
              {!nivaer.length && (
                <div className="card">
                  <p className="mb-0 small">Säsongens medlemskap läggs upp inom kort. Ring <a href={site.phoneHref}>{site.phone}</a> så berättar vi mer.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ansökan */}
      <section className="section tint" id="ansokan">
        <div className="container split split--start split--form">
          <div className="prose">
            <p className="label">Ansök om medlemskap</p>
            <h2 className="lower">berätta vem du är</h2>
            <p>Vi tar in nya medlemmar när platser blir lediga, och vi väljer med omsorg — det är en liten klubb där alla känner alla. Fyll i dina kontaktuppgifter och berätta om din jakt: hur länge du jagat, vad du helst jagar, och om du har hund.</p>
            <p>Så går det till: du skickar ansökan, vi ringer upp för ett samtal, och du får besked personligen. Räkna med några dagar. Jägarexamen och vapenlicens krävs.</p>
            <p className="mb-0">Vill du hellre prata direkt? Ring <a href={site.phoneHref}>{site.phone}</a>.</p>
          </div>
          <div className="card card--accent">
            <MedlemsansokanForm nivaer={nivaer} />
          </div>
        </div>
      </section>

      {/* Redan medlem */}
      <section className="section section--tight" id="medlem">
        <div className="container split">
          <div className="prose">
            <p className="label">Redan medlem?</p>
            <h2 className="lower">medlemsklubben</h2>
            <p className="mb-0">Här bokar du säsongens jaktdagar, laddar upp jaktkort, ID och älgskyttemärke och hittar kartor, regler och dokument. Inloggning sker med en engångslänk till din e-post, inget lösenord att komma ihåg.</p>
          </div>
          <div className="card card--plain">
            <p className="small">Logga in med den adress du angav i din ansökan.</p>
            <Link className="btn btn--block" href="/jaktklubb/login">Till medlemsklubben</Link>
          </div>
        </div>
      </section>
    </>
  );
}
