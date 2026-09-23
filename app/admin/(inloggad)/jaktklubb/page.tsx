import Link from "next/link";
import { kravAdmin, kr, FAKTURASTATUS } from "@/lib/admin";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import AnsokanKort from "./AnsokanKort";
import Meddelanden from "./Meddelanden";
import { DOKUMENT, DOKUMENTSTATUS, type Dokument, type Klubbmeddelande, type Medlem, type Niva, type Sasong } from "./delar";

export const dynamic = "force-dynamic";

export default async function Jaktklubb() {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();

  const { data: sasong } = await db.from("jaktsasong").select("*").eq("aktiv", true).maybeSingle<Sasong>();
  const { data: nivaer } = sasong
    ? await db.from("medlemsniva").select("*").eq("sasong_id", sasong.id).order("ordning")
    : { data: [] as Niva[] };
  const { data: medlemmar } = await db.from("jaktmedlem").select("*").order("skapad", { ascending: false });
  const { data: dokument } = await db.from("medlemsdokument").select("*");
  const { data: meddelanden } = await db.from("klubbmeddelande").select("*").order("datum", { ascending: false }).limit(20);
  const { count: vakAttSvara } = await db.from("vakbokning").select("id", { count: "exact", head: true }).eq("status", "onskad");

  const alla = (medlemmar ?? []) as Medlem[];
  const ansokningar = alla.filter((m) => m.status === "sokande" || m.status === "vantelista");
  const godkanda = alla.filter((m) => m.status === "godkand");
  const gaster = alla.filter((m) => m.status === "gast");

  // Avgiftsstatus ligger i fakturaunderlag, som bara vardskap når genom RLS.
  const underlagIds = godkanda.map((m) => m.underlag_id).filter(Boolean) as string[];
  const { data: underlag } = underlagIds.length
    ? await supabaseAdmin().from("fakturaunderlag").select("id, status").in("id", underlagIds)
    : { data: [] as { id: string; status: string }[] };

  const niva = (id: string | null) => (nivaer ?? []).find((n: Niva) => n.id === id);
  const avgift = (m: Medlem) => underlag?.find((u) => u.id === m.underlag_id)?.status;
  const dok = (m: Medlem, typ: string) => (dokument as Dokument[] | null)?.find((d) => d.medlem_id === m.id && d.typ === typ);

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="label">Jaktklubben</p>
          <h1 className="admin__h1">{sasong ? `säsong ${sasong.namn}` : "ingen aktiv säsong"}</h1>
        </div>
        <div className="admin__actions">
          {sasong && <span className="admin__meta">{sasong.fran} – {sasong.till}</span>}
          <Link className="btn btn--sm btn--ghost" href="/admin/jaktklubb/vak">Vak &amp; pyrsch{vakAttSvara ? ` (${vakAttSvara})` : ""}</Link>
          <Link className="btn btn--sm btn--ghost" href="/admin/jaktklubb/avskjutning">Avskjutning</Link>
          <Link className="btn btn--sm btn--ghost" href="/admin/jaktklubb/sasonger">Säsonger &amp; nivåer</Link>
          <Link className="btn btn--sm btn--ghost" href="/admin/sakerhetskurs">Säkerhetskurs</Link>
        </div>
      </header>

      <div className="admin__stats">
        {(nivaer ?? []).map((n: Niva) => {
          const tagna = godkanda.filter((m) => m.niva_id === n.id).length;
          return (
            <div key={n.id} className="stat">
              <b>{tagna} av {n.platser}</b>
              <span>{n.namn} · {kr(n.avgift)}</span>
            </div>
          );
        })}
        <div className="stat"><b>{ansokningar.length}</b><span>Ansökningar att svara på</span></div>
      </div>

      <h2 className="admin__h2" style={{ marginTop: 32 }}>Ansökningar</h2>
      {!ansokningar.length && <p className="empty" style={{ marginBottom: 24 }}>Inga ansökningar att svara på.</p>}
      {ansokningar.map((m) => (
        <AnsokanKort key={m.id} m={m} nivaer={(nivaer ?? []) as Niva[]}
          kvar={Object.fromEntries((nivaer ?? []).map((n: Niva) => [n.id, n.platser - godkanda.filter((g) => g.niva_id === n.id).length]))} />
      ))}

      <h2 className="admin__h2" style={{ marginTop: 40 }}>Medlemmar</h2>
      {!godkanda.length && <p className="empty">Inga medlemmar än.</p>}
      {!!godkanda.length && (
        <div className="admin__panel">
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Namn</th><th>Kontakt</th><th>Nivå</th><th>Avgift</th><th>Dokument</th><th>Kurs</th></tr></thead>
              <tbody>
                {godkanda.map((m) => (
                  <tr key={m.id}>
                    <td><Link href={`/admin/jaktklubb/${m.id}`}><b>{m.namn}</b></Link>{m.ort ? <div className="admin__meta">{m.ort}</div> : null}</td>
                    <td><a href={`tel:${m.telefon}`}>{m.telefon}</a><div className="admin__meta">{m.epost}</div></td>
                    <td>{niva(m.niva_id)?.namn ?? "—"}</td>
                    <td>{avgift(m) ? FAKTURASTATUS[avgift(m)!] : "Inget underlag"}</td>
                    <td>
                      {DOKUMENT.map((d) => {
                        const status = dok(m, d.typ)?.status ?? "saknas";
                        return <span key={d.typ} className={`pill pill--${status}`} title={d.namn} style={{ marginRight: 4 }}>{DOKUMENTSTATUS[status]}</span>;
                      })}
                    </td>
                    <td>{m.kurs_genomford ? "Genomförd" : "Inte genomförd"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="admin__h2" style={{ marginTop: 40 }}>Gästjägare</h2>
      <p className="admin__meta" style={{ marginBottom: 12 }}>Konton utan medlemskap — skapas automatiskt när någon anmäler sig till en öppen jaktdag. Samma dokument- och kurskrav som medlemmar.</p>
      {!gaster.length && <p className="empty">Inga gästjägare än.</p>}
      {!!gaster.length && (
        <div className="admin__panel">
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Namn</th><th>Kontakt</th><th>Dokument</th><th>Kurs</th><th>Skapad</th></tr></thead>
              <tbody>
                {gaster.map((m) => (
                  <tr key={m.id}>
                    <td><Link href={`/admin/jaktklubb/${m.id}`}><b>{m.namn}</b></Link></td>
                    <td>{m.telefon && <a href={`tel:${m.telefon}`}>{m.telefon}</a>}<div className="admin__meta">{m.epost}</div></td>
                    <td>
                      {DOKUMENT.map((d) => {
                        const status = dok(m, d.typ)?.status ?? "saknas";
                        return <span key={d.typ} className={`pill pill--${status}`} title={d.namn} style={{ marginRight: 4 }}>{DOKUMENTSTATUS[status]}</span>;
                      })}
                    </td>
                    <td>{m.kurs_genomford ? "Godkänd" : "Inte gjord"}</td>
                    <td><small>{m.skapad.slice(0, 10)}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Meddelanden meddelanden={(meddelanden ?? []) as Klubbmeddelande[]} />
    </>
  );
}
