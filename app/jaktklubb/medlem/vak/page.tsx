import type { Metadata } from "next";
import Link from "next/link";
import { kravMedlem, kursStatus, arMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import { VAKSTATUS, VAKTYP, vakPris, kr, type Omrade, type Utbud, type Vakbokning } from "@/lib/vak";
import { MANAD, VECKODAG } from "../delar";
import VakForm from "./VakForm";
import AvbokaVak from "./AvbokaVak";

export const metadata: Metadata = { title: "Vak & pyrsch" };
export const dynamic = "force-dynamic";

export default async function Vak() {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const gast = !arMedlem(medlem);
  const kurs = await kursStatus(medlem);

  // Gäster ser bara dygn som är öppna för alla; medlemmar ser alla utlagda dygn.
  const [{ data: sasong }, { data: omraden }, { data: utbud }, { data: mina }, { count: godkanda }] = await Promise.all([
    adm.from("jaktsasong").select("id, namn").eq("aktiv", true).maybeSingle(),
    adm.from("vakomrade").select("id, namn, typ").eq("aktiv", true).order("ordning"),
    adm.from("vakutbud").select("*").eq("publicerad", true).gte("datum", idag).in("synlighet", gast ? ["alla"] : ["medlem", "alla"]).order("datum"),
    adm.from("vakbokning").select("*").eq("jagare_id", medlem.id).order("datum", { ascending: false }),
    adm.from("medlemsdokument").select("id", { count: "exact", head: true }).eq("medlem_id", medlem.id).eq("status", "godkand"),
  ]);

  // Lediga platser på utlagda dygn räknas i databasen.
  const utbudLista: Utbud[] = await Promise.all(((utbud ?? []) as Utbud[]).map(async (u) => {
    const { data: kvar } = await adm.rpc("vakutbud_kvar", { u: u.id });
    return { ...u, kvar: typeof kvar === "number" ? kvar : u.platser };
  }));
  const lediga = utbudLista.filter((u) => (u.kvar ?? 0) > 0);

  // Kvoten för medlemmar: hur många dygn som ingår och vad nästa kostar.
  const { data: niva } = !gast && medlem.niva_id
    ? await adm.from("medlemsniva").select("namn, vakdygn_ingar, vakdygn_pris").eq("id", medlem.niva_id).maybeSingle()
    : { data: null };
  const bokningar = (mina ?? []) as Vakbokning[];
  const anvanda = bokningar.filter((b) => b.sasong_id === sasong?.id && (b.status === "onskad" || b.status === "bekraftad")).length;
  const nastaPris = gast ? null : vakPris(niva, anvanda);
  const kvotText = gast ? null
    : !niva || niva.vakdygn_ingar == null ? "Vak och pyrsch ingår i ditt medlemskap."
    : `${anvanda} av ${niva.vakdygn_ingar} ingående dygn använda den här säsongen${nastaPris ? ` — nästa kostar ${kr(nastaPris)}` : ""}.`;

  const omradeNamn = (id: string | null) => ((omraden ?? []) as Omrade[]).find((o) => o.id === id)?.namn ?? null;
  const kommande = bokningar.filter((b) => b.datum >= idag && b.status !== "avbokad" && b.status !== "avbojd").sort((a, b) => (a.datum < b.datum ? -1 : 1));
  const tidigare = bokningar.filter((b) => !kommande.includes(b));

  const rad = (b: Vakbokning, avbokningsbar: boolean) => {
    const d = new Date(b.datum);
    return (
      <div key={b.id} className={`jk-jaktrad jk-jaktrad--stilla${b.status === "avbokad" || b.status === "avbojd" ? " jk-jaktrad--blek" : ""}`}>
        <span className="jk-jaktrad__datum"><b>{d.getDate()}</b><span>{MANAD[d.getMonth()].slice(0, 3)}</span></span>
        <span className="jk-jaktrad__text">
          <span className="jk-jaktrad__titel">{VAKTYP[b.typ]}{b.omrade_id ? ` · ${omradeNamn(b.omrade_id)}` : b.onskat_omrade_id ? ` · önskar ${omradeNamn(b.onskat_omrade_id)}` : ""}</span>
          <span className="jk-jaktrad__tid">
            {VECKODAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())} {d.getDate()} {MANAD[d.getMonth()]}{b.pris ? ` · ${kr(b.pris)}` : " · ingår"}
            {b.svar ? ` · ${b.svar}` : ""}
          </span>
          <span className="jk-jaktrad__status">● {VAKSTATUS[b.status]}</span>
        </span>
        {avbokningsbar && <AvbokaVak id={b.id} datum={b.datum} />}
      </div>
    );
  };

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Vak &amp; pyrsch</p>
          <h1 className="jk-h1">Ett dygn för dig själv i skogen.</h1>
          <p className="jk-lede">
            {gast
              ? "Herrgården lägger ut vak- och pyrschdygn under säsongen. Boka ett, så bekräftar jaktledaren och tilldelar område."
              : "Herrgården släpper dygn under säsongen, med hänsyn till drevjakterna. Välj ett, så tilldelar jaktledaren torn eller område och bekräftar inom en vardag."}
          </p>
        </div>
      </header>

      <div className="jk-jaktform">
        <Link className="btn btn--ghost" href="/jaktklubb/medlem/boka">Gemensam jakt</Link>
        <span className="btn" aria-current="page">Vak &amp; pyrsch</span>
      </div>

      {!kurs.godkand && (
        <p className="kurs__varning" role="status">
          <span>Säkerhetskursen är inte genomförd. Du kan önska dygn nu, men provet måste vara godkänt före jakten — <Link href="/jaktklubb/medlem/sakerhetskurs">gör kursen här</Link>.</span>
        </p>
      )}

      <VakForm
        gast={gast}
        omraden={(omraden ?? []) as Omrade[]}
        utbud={lediga}
        kvotText={kvotText}
        dokumentKlara={godkanda === 3}
      />

      <section className="jk-sektion">
        <div className="jk-sektion__topp">
          <h2 className="jk-h2">Dina dygn</h2>
          <p className="jk-etikett">{kommande.length ? `${kommande.length} kommande` : "Inget bokat"}</p>
        </div>
        <div className="jk-boka__lista">
          {!kommande.length && <p className="jk-lede">Du har inget kommande vak- eller pyrschdygn.</p>}
          {kommande.map((b) => rad(b, true))}
        </div>
      </section>

      {!!tidigare.length && (
        <section className="jk-sektion">
          <h2 className="jk-h2">Tidigare, avbokade och avböjda</h2>
          <div className="jk-boka__lista">{tidigare.map((b) => rad(b, false))}</div>
        </section>
      )}
    </>
  );
}
