import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import Installningar from "./Installningar";
import AvsnittForm from "./AvsnittForm";
import FragaForm from "./FragaForm";
import type { Avsnitt, Fraga } from "./delar";

export const dynamic = "force-dynamic";

export default async function Sakerhetskurs() {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const [{ data: inst }, { data: avsnitt }, { data: fragor }, { data: medlemmar }, { data: prov }] = await Promise.all([
    db.from("kursinstallning").select("*").eq("id", 1).single(),
    db.from("kursavsnitt").select("*").order("ordning"),
    db.from("kursfraga").select("*").order("ordning"),
    db.from("jaktmedlem").select("id, namn, epost, status, kurs_godkand, kurs_version").eq("status", "godkand").order("namn"),
    db.from("kursprov").select("medlem_id, inlamnad, poang, max, godkand").not("inlamnad", "is", null).order("inlamnad", { ascending: false }),
  ]);
  const A = (avsnitt ?? []) as Avsnitt[];
  const F = (fragor ?? []) as Fraga[];
  const kritiska = F.filter((f) => f.kritisk && f.publicerad).length;
  const publicerade = F.filter((f) => f.publicerad).length;
  const senaste = (id: string) => (prov ?? []).find((p) => p.medlem_id === id);
  const forsok = (id: string) => (prov ?? []).filter((p) => p.medlem_id === id).length;

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Jaktklubben</p><h1 className="admin__h1">säkerhetskurs</h1></div>
        <p className="admin__meta">{A.length} avsnitt · {publicerade} frågor i provet varav {kritiska} kritiska · innehållsversion {inst?.version}</p>
      </header>

      <div className="admin__cols" style={{ alignItems: "start" }}>
        <div className="admin__panel">
          <h2 className="admin__h2">Inställningar</h2>
          <Installningar inst={inst} kritiska={kritiska} />
        </div>
        <div className="admin__panel">
          <h2 className="admin__h2">Medlemmarnas status</h2>
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Medlem</th><th>Kurs</th><th className="num">Försök</th><th>Senaste</th></tr></thead>
              <tbody>
                {!medlemmar?.length && <tr><td colSpan={4} className="empty">Inga godkända medlemmar ännu.</td></tr>}
                {medlemmar?.map((m) => {
                  const sen = senaste(m.id);
                  const aktuell = !!m.kurs_godkand && (inst?.giltighet !== "version" || m.kurs_version === inst?.version);
                  return (
                    <tr key={m.id}>
                      <td><b>{m.namn}</b><br /><small>{m.epost}</small></td>
                      <td><span className={`pill pill--${aktuell ? "bekraftad" : "preliminar"}`}>{aktuell ? `Godkänd ${String(m.kurs_godkand).slice(0, 10)}` : m.kurs_godkand ? "Behöver göras om" : "Inte gjord"}</span></td>
                      <td className="num">{forsok(m.id)}</td>
                      <td><small>{sen ? `${String(sen.inlamnad).slice(0, 10)} · ${sen.poang}/${sen.max} · ${sen.godkand ? "godkänd" : "underkänd"}` : "—"}</small></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin__panel" style={{ marginTop: 24 }}>
        <div className="admin__head" style={{ marginBottom: 12 }}>
          <h2 className="admin__h2" style={{ margin: 0 }}>Avsnitt</h2>
          <p className="admin__meta">Det medlemmen läser före provet. Tomrad ger nytt stycke.</p>
        </div>
        {A.map((a) => <AvsnittForm key={a.id} avsnitt={a} />)}
        <AvsnittForm nastaOrdning={(A.at(-1)?.ordning ?? 0) + 1} />
      </div>

      <div className="admin__panel" style={{ marginTop: 24 }}>
        <div className="admin__head" style={{ marginBottom: 12 }}>
          <h2 className="admin__h2" style={{ margin: 0 }}>Frågor</h2>
          <p className="admin__meta">Kritiska frågor är alltid med i provet och måste vara rätt. Övriga slumpas.</p>
        </div>
        {A.map((a) => (
          <section key={a.id} style={{ marginTop: 20 }}>
            <p className="label">{a.rubrik}</p>
            {F.filter((f) => f.avsnitt_id === a.id).map((f) => <FragaForm key={f.id} fraga={f} avsnitt={A} />)}
          </section>
        ))}
        {F.some((f) => !f.avsnitt_id) && (
          <section style={{ marginTop: 20 }}>
            <p className="label">Utan avsnitt</p>
            {F.filter((f) => !f.avsnitt_id).map((f) => <FragaForm key={f.id} fraga={f} avsnitt={A} />)}
          </section>
        )}
        <section style={{ marginTop: 28 }}>
          <p className="label">Ny fråga</p>
          <FragaForm avsnitt={A} nastaOrdning={(F.at(-1)?.ordning ?? 0) + 1} />
        </section>
      </div>
    </>
  );
}
