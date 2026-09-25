import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { Grundpris, SasongLista, Regellista, Prisexempel, type Enhet, type Prissasong, type Regel } from "./delar";

export const dynamic = "force-dynamic";

/** Rumspriser: grundpris per rum, säsonger och prisregler (säsong, helg, enskilda datum). */
export default async function Priser() {
  await kravAdmin("vardskap");
  const adm = supabaseAdmin();
  const [{ data: enheter }, { data: sasonger }, { data: regler }] = await Promise.all([
    adm.from("enhet").select("id, namn, grundpris, ingar_i, ar_hela_boendet").eq("aktiv", true).order("ordning"),
    adm.from("sasong").select("*").order("fran"),
    adm.from("prisregel").select("*").order("prioritet", { ascending: false }),
  ]);
  const E = (enheter ?? []) as Enhet[];
  const S = (sasonger ?? []) as Prissasong[];
  const R = (regler ?? []) as Regel[];

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Boende</p><h1 className="admin__h1">priser</h1></div>
        <p className="admin__meta">Grundpriset gäller alla nätter som ingen regel ändrar. En natt räknas på den dag man checkar in — fredag och lördag är helgnätter.</p>
      </header>

      <section className="admin__panel">
        <h2 className="admin__h2">Grundpris per natt</h2>
        <Grundpris enheter={E} />
      </section>

      <section className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Prisregler</h2>
        <p className="admin__meta" style={{ marginBottom: 12 }}>
          En regel gäller när alla dess villkor stämmer. Träffar flera regler samma natt vinner den mest precisa: enskilt datum före veckodagar, veckodagar före säsong. Vid lika avgör prioriteten (högst vinner).
        </p>
        <Regellista regler={R} enheter={E} sasonger={S} />
      </section>

      <section className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Säsonger</h2>
        <p className="admin__meta" style={{ marginBottom: 12 }}>Perioder som prisreglerna kan hänvisa till, till exempel högsäsong eller jul och nyår.</p>
        <SasongLista sasonger={S} />
      </section>

      <section className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Så blir priserna</h2>
        <p className="admin__meta" style={{ marginBottom: 12 }}>Nattpris per rum de kommande två veckorna från valt datum, med alla regler inräknade — det gäster ser när de bokar.</p>
        <Prisexempel enheter={E} />
      </section>
    </>
  );
}
