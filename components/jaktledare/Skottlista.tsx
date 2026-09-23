"use client";

import { useState, useTransition } from "react";
import { sparaSkott, taBortSkott } from "@/app/jaktledare/actions";
import { VILT, KON, ALDER, RESULTAT, resultatKort, type Skott, type Sat } from "@/lib/avskjutning";

type Jagare = { id: string; namn: string; jagare_id: string | null };

/**
 * Avskjutning per skott. Sammanhanget är antingen en drevjakt (tillfalleId, med såtar och
 * anmälda jägare) eller ett vak-/pyrschdygn (vakbokningId, med en jägare).
 */
export default function Skottlista({ skott, tillfalleId, vakbokningId, datum, satar = [], jagare = [], fastJagare }: {
  skott: Skott[]; tillfalleId?: string; vakbokningId?: string; datum: string; satar?: Sat[]; jagare?: Jagare[];
  fastJagare?: { jagare_id: string | null; namn: string };
}) {
  const [oppen, setOppen] = useState(false);
  const [redigera, setRedigera] = useState<Skott | null>(null);
  const [pending, start] = useTransition();

  const jagareNamn = (s: Skott) => s.jagare_namn ?? jagare.find((j) => j.jagare_id && j.jagare_id === s.jagare_id)?.namn ?? "—";
  const passText = (s: Skott) => {
    const sat = satar.find((x) => x.id === s.sat_id);
    const pass = sat?.pass.find((p) => p.id === s.pass_id);
    return sat ? `${sat.namn}${pass ? `, pass ${pass.nummer}` : ""}` : "";
  };

  return (
    <div className="admin__panel">
      {!skott.length && <p className="empty">Inga skott registrerade.</p>}
      {!!skott.length && (
        <div className="tablewrap">
          <table className="admin__table">
            <thead><tr><th>Tid</th><th>Jägare</th><th>Vilt</th><th>Resultat</th><th>Var</th><th>Anteckning</th><th></th></tr></thead>
            <tbody>
              {skott.map((s) => (
                <tr key={s.id}>
                  <td>{s.tid ?? <small>—</small>}</td>
                  <td>{jagareNamn(s)}</td>
                  <td><b>{VILT[s.vilt] ?? s.vilt}</b>{s.antal > 1 ? ` × ${s.antal}` : ""}<div className="admin__meta">{[s.kon !== "okant" && KON[s.kon], s.alder !== "okant" && ALDER[s.alder], s.vikt != null && `${s.vikt} kg`].filter(Boolean).join(" · ")}</div></td>
                  <td><span className={`pill pill--${s.resultat === "fallt" || s.resultat === "eftersok_fallt" ? "godkand" : s.resultat === "bom" ? "avbokad" : "inskickad"}`}>{resultatKort[s.resultat] ?? s.resultat}</span></td>
                  <td><small>{passText(s)}</small></td>
                  <td><small>{s.anteckning}</small></td>
                  <td className="admin__actions">
                    <button className="btn btn--sm btn--ghost" type="button" onClick={() => { setRedigera(s); setOppen(true); }}>Ändra</button>
                    <button className="admin__logout" type="button" disabled={pending} onClick={() => { if (confirm("Ta bort skottet?")) start(async () => { const r = await taBortSkott(s.id); if (!r.ok) alert(r.fel); }); }}>Ta bort</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        {oppen
          ? <SkottForm skott={redigera ?? undefined} tillfalleId={tillfalleId} vakbokningId={vakbokningId} datum={datum} satar={satar} jagare={jagare} fastJagare={fastJagare} onKlar={() => { setOppen(false); setRedigera(null); }} />
          : <button className="btn btn--sm" type="button" onClick={() => { setRedigera(null); setOppen(true); }}>+ Registrera skott</button>}
      </div>
    </div>
  );
}

function SkottForm({ skott, tillfalleId, vakbokningId, datum, satar, jagare, fastJagare, onKlar }: {
  skott?: Skott; tillfalleId?: string; vakbokningId?: string; datum: string; satar: Sat[]; jagare: Jagare[];
  fastJagare?: { jagare_id: string | null; namn: string }; onKlar: () => void;
}) {
  const [satId, setSatId] = useState(skott?.sat_id ?? satar[0]?.id ?? "");
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const sat = satar.find((x) => x.id === satId);

  return (
    <form className="form" style={{ padding: 16, background: "var(--ws-paper)" }} onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget);
      // Jägaren väljs via anmälan — vi skickar både konto-id och namn så rapporten håller även utan konto.
      const valdAnmalan = jagare.find((j) => j.id === fd.get("anmalan"));
      if (valdAnmalan) { fd.set("jagare_id", valdAnmalan.jagare_id ?? ""); fd.set("jagare_namn", valdAnmalan.namn); }
      if (fastJagare) { fd.set("jagare_id", fastJagare.jagare_id ?? ""); fd.set("jagare_namn", fastJagare.namn); }
      start(async () => { const r = await sparaSkott(fd); if (r.ok) onKlar(); else setMedd(r.fel ?? "Fel"); });
    }}>
      {skott && <input type="hidden" name="id" value={skott.id} />}
      {tillfalleId && <input type="hidden" name="tillfalle_id" value={tillfalleId} />}
      {vakbokningId && <input type="hidden" name="vakbokning_id" value={vakbokningId} />}
      <div className="field"><label>Datum</label><input name="datum" type="date" defaultValue={skott?.datum ?? datum} required /></div>
      <div className="field"><label>Klockslag</label><input name="tid" defaultValue={skott?.tid ?? ""} placeholder="09.40" /></div>
      {fastJagare
        ? <div className="field"><label>Jägare</label><input value={fastJagare.namn} disabled /></div>
        : (
          <div className="field">
            <label>Jägare</label>
            <select name="anmalan" defaultValue={jagare.find((j) => (j.jagare_id && j.jagare_id === skott?.jagare_id) || j.namn === skott?.jagare_namn)?.id ?? ""} required>
              <option value="">— välj —</option>
              {jagare.map((j) => <option key={j.id} value={j.id}>{j.namn}</option>)}
            </select>
          </div>
        )}
      {!!satar.length && (
        <>
          <div className="field">
            <label>Såt</label>
            <select name="sat_id" value={satId} onChange={(e) => setSatId(e.target.value)}>
              <option value="">—</option>
              {satar.map((x) => <option key={x.id} value={x.id}>{x.namn}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Pass</label>
            <select name="pass_id" defaultValue={skott?.pass_id ?? ""}>
              <option value="">—</option>
              {(sat?.pass ?? []).map((p) => <option key={p.id} value={p.id}>Pass {p.nummer}</option>)}
            </select>
          </div>
        </>
      )}
      <div className="field">
        <label>Vilt</label>
        <select name="vilt" defaultValue={skott?.vilt ?? "vildsvin"}>
          {Object.entries(VILT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Resultat</label>
        <select name="resultat" defaultValue={skott?.resultat ?? "fallt"}>
          {Object.entries(RESULTAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Kön</label>
        <select name="kon" defaultValue={skott?.kon ?? "okant"}>{Object.entries(KON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <div className="field">
        <label>Ålder</label>
        <select name="alder" defaultValue={skott?.alder ?? "okant"}>{Object.entries(ALDER).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <div className="field"><label>Antal</label><input name="antal" type="number" min={1} defaultValue={skott?.antal ?? 1} /></div>
      <div className="field"><label>Vikt, kg <small>valfritt</small></label><input name="vikt" inputMode="decimal" defaultValue={skott?.vikt ?? ""} /></div>
      <div className="field field--full"><label>Anteckning</label><input name="anteckning" defaultValue={skott?.anteckning ?? ""} placeholder="Eftersök med hund, funnet 40 m in i granplanteringen" /></div>
      <div className="field--full cta-row">
        <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "Sparar…" : skott ? "Spara" : "Registrera"}</button>
        <button className="btn btn--sm btn--ghost" type="button" onClick={onKlar}>Avbryt</button>
        {medd && <span className="admin__meta">{medd}</span>}
      </div>
    </form>
  );
}
