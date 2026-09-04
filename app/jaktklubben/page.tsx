import type { Metadata } from "next";
import { Vapen } from "@/components/Blocks";
import MedlemsansokanForm from "@/components/MedlemsansokanForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Jaktklubben — ansök om medlemskap",
  description: "Westsura Herrgårds jaktklubb: en sluten klubb med begränsat antal platser i tre nivåer. Ansök om medlemskap, eller logga in om du redan är medlem.",
  alternates: { canonical: "/jaktklubben" },
  robots: { index: false },
};

type Niva = { namn: string; platser: number; avgift: number; bokning: string; text: string };
const nivaer: Niva[] = [
  { namn: "Kärnmedlem", platser: 10, avgift: 19000, bokning: "1 mars", text: "Klubbens kärna. Flest jaktdagar, ingående vak- och pyrschdygn och först till bokningen varje säsong." },
  { namn: "Jaktmedlem", platser: 22, avgift: 9500, bokning: "15 mars", text: "Gemensamma jaktdagar under säsongen, vak- och pyrschdygn att boka, och tillgång till kartor, regler och dokument." },
  { namn: "Associerad", platser: 18, avgift: 4900, bokning: "1 april", text: "För dig som vill höra till utan att jaga varje vecka. Utvalda jaktdagar, klubbens sammankomster och bokning i mån av plats." },
];
const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

export default function Jaktklubben() {
  return (
    <>
      {/* Emblemhuvud: vapnet i guld på mörk botten — jaktklubbens egen signatur */}
      <section className="section dark emblem">
        <div className="container" style={{ textAlign: "center" }}>
          <Vapen size={190} className="emblem__vapen" />
          <p className="label" style={{ margin: "26px auto 0" }}>Westsura Herrgårds jaktklubb</p>
          <h1 className="lower" style={{ color: "var(--ws-cream)", margin: "6px 0 14px" }}>bli en del av jakten på westsura</h1>
          <p className="emblem__lede">En sluten jaktklubb med begränsat antal platser på herrgårdens egna marker — där kungen sköt sin björn 1687. Medlemskap söks, och beviljas av herrgården.</p>
          <div className="cta-row" style={{ justifyContent: "center", marginTop: 28 }}>
            <a className="btn" href="#ansokan">Ansök om medlemskap</a>
            <a className="btn btn--ghost" href="#medlem" style={{ color: "var(--ws-cream)", borderColor: "rgba(215,174,98,.5)" }}>Redan medlem — logga in</a>
          </div>
        </div>
      </section>

      {/* Nivåer */}
      <section className="section">
        <div className="container">
          <div className="split" style={{ alignItems: "start" }}>
            <div className="prose">
              <p className="label">Att vara medlem</p>
              <h2 className="lower">tre sätt att höra till</h2>
              <p>Klubben har femtio platser fördelade på tre nivåer. Alla medlemmar jagar på samma marker, samlas i samma salong och följer samma regler — skillnaden är hur mycket jakt som ingår och när på våren du får boka.</p>
              <p>Bokningen av säsongens jaktdagar öppnar stegvis: kärnmedlemmar först, därefter jaktmedlemmar och sist associerade. Säkerhets- och skyttekursen på herrgården är obligatorisk inför varje säsong, oavsett nivå.</p>
              <p style={{ marginBottom: 0 }}>Årsavgiften faktureras vid säsongsstart. Övernattning i flyglarna och mat bokas till efter behov.</p>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {nivaer.map((n) => (
                <div key={n.namn} className="card" style={{ borderTopColor: "var(--accent)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0 }}>{n.namn}</h3>
                    <span className="price">{kr(n.avgift)}<small> per år</small></span>
                  </div>
                  <p style={{ margin: "10px 0 12px", fontSize: 16 }}>{n.text}</p>
                  <p className="admin__meta" style={{ fontSize: 13 }}>{n.platser} platser · bokning öppnar {n.bokning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ansökan */}
      <section className="section tint" id="ansokan">
        <div className="container split" style={{ alignItems: "start", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)" }}>
          <div className="prose">
            <p className="label">Ansök om medlemskap</p>
            <h2 className="lower">berätta vem du är</h2>
            <p>Vi tar in nya medlemmar när platser blir lediga, och vi väljer med omsorg — det är en liten klubb där alla känner alla. Fyll i dina kontaktuppgifter och berätta lite om dig själv: hur du jagar, vad du söker och varför Westsura.</p>
            <p>Så går det till: du skickar ansökan, vi ringer upp för ett samtal, och du får besked personligen. Räkna med några dagar. Jägarexamen och vapenlicens krävs för jaktmedlemskap.</p>
            <p style={{ marginBottom: 0 }}>Vill du hellre prata direkt? Ring <a href={site.phoneHref}>{site.phone}</a>.</p>
          </div>
          <div className="card" style={{ borderTopColor: "var(--accent)" }}>
            <MedlemsansokanForm />
          </div>
        </div>
      </section>

      {/* Redan medlem */}
      <section className="section section--tight" id="medlem">
        <div className="container split" style={{ alignItems: "center" }}>
          <div className="prose">
            <p className="label">Redan medlem?</p>
            <h2 className="lower">medlemsportalen</h2>
            <p style={{ marginBottom: 0 }}>Här bokar du jaktdagar, vak- och pyrschdygn och hittar kartor, regler och dokument. Portalen öppnar inför säsongen — du får ett mejl när det är dags. Inloggning sker med en engångslänk till din e-post, inget lösenord att komma ihåg.</p>
          </div>
          <div className="card">
            <div className="form" style={{ gridTemplateColumns: "1fr" }}>
              <div className="field">
                <label htmlFor="jk-epost">E-postadress</label>
                <input type="email" id="jk-epost" disabled placeholder="Öppnar inför säsongen" />
              </div>
              <button className="btn btn--block" type="button" disabled>Skicka inloggningslänk</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
