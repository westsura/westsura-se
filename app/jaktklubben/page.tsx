import type { Metadata } from "next";
import { PageHead } from "@/components/Blocks";
import InquiryForm from "@/components/InquiryForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Jaktklubben — medlemmar",
  description: "Inloggning för medlemmar i Westsura Herrgårds jaktklubb, och intresseanmälan för dig som vill bli medlem.",
  alternates: { canonical: "/jaktklubben" },
  robots: { index: false },
};

export default function Jaktklubben() {
  return (
    <>
      <PageHead label="Jaktklubben" title="för medlemmar" lede="En sluten jaktklubb med begränsat antal platser. Medlemmar bokar jaktdagar, vak- och pyrschdygn och hittar kartor, regler och dokument här." />
      <section style={{ paddingBottom: 96 }}>
        <div className="container split" style={{ alignItems: "start" }}>
          <div className="card" style={{ borderTopColor: "var(--accent)" }}>
            <p className="label">Logga in</p>
            <h3>Medlemsinloggning</h3>
            <p style={{ fontSize: 16 }}>Medlemsportalen öppnar inför säsongen. Du får inloggningsuppgifter per e-post när ditt medlemskap är registrerat.</p>
            <div className="form" style={{ gridTemplateColumns: "1fr" }}>
              <div className="field">
                <label htmlFor="jk-epost">E-postadress</label>
                <input type="email" id="jk-epost" disabled placeholder="Öppnar inför säsongen" />
              </div>
              <button className="btn btn--block" type="button" disabled>Skicka inloggningslänk</button>
            </div>
            <p style={{ fontSize: 14, color: "var(--ws-ink-40)", marginTop: 16, marginBottom: 0 }}>Inloggning sker med en engångslänk till din e-post — inget lösenord att komma ihåg.</p>
          </div>
          <div id="intresse">
            <p className="label">Vill du bli medlem?</p>
            <h2 className="lower">anmäl ditt intresse</h2>
            <p>Klubben har tre nivåer — kärnmedlem, jaktmedlem och associerad medlem — med olika antal jaktdagar, ingående vak- och pyrschdygn och bokningsprioritet. Medlemskap beviljas av herrgården. Berätta lite om dig själv, så hör vi av oss.</p>
            <InquiryForm typ="Intresse för jaktklubben" alternativ={["Intresse för jaktklubben"]} />
            <p style={{ fontSize: 14, color: "var(--ws-ink-40)", marginTop: 16 }}>Eller ring <a href={site.phoneHref}>{site.phone}</a>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
