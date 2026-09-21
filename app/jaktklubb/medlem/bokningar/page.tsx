import type { Metadata } from "next";
import Link from "next/link";
import { kravMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import { ANMALANSTATUS, MANAD, VECKODAG } from "../delar";
import Avboka from "./Avboka";

export const metadata: Metadata = { title: "Mina bokningar" };
export const dynamic = "force-dynamic";

type Rad = { id: string; status: string; tillfalle: { titel: string; datum: string; tid: string | null; samling: string | null } | null };

export default async function MinaBokningar() {
  const medlem = await kravMedlem();
  const idag = new Date().toISOString().slice(0, 10);

  const { data } = await supabaseAdmin().from("anmalan")
    .select("id, status, tillfalle:tillfalle_id(titel, datum, tid, samling)")
    .eq("epost", medlem.epost).order("skapad", { ascending: false });

  const alla = ((data ?? []) as unknown as Rad[]).filter((r) => r.tillfalle);
  const kommande = alla.filter((r) => r.status !== "avbokad" && r.tillfalle!.datum >= idag)
    .sort((a, b) => (a.tillfalle!.datum < b.tillfalle!.datum ? -1 : 1));
  const tidigare = alla.filter((r) => !kommande.includes(r))
    .sort((a, b) => (a.tillfalle!.datum > b.tillfalle!.datum ? -1 : 1));

  const rad = (r: Rad, avbokningsbar: boolean) => {
    const d = new Date(r.tillfalle!.datum);
    return (
      <div key={r.id} className={`jk-jaktrad jk-jaktrad--stilla${r.status === "avbokad" ? " jk-jaktrad--blek" : ""}`}>
        <span className="jk-jaktrad__datum"><b>{d.getDate()}</b><span>{MANAD[d.getMonth()].slice(0, 3)}</span></span>
        <span className="jk-jaktrad__text">
          <span className="jk-jaktrad__titel">{r.tillfalle!.titel}</span>
          <span className="jk-jaktrad__tid">
            {VECKODAG[d.getDay()].replace(/^./, (c) => c.toUpperCase())} {d.getDate()} {MANAD[d.getMonth()]}
            {r.tillfalle!.tid ? ` · ${r.tillfalle!.tid}` : ""}
            {r.tillfalle!.samling ? ` · ${r.tillfalle!.samling}` : ""}
          </span>
          <span className="jk-jaktrad__status">{ANMALANSTATUS[r.status] ?? r.status}</span>
        </span>
        {avbokningsbar && <Avboka id={r.id} titel={r.tillfalle!.titel} />}
      </div>
    );
  };

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Mina bokningar</p>
          <h1 className="jk-h1">Dina jaktdagar.</h1>
          <p className="jk-lede">Kommande först. Avboka i god tid om du får förhinder.</p>
        </div>
        <Link className="btn" href="/jaktklubb/medlem/boka">Boka en jaktdag</Link>
      </header>

      <section className="jk-boka__lista jk-kort--bred">
        {!kommande.length && <p className="jk-lede">Du har ingen kommande jaktdag bokad.</p>}
        {kommande.map((r) => rad(r, true))}
      </section>

      {!!tidigare.length && (
        <section className="jk-sektion">
          <h2 className="jk-h2">Tidigare och avbokade</h2>
          <div className="jk-boka__lista">{tidigare.map((r) => rad(r, false))}</div>
        </section>
      )}
    </>
  );
}
