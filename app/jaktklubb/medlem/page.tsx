import Link from "next/link";
import { kravMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import { ANMALANSTATUS, MANAD, VECKODAG, sasongKort, sasongsdel } from "./delar";

export const dynamic = "force-dynamic";

type Anmalan = { status: string; tillfalle: { titel: string; typ: string; datum: string; tid: string | null; samling: string | null } | null };

export default async function Oversikt() {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);

  const [{ data: sasong }, { data: niva }, { data: anmalningar }] = await Promise.all([
    medlem.sasong_id ? adm.from("jaktsasong").select("namn").eq("id", medlem.sasong_id).maybeSingle() : Promise.resolve({ data: null }),
    medlem.niva_id ? adm.from("medlemsniva").select("namn").eq("id", medlem.niva_id).maybeSingle() : Promise.resolve({ data: null }),
    // Anmälningarna hänger på e-postadressen — anmalan har ingen koppling till medlem.
    adm.from("anmalan").select("status, tillfalle:tillfalle_id(titel, typ, datum, tid, samling)")
      .eq("epost", medlem.epost).neq("status", "avbokad"),
  ]);

  const kommande = ((anmalningar ?? []) as unknown as Anmalan[])
    .filter((a) => a.tillfalle && a.tillfalle.datum >= idag)
    .sort((a, b) => (a.tillfalle!.datum < b.tillfalle!.datum ? -1 : 1))[0];

  const forNamn = medlem.namn.split(" ")[0];
  const d = kommande ? new Date(kommande.tillfalle!.datum) : null;

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Ditt Westsura · {sasongsdel()} {new Date().getFullYear()}</p>
          <h1 className="jk-h1">Välkommen tillbaka, {forNamn}.</h1>
          <p className="jk-lede">Nästa jaktdag, dina bokningar och allt du behöver inför skogen.</p>
        </div>
        <Link className="btn" href="/jaktklubb/medlem/boka">Boka en jaktdag</Link>
      </header>

      <div className="jk-rad">
        <section className="jk-kort jk-kort--mork">
          <div className="jk-kort__topp">
            <p className="jk-etikett jk-etikett--guld">Din nästa jaktdag</p>
            {kommande && <p className="jk-status">{ANMALANSTATUS[kommande.status]}</p>}
          </div>
          {!kommande && (
            <>
              <p className="jk-kort__rubrik">Ingen jaktdag bokad ännu</p>
              <p className="jk-kort__text">Säsongens jaktdagar ligger uppe. Välj en dag som passar dig.</p>
              <div className="jk-avdelare" />
              <Link className="btn" href="/jaktklubb/medlem/boka">Boka en jaktdag</Link>
            </>
          )}
          {kommande && d && (
            <>
              <div className="jk-jaktdag">
                <p className="jk-jaktdag__datum"><b>{d.getDate()}</b><span className="jk-etikett jk-etikett--guld">{MANAD[d.getMonth()]}</span></p>
                <div>
                  <p className="jk-kort__rubrik">{kommande.tillfalle!.titel}</p>
                  <p className="jk-kort__text">
                    {kommande.tillfalle!.typ === "jakt" ? "Gemensam jaktdag" : kommande.tillfalle!.typ}
                    {kommande.tillfalle!.samling ? ` · ${kommande.tillfalle!.samling}` : ""}
                  </p>
                  <p className="jk-kort__rad">
                    {VECKODAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())} {d.getDate()} {MANAD[d.getMonth()]}
                    {kommande.tillfalle!.tid ? `  ·  ${kommande.tillfalle!.tid}` : ""}
                  </p>
                </div>
              </div>
              <div className="jk-avdelare" />
              <div className="jk-kort__fot">
                <p className="jk-kort__text">Allt inför dagen finns i din bokning.</p>
                <Link className="btn" href="/jaktklubb/medlem/bokningar">Visa min bokning</Link>
              </div>
            </>
          )}
        </section>

        <section className="jk-kort jk-kort--ljus">
          <p className="jk-etikett">Ditt medlemskap</p>
          <p className="jk-kort__rubrik jk-kort__rubrik--mork">{niva?.namn ?? "Medlem"}</p>
          <p className="jk-kort__text jk-kort__text--mork">Säsong {sasongKort(sasong?.namn)}</p>
          <div className="jk-avdelare" />
          <p className="jk-status jk-status--mork">● Medlemskap aktivt</p>
          <p className="jk-hjalp">Säkerhets- &amp; skyttekurs<br />{medlem.kurs_genomford ? "Genomförd för säsongen" : "Inte genomförd ännu"}</p>
          <Link className="jk-lank" href="/jaktklubb/medlem/medlemskap">Visa medlemskap&nbsp; →</Link>
        </section>
      </div>

      <section className="jk-sektion">
        <div className="jk-sektion__topp">
          <h2 className="jk-h2">Nära till hands</h2>
          <p className="jk-etikett">Allt för din jaktdag</p>
        </div>
        <div className="jk-tre">
          <Link className="card" href="/jaktklubb/medlem/dokument">
            <p className="label">Marker &amp; pass</p>
            <h3>Lär känna markerna</h3>
            <p className="small mb-0">Kartor och passinformation inför nästa jakt.</p>
          </Link>
          <Link className="card" href="/jaktklubb/medlem/dokument">
            <p className="label">Regler &amp; dokument</p>
            <h3>Redo för jaktdagen</h3>
            <p className="small mb-0">Säkerhet och dokument samlade på ett ställe.</p>
          </Link>
          <Link className="card" href="/boende">
            <p className="label">Boende &amp; mat</p>
            <h3>Stanna lite längre</h3>
            <p className="small mb-0">Låt jaktdagen bli en helg på herrgården.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
