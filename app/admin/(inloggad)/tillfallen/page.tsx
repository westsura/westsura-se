import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import TillfalleForm from "./TillfalleForm";
import AnmalanRad from "./AnmalanRad";
import TaBortKnapp from "@/components/TaBortKnapp";
import { taBortTillfalle } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
const TYP: Record<string, string> = { jakt: "Jakt", hundtraning: "Hundträning", jaktkurs: "Jaktkurs", evenemang: "Evenemang" };

export default async function Tillfallen() {
  await kravAdmin("vardskap", "jaktadmin");
  const db = await supabaseServer();
  const [{ data: tillfallen }, { data: anmalningar }] = await Promise.all([
    db.from("tillfalle").select("*").order("datum"),
    db.from("anmalan").select("*").order("skapad"),
  ]);
  return (
    <>
      <header className="admin__head"><div><p className="label">Tillfällen</p><h1 className="admin__h1">jakt, kurser, hundträning och evenemang</h1></div>
        <p className="admin__meta">Evenemang visas under Aktuellt på startsidan — det närmaste stort, resten som kort — och får en egen sida att länka till. Passerade evenemang försvinner från startsidan av sig själva.</p></header>
      <TillfalleForm />
      {tillfallen?.map((t) => {
        const a = anmalningar?.filter((x) => x.tillfalle_id === t.id) ?? [];
        const tagna = a.filter((x) => x.status === "anmald" || x.status === "bekraftad").reduce((s, x) => s + x.antal, 0);
        return (
          <article key={t.id} className="admin__panel" style={{ marginBottom: 14 }}>
            <div className="ff__head">
              <div>
                <span className="pill">{TYP[t.typ]}</span> <b style={{ marginLeft: 8 }}>{t.titel}</b>{!t.publicerad && <span className="pill pill--block" style={{ marginLeft: 8 }}>ej publicerad</span>}
                <div className="admin__meta">{t.datum}{t.tid ? " · " + t.tid : ""}{t.typ !== "evenemang" || t.anmalan ? ` · ${tagna} av ${t.platser} platser` : " · ingen anmälan"} · {t.pris != null ? (t.pris === 0 ? "fri entré" : t.pris + " kr") : "—"}{t.typ === "evenemang" && !t.slug ? " · saknar adress — spara en gång till" : ""}</div>
              </div>
              <div className="admin__actions">
                {t.typ === "jakt" && <Link className="btn btn--sm" href={`/admin/tillfallen/${t.id}`}>Jaktledarvy</Link>}
                {t.typ === "evenemang" && t.slug && <a className="btn btn--sm btn--ghost" href={`/aktuellt/${t.slug}`} target="_blank" rel="noopener">Visa sidan</a>}
                <TillfalleForm tillfalle={t} />
                <TaBortKnapp gor={taBortTillfalle.bind(null, t.id)}
                  fraga={`Ta bort "${t.titel}" ${t.datum}?${a.length ? ` De ${a.length} anmälningarna försvinner också — hör av er till de anmälda först.` : ""} Det går inte att ångra.`} />
              </div>
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
