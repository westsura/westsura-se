import type { Metadata } from "next";
import { kravMedlem } from "@/lib/jakt";
import { bytLosenordMedlem } from "@/app/jaktklubb/actions";
import LosenordForm from "@/components/LosenordForm";

export const metadata: Metadata = { title: "Byt lösenord" };
export const dynamic = "force-dynamic";

export default async function Losenord() {
  const medlem = await kravMedlem();
  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Inloggning</p>
          <h1 className="jk-h1">Byt lösenord.</h1>
          <p className="jk-lede">Du loggar in med {medlem.epost}. Välj ett lösenord som bara du kan.</p>
        </div>
      </header>
      <section className="jk-kort jk-kort--ljus jk-kort--bred">
        <LosenordForm action={bytLosenordMedlem} klarText="Lösenordet är bytt. Använd det nästa gång du loggar in." />
      </section>
    </>
  );
}
