import type { Metadata } from "next";
import Link from "next/link";
import { kravMedlem } from "@/lib/jakt";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Marker & dokument" };
export const dynamic = "force-dynamic";

export default async function MarkerOchDokument() {
  await kravMedlem();
  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Marker &amp; dokument</p>
          <h1 className="jk-h1">Inför skogen.</h1>
          <p className="jk-lede">Kartor, passbeskrivningar och klubbens regler.</p>
        </div>
      </header>

      <section className="jk-kort jk-kort--ljus jk-kort--bred">
        <p className="jk-etikett">Läggs upp inför säsongen</p>
        <p className="jk-lede">Kartor över markerna, passbeskrivningar och klubbens säkerhetsregler läggs upp här inför säsongen. Du får ett mejl när de finns på plats.</p>
        <p className="jk-lede mb-0">Behöver du något innan dess är det bara att ringa — <a href={site.phoneHref}>{site.phone}</a>.</p>
      </section>

      <section className="jk-kort jk-kort--ljus jk-kort--bred">
        <p className="jk-etikett">Dina egna handlingar</p>
        <p className="jk-lede mb-0">Jaktkort, ID och älgskyttemärke laddar du upp under <Link className="jk-lank" href="/jaktklubb/medlem/medlemskap">Mitt medlemskap</Link>.</p>
      </section>
    </>
  );
}
