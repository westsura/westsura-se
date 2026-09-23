import type { Metadata } from "next";
import { kravMedlem, kursStatus } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import { langtDatum } from "../delar";
import Prov from "./Prov";

export const metadata: Metadata = { title: "Säkerhetskurs" };
export const dynamic = "force-dynamic";

export default async function Sakerhetskurs() {
  const medlem = await kravMedlem();
  const { godkand, datum, installning } = await kursStatus(medlem);
  const adm = supabaseAdmin();
  const [{ data: avsnitt }, { count: antalFragor }, { data: senaste }] = await Promise.all([
    adm.from("kursavsnitt").select("id, rubrik, text").eq("publicerad", true).order("ordning"),
    adm.from("kursfraga").select("id", { count: "exact", head: true }).eq("publicerad", true),
    adm.from("kursprov").select("inlamnad, poang, max, godkand").eq("medlem_id", medlem.id).not("inlamnad", "is", null).order("inlamnad", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const giltighet = installning.giltighet === "sasong" ? "Gäller för säsongen." : installning.giltighet === "version" ? "Gäller tills kursens innehåll uppdateras." : "Gäller tills vidare.";

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Säkerhets- &amp; skyttekurs</p>
          <h1 className="jk-h1">Så jagar vi tillsammans.</h1>
          <p className="jk-lede">{installning.ingress ?? "Läs avsnitten och gör provet före din första jaktdag."}</p>
        </div>
      </header>

      <section className={`jk-kort jk-kort--bred ${godkand ? "jk-kort--mork" : "jk-kort--ljus"}`}>
        <p className={`jk-etikett${godkand ? " jk-etikett--guld" : ""}`}>Din status</p>
        {godkand ? (
          <>
            <p className="jk-kort__rubrik">Godkänd {datum ? langtDatum(datum.slice(0, 10)) : ""}</p>
            <p className="jk-kort__text">{giltighet} Du kan göra om provet när du vill för att fräscha upp.</p>
          </>
        ) : (
          <>
            <p className="jk-kort__rubrik jk-kort__rubrik--mork">Inte genomförd ännu</p>
            <p className="jk-kort__text jk-kort__text--mork">
              Provet består av {Math.min(installning.antal_fragor, antalFragor ?? 0)} frågor. Godkänt kräver minst {installning.godkant_procent} % rätt och rätt på alla säkerhetskritiska frågor. {giltighet}
              {senaste && !senaste.godkand && ` Ditt senaste försök: ${senaste.poang} av ${senaste.max} rätt.`}
            </p>
          </>
        )}
      </section>

      <section className="jk-sektion">
        <div className="jk-sektion__topp">
          <h2 className="jk-h2">Kursen</h2>
          <p className="jk-etikett">{avsnitt?.length ?? 0} avsnitt · en kvart</p>
        </div>
        <div className="kurs">
          {(avsnitt ?? []).map((a, i) => (
            <article key={a.id} className="kurs__avsnitt" id={`avsnitt-${i + 1}`}>
              <p className="jk-etikett">Avsnitt {i + 1}</p>
              <h3 className="kurs__rubrik">{a.rubrik}</h3>
              {a.text.split(/\n\s*\n/).map((st, n) => <p key={n} className="kurs__text">{st}</p>)}
            </article>
          ))}
        </div>
      </section>

      <section className="jk-sektion" id="prov">
        <div className="jk-sektion__topp">
          <h2 className="jk-h2">Provet</h2>
          <p className="jk-etikett">{godkand ? "Frivillig repetition" : "Obligatoriskt före första jaktdag"}</p>
        </div>
        <Prov redanGodkand={godkand} />
      </section>
    </>
  );
}
