import Link from "next/link";
import type { Jaktdag } from "@/lib/jaktdag";
import JaktledareVal from "./JaktledareVal";
import Satar from "./Satar";
import Skottlista from "./Skottlista";
import Skrivut from "./Skrivut";

const VECKODAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];

/**
 * Jaktledarens arbetsyta för en drevjakt. Samma vy i admin och i medlemsklubben
 * (för den utpekade jaktledaren) — bara ramen runt skiljer.
 */
export default function Jaktledarvy({ dag, admin, medlemmar, tillbaka }: {
  dag: Jaktdag; admin: boolean; medlemmar?: { id: string; namn: string }[]; tillbaka: { href: string; label: string };
}) {
  const { tillfalle: t, deltagare, satar, skott, platser, jaktledare } = dag;
  const d = new Date(t.datum);
  const antal = deltagare.reduce((n, a) => n + a.antal, 0);
  const klara = deltagare.filter((a) => a.dokument_ok && a.kurs_ok).length;
  const jagareAlternativ = deltagare.map((a) => ({ id: a.id, namn: a.namn + (a.antal > 1 ? ` (+${a.antal - 1})` : ""), jagare_id: a.jagare_id }));

  return (
    <div className="jl">
      <header className="admin__head print-hide">
        <div>
          <p className="label"><Link href={tillbaka.href} style={{ textDecoration: "none" }}>{tillbaka.label}</Link> · Jaktledarvy</p>
          <h1 className="admin__h1">{t.titel}</h1>
          <p className="admin__meta">{VECKODAG[d.getDay()]} {t.datum}{t.tid ? ` · ${t.tid}` : ""}{t.samling ? ` · samling ${t.samling}` : ""}</p>
        </div>
        <div className="admin__actions">
          <Skrivut />
        </div>
      </header>

      {/* Rubrik som bara syns i utskriften */}
      <div className="print-only jl__print-head">
        <p className="label">Westsura Herrgård · passlista</p>
        <h1 className="admin__h1">{t.titel}</h1>
        <p className="admin__meta">{VECKODAG[d.getDay()]} {t.datum}{t.tid ? ` · ${t.tid}` : ""}{t.samling ? ` · samling ${t.samling}` : ""}{jaktledare ? ` · jaktledare ${jaktledare.namn}${jaktledare.telefon ? ", " + jaktledare.telefon : ""}` : ""}</p>
      </div>

      <div className="admin__stats print-hide">
        <div className="stat"><b>{antal}</b><span>Jägare anmälda</span></div>
        <div className="stat"><b>{klara} av {deltagare.length}</b><span>Klara med dokument och kurs</span></div>
        <div className="stat"><b>{satar.length}</b><span>Såtar</span></div>
        <div className="stat"><b>{skott.length}</b><span>Skott registrerade</span></div>
      </div>

      <section className="admin__panel print-hide" style={{ marginTop: 24 }}>
        <div className="admin__head" style={{ marginBottom: 8 }}>
          <h2 className="admin__h2" style={{ margin: 0 }}>Jaktledare</h2>
        </div>
        {admin && medlemmar
          ? <JaktledareVal tillfalleId={t.id} vald={t.jaktledare_id} medlemmar={medlemmar} />
          : <p className="admin__meta">{jaktledare ? `${jaktledare.namn}${jaktledare.telefon ? " · " + jaktledare.telefon : ""}` : "Ingen jaktledare utsedd ännu."}</p>}
        {t.program && <div style={{ marginTop: 12 }}><p className="label">Program</p>{t.program.split("\n").filter(Boolean).map((r: string, i: number) => <p key={i} className="admin__meta" style={{ margin: "2px 0" }}>{r}</p>)}</div>}
      </section>

      <h2 className="admin__h2 print-hide" style={{ marginTop: 32 }}>Deltagare</h2>
      <div className="admin__panel print-hide">
        {!deltagare.length && <p className="empty">Inga anmälda ännu.</p>}
        {!!deltagare.length && (
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Namn</th><th>Kontakt</th><th className="num">Antal</th><th>Status</th><th>Klar</th><th>Meddelande</th></tr></thead>
              <tbody>
                {deltagare.map((a) => (
                  <tr key={a.id}>
                    <td><b>{a.namn}</b>{a.jagare_status && <div className="admin__meta">{a.jagare_status === "godkand" ? "Medlem" : "Gästjägare"}</div>}</td>
                    <td>{a.telefon && <a href={`tel:${a.telefon}`}>{a.telefon}</a>}<div className="admin__meta">{a.epost}</div></td>
                    <td className="num">{a.antal}</td>
                    <td><span className={`pill pill--${a.status}`}>{a.status === "bekraftad" ? "Bekräftad" : a.status === "anmald" ? "Anmäld" : a.status}</span></td>
                    <td>
                      <span className={`pill pill--${a.dokument_ok ? "godkand" : "saknas"}`} style={{ marginRight: 4 }}>Dok</span>
                      <span className={`pill pill--${a.kurs_ok ? "godkand" : "saknas"}`}>Kurs</span>
                    </td>
                    <td><small>{a.meddelande}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="admin__h2" style={{ marginTop: 32 }}>Såtar och pass</h2>
      <Satar tillfalleId={t.id} satar={satar} platser={platser} jagare={jagareAlternativ} />

      <h2 className="admin__h2 print-hide" style={{ marginTop: 32 }}>Avskjutning</h2>
      <div className="print-hide">
        <Skottlista skott={skott} tillfalleId={t.id} datum={t.datum} satar={satar} jagare={jagareAlternativ} />
      </div>
    </div>
  );
}
