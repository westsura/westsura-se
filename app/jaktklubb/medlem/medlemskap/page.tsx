import type { Metadata } from "next";
import Link from "next/link";
import { kravMedlem, kursStatus, arMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import { kr } from "@/lib/faktura";
import { DOKUMENT, sasongKort } from "../delar";
import Uppladdning from "./Uppladdning";
import LoggaUt from "./LoggaUt";

export const metadata: Metadata = { title: "Mitt medlemskap" };
export const dynamic = "force-dynamic";

type Dokument = { typ: string; status: string; giltig_till: string | null; kommentar: string | null };

/** Vad medlemmen ser om varje dokument. Ett saknat dokument har ingen rad alls. */
function besked(d?: Dokument) {
  if (!d) return { text: "Saknas — ladda upp", klass: "saknas" };
  if (d.status === "godkand") return { text: d.giltig_till ? `Godkänd t.o.m. ${d.giltig_till}` : "Godkänd", klass: "godkand" };
  if (d.status === "underkand") return { text: `Underkänd${d.kommentar ? ` — ${d.kommentar}` : ""}`, klass: "underkand" };
  return { text: "Inskickad, väntar på granskning", klass: "inskickad" };
}

export default async function Medlemskap() {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  const kurs = await kursStatus(medlem);

  const [{ data: sasong }, { data: niva }, { data: dokument }, { data: underlag }] = await Promise.all([
    medlem.sasong_id ? adm.from("jaktsasong").select("namn").eq("id", medlem.sasong_id).maybeSingle() : Promise.resolve({ data: null }),
    medlem.niva_id ? adm.from("medlemsniva").select("namn, avgift").eq("id", medlem.niva_id).maybeSingle() : Promise.resolve({ data: null }),
    adm.from("medlemsdokument").select("typ, status, giltig_till, kommentar").eq("medlem_id", medlem.id),
    medlem.underlag_id ? adm.from("fakturaunderlag").select("status, forfallodatum").eq("id", medlem.underlag_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const dok = (typ: string) => (dokument as Dokument[] | null)?.find((d) => d.typ === typ);
  const avgift = !underlag ? "—"
    : underlag.status === "betald" ? "Betald"
    : underlag.status === "fakturerad" ? `Fakturerad, förfaller ${underlag.forfallodatum ?? "—"}`
    : underlag.status === "krediterad" ? "Krediterad"
    : "Att fakturera";

  const gast = !arMedlem(medlem);

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">{gast ? "Mitt jägarkonto" : "Mitt medlemskap"}</p>
          <h1 className="jk-h1">{medlem.namn}</h1>
        </div>
      </header>

      <section className="jk-kort jk-kort--ljus jk-kort--bred">
        <p className="jk-etikett">{gast ? "Kontot" : "Medlemskapet"}</p>
        <dl className="jk-lista">
          <div><dt>E-post</dt><dd>{medlem.epost}</dd></div>
          <div><dt>Telefon</dt><dd>{medlem.telefon || "—"}</dd></div>
          <div><dt>Ort</dt><dd>{medlem.ort || "—"}</dd></div>
          {gast ? (
            <div><dt>Status</dt><dd>Gästjägare — <Link className="jk-lank" href="/jaktklubb#ansokan">ansök om medlemskap →</Link></dd></div>
          ) : (
            <>
              <div><dt>Nivå</dt><dd>{niva?.namn ?? "Medlem"}{niva ? ` · ${kr(niva.avgift)} per år` : ""}</dd></div>
              <div><dt>Säsong</dt><dd>{sasongKort(sasong?.namn)}</dd></div>
              <div><dt>Status</dt><dd>● Medlemskap aktivt</dd></div>
              <div><dt>Årsavgift</dt><dd>{avgift}</dd></div>
            </>
          )}
          <div><dt>Säkerhets- &amp; skyttekurs</dt><dd>{kurs.godkand ? `Godkänd ${kurs.datum?.slice(0, 10) ?? ""}` : <Link className="jk-lank" href="/jaktklubb/medlem/sakerhetskurs">Inte genomförd — gör kursen →</Link>}</dd></div>
        </dl>
      </section>

      <section className="jk-kort jk-kort--ljus jk-kort--bred">
        <p className="jk-etikett">Dina dokument</p>
        <p className="jk-lede">Alla tre ska vara godkända före din första jaktdag. Kopiorna ligger i en privat lagringsyta, syns bara för jaktklubbens admin och raderas när {gast ? "kontot" : "medlemskapet"} avslutas.</p>
        {DOKUMENT.map((d) => {
          const b = besked(dok(d.typ));
          return (
            <div key={d.typ} className="jk-dokument">
              <div>
                <p className="jk-dokument__namn">{d.namn}</p>
                <p className="jk-hjalp">{d.hjalp}</p>
                <p className={`jk-dokument__status jk-dokument__status--${b.klass}`}>{b.text}</p>
              </div>
              <Uppladdning typ={d.typ} namn={d.namn} />
            </div>
          );
        })}
      </section>

      <section className="jk-kort jk-kort--ljus jk-kort--bred">
        <p className="jk-etikett">Inloggning</p>
        <p className="jk-lede">Du är inloggad som {medlem.epost}. Nästa gång loggar du in med en ny engångslänk.</p>
        <LoggaUt />
      </section>
    </>
  );
}
