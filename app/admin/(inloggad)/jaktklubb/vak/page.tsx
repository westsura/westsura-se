import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { VAKTYP, kr, type Omrade, type Utbud } from "@/lib/vak";
import SvaraKort from "./SvaraKort";
import UtbudForm from "./UtbudForm";
import OmradeForm from "./OmradeForm";
import VakKnappar from "./VakKnappar";
import type { BokningMedJagare } from "./delar";

export const dynamic = "force-dynamic";

export default async function VakAdmin() {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);

  const [{ data: omraden }, { data: bokningar }, { data: utbud }, { data: dokument }] = await Promise.all([
    adm.from("vakomrade").select("*").order("ordning"),
    adm.from("vakbokning").select("*, jagare:jagare_id(id, namn, epost, telefon, status, kurs_godkand)").gte("datum", idag).order("datum"),
    adm.from("vakutbud").select("*").gte("datum", idag).order("datum"),
    adm.from("medlemsdokument").select("medlem_id").eq("status", "godkand"),
  ]);

  const O = (omraden ?? []) as Omrade[];
  const alla = (bokningar ?? []) as BokningMedJagare[];
  // Tre godkända dokument = klar att jaga.
  const dokAntal: Record<string, number> = {};
  for (const d of (dokument ?? []) as { medlem_id: string }[]) dokAntal[d.medlem_id] = (dokAntal[d.medlem_id] ?? 0) + 1;
  for (const b of alla) b.dokument_ok = (dokAntal[b.jagare_id] ?? 0) >= 3;

  const attSvara = alla.filter((b) => b.status === "onskad");
  const bekraftade = alla.filter((b) => b.status === "bekraftad");
  const U = (utbud ?? []) as Utbud[];
  const bokadePerUtbud: Record<string, number> = {};
  for (const b of alla) if (b.utbud_id && (b.status === "onskad" || b.status === "bekraftad")) bokadePerUtbud[b.utbud_id] = (bokadePerUtbud[b.utbud_id] ?? 0) + 1;

  /** Områden som är lediga ett visst dygn — de som inte har en bekräftad bokning. */
  const lediga = (datum: string) => O.filter((o) => o.aktiv && !bekraftade.some((b) => b.datum === datum && b.omrade_id === o.id));
  const namn = (id: string | null) => O.find((o) => o.id === id)?.namn ?? "—";

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="label"><Link href="/admin/jaktklubb" style={{ textDecoration: "none" }}>Jaktklubben</Link> · Vak &amp; pyrsch</p>
          <h1 className="admin__h1">jaktledarens bord</h1>
        </div>
        <p className="admin__meta">Du släpper dygnen, jägarna önskar dem, du tilldelar område och bekräftar — en jägare per område och dygn.</p>
      </header>

      <div className="admin__stats">
        <div className="stat"><b>{attSvara.length}</b><span>Att svara på</span></div>
        <div className="stat"><b>{bekraftade.length}</b><span>Bekräftade dygn framåt</span></div>
        <div className="stat"><b>{U.filter((u) => u.publicerad).length}</b><span>Släppta dygn framåt</span></div>
        <div className="stat"><b>{O.filter((o) => o.aktiv).length}</b><span>Aktiva områden</span></div>
      </div>

      <h2 className="admin__h2" style={{ marginTop: 32 }}>Att svara på</h2>
      {!attSvara.length && <p className="empty" style={{ marginBottom: 24 }}>Inga önskningar väntar.</p>}
      {attSvara.map((b) => (
        <SvaraKort key={b.id} b={b} lediga={lediga(b.datum)} alla={O.filter((o) => o.aktiv)} onskatNamn={b.onskat_omrade_id ? namn(b.onskat_omrade_id) : null} />
      ))}

      <h2 className="admin__h2" style={{ marginTop: 40 }}>Kommande dygn</h2>
      {!bekraftade.length && <p className="empty">Inga bekräftade dygn framåt.</p>}
      {!!bekraftade.length && (
        <div className="admin__panel">
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Datum</th><th>Jägare</th><th>Jaktform</th><th>Område</th><th className="num">Pris</th><th>Klar</th><th></th></tr></thead>
              <tbody>
                {bekraftade.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.datum}</b></td>
                    <td>{b.jagare ? <Link href={`/admin/jaktklubb/${b.jagare.id}`}>{b.jagare.namn}</Link> : "—"}<div className="admin__meta">{b.jagare?.status === "godkand" ? "Medlem" : "Gäst"}{b.jagare?.telefon ? ` · ${b.jagare.telefon}` : ""}</div></td>
                    <td>{VAKTYP[b.typ]}</td>
                    <td>{namn(b.omrade_id)}</td>
                    <td className="num">{kr(b.pris)}{b.underlag_id && <><br /><Link href={`/admin/fakturering/${b.underlag_id}`}><small>Underlag</small></Link></>}</td>
                    <td>
                      <span className={`pill pill--${b.dokument_ok ? "godkand" : "saknas"}`} style={{ marginRight: 4 }}>Dok</span>
                      <span className={`pill pill--${b.jagare?.kurs_godkand ? "godkand" : "saknas"}`}>Kurs</span>
                    </td>
                    <td><VakKnappar id={b.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="admin__h2" style={{ marginTop: 40 }}>Släppta dygn</h2>
      <p className="admin__meta" style={{ marginBottom: 12 }}>Vak och pyrsch går bara att boka de dygn du släpper — lägg dem så att de inte stör drevjakterna. Ett dygn är antingen bara för medlemmar eller öppet även för gäster; öppna dygn syns på /jakt med gästpriset, som kan sättas olika per dygn.</p>
      {!!U.length && (
        <div className="admin__panel" style={{ marginBottom: 12 }}>
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Datum</th><th>Jaktform</th><th>Vem</th><th>Område</th><th className="num">Gästpris</th><th className="num">Bokade</th><th>Släppt</th><th></th></tr></thead>
              <tbody>
                {U.map((u) => <UtbudForm key={u.id} utbud={u} omraden={O} bokade={bokadePerUtbud[u.id] ?? 0} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <UtbudForm omraden={O} bokade={0} />

      <h2 className="admin__h2" style={{ marginTop: 40 }}>Områden</h2>
      <p className="admin__meta" style={{ marginBottom: 12 }}>Torn, vakplatser och pyrschområden. Koordinater i SWEREF 99 TM (som på Lantmäteriets kartor) läggs in från GPS och används av kartan.</p>
      <div className="admin__panel">
        {!O.length && <p className="empty">Inga områden ännu.</p>}
        {O.map((o) => <OmradeForm key={o.id} omrade={o} />)}
        <OmradeForm nastaOrdning={(O.at(-1)?.ordning ?? 0) + 1} />
      </div>
    </>
  );
}
