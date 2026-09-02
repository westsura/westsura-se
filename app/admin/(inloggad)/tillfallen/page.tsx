import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import TillfalleForm from "./TillfalleForm";
import AnmalanRad from "./AnmalanRad";

export const dynamic = "force-dynamic";
const TYP: Record<string, string> = { jakt: "Jakt", hundtraning: "Hundträning", jaktkurs: "Jaktkurs", evenemang: "Evenemang" };

export default async function Tillfallen() {
  await kravAdmin("vardskap", "jaktadmin", "kommunikation");
  const db = await supabaseServer();
  const [{ data: tillfallen }, { data: anmalningar }] = await Promise.all([
    db.from("tillfalle").select("*").order("datum"),
    db.from("anmalan").select("*").order("skapad"),
  ]);
  return (
    <>
      <header className="admin__head"><div><p className="label">Tillfällen</p><h1 className="admin__h1">jakt, kurser, hundträning och evenemang</h1></div></header>
      <TillfalleForm />
      {tillfallen?.map((t) => {
        const a = anmalningar?.filter((x) => x.tillfalle_id === t.id) ?? [];
        const tagna = a.filter((x) => x.status === "anmald" || x.status === "bekraftad").reduce((s, x) => s + x.antal, 0);
        return (
          <article key={t.id} className="admin__panel" style={{ marginBottom: 14 }}>
            <div className="ff__head">
              <div>
                <span className="pill">{TYP[t.typ]}</span> <b style={{ marginLeft: 8 }}>{t.titel}</b>{!t.publicerad && <span className="pill pill--block" style={{ marginLeft: 8 }}>ej publicerad</span>}
                <div className="admin__meta">{t.datum}{t.tid ? " · " + t.tid : ""} · {tagna} av {t.platser} platser · {t.pris != null ? t.pris + " kr" : "—"}</div>
              </div>
              <TillfalleForm tillfalle={t} />
            </div>
            {a.length > 0 && (
              <div className="tablewrap" style={{ marginTop: 12 }}>
                <table className="admin__table"><thead><tr><th>Namn</th><th>Kontakt</th><th>Antal</th><th>Meddelande</th><th>Status</th></tr></thead>
                  <tbody>{a.map((x) => <AnmalanRad key={x.id} a={x} />)}</tbody></table>
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
