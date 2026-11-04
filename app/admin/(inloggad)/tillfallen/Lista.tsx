import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import TillfalleForm from "./TillfalleForm";
import AnmalanRad from "./AnmalanRad";
import SittningAdmin from "./SittningAdmin";
import TaBortKnapp from "@/components/TaBortKnapp";
import { taBortTillfalle } from "@/app/admin/actions";
import { giltigaIdag } from "@/lib/dokument";

const TYP: Record<string, string> = { jakt: "Jakt", hundtraning: "Hundträning", jaktkurs: "Jaktkurs", evenemang: "Evenemang" };

/**
 * Listan över tillfällen, i två varianter: jaktdagar & kurser (jakt, hundträning, jaktkurs)
 * och evenemang (det som syns under Aktuellt). Samma kort och anmälningar — bara olika ingångar.
 */
export default async function Lista({ del, visaTidigare }: { del: "jakt" | "evenemang"; visaTidigare?: boolean }) {
  if (del === "jakt") await kravAdmin("jaktadmin"); else await kravAdmin("vardskap");
  const typer = del === "jakt" ? ["jakt", "hundtraning", "jaktkurs"] : ["evenemang"];
  const idag = new Date().toISOString().slice(0, 10);
  const db = await supabaseServer();
  let q = db.from("tillfalle").select("*").in("typ", typer).order("datum");
  if (!visaTidigare) q = q.or(`datum.gte.${idag},datum_till.gte.${idag}`);
  const [{ data: tillfallen }, { data: anmalningar }, { data: sittningar }] = await Promise.all([
    q,
    db.from("anmalan").select("*").order("skapad"),
    db.from("sittning").select("id, tillfalle_id, datum, tid, platser, pris").order("datum").order("tid"),
  ]);
  const { data: hfAnm } = await supabaseAdmin().from("hundforare_anmalan").select("tillfalle_id, status").neq("status", "aterkallad");
  const hf = (id: string) => {
    const r = ((hfAnm ?? []) as { tillfalle_id: string; status: string }[]).filter((x) => x.tillfalle_id === id);
    const med = r.filter((x) => x.status === "godkand").length, intresse = r.filter((x) => x.status === "intresse").length;
    return med || intresse ? ` · hundförare: ${med} med${intresse ? `, ${intresse} att svara på` : ""}` : "";
  };
  // Gäster på gästplatser: hur långt de kommit med handlingar och säkerhetskurs, så att du kan bekräfta.
  const gastIds = [...new Set(((anmalningar ?? []) as { gast: boolean; jagare_id: string | null }[]).filter((x) => x.gast && x.jagare_id).map((x) => x.jagare_id!))];
  const [{ data: gastDok }, { data: gastKonto }] = gastIds.length
    ? await Promise.all([
        supabaseAdmin().from("medlemsdokument").select("medlem_id").in("medlem_id", gastIds).eq("status", "godkand").or(giltigaIdag()),
        supabaseAdmin().from("jaktmedlem").select("id, kurs_godkand").in("id", gastIds),
      ])
    : [{ data: [] }, { data: [] }];
  const gastInfo = (jagareId: string | null) => {
    if (!jagareId) return { dok: 0, kurs: false, id: null };
    return {
      id: jagareId,
      dok: ((gastDok ?? []) as { medlem_id: string }[]).filter((d) => d.medlem_id === jagareId).length,
      kurs: !!((gastKonto ?? []) as { id: string; kurs_godkand: string | null }[]).find((k) => k.id === jagareId)?.kurs_godkand,
    };
  };
  const S = (sittningar ?? []) as { id: string; tillfalle_id: string; datum: string; tid: string | null; platser: number; pris: number | null }[];
  const sittningNyckel = (id: string | null) => { const s = S.find((x) => x.id === id); return s ? s.datum + (s.tid ?? "") : ""; };
  const sittningNamn = (id: string | null) => {
    const s = S.find((x) => x.id === id);
    return s ? `${new Date(s.datum + "T12:00:00").toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}${s.tid ? " " + s.tid : ""}` : null;
  };
  return (
    <>
      {del === "jakt" ? (
        <header className="admin__head"><div><p className="label">Jakt</p><h1 className="admin__h1">jaktdagar och kurser</h1></div>
          <p className="admin__meta">Jaktdagar, hundträning och jaktkurser. Jaktledarvyn har deltagare, såtar, pass, hundförare och avskjutning.</p></header>
      ) : (
        <header className="admin__head"><div><p className="label">Evenemang</p><h1 className="admin__h1">evenemang under aktuellt</h1></div>
          <p className="admin__meta">Visas under Aktuellt på startsidan — det närmaste stort, resten som kort — och får en egen sida att länka till. Passerade evenemang försvinner från startsidan av sig själva.</p></header>
      )}
      <div className="admin__filter" style={{ marginBottom: 16 }}>
        <Link href={del === "jakt" ? "/admin/tillfallen" : "/admin/evenemang"} aria-current={!visaTidigare ? "page" : undefined}>Kommande</Link>
        <Link href={del === "jakt" ? "/admin/tillfallen?tidigare=1" : "/admin/evenemang?tidigare=1"} aria-current={visaTidigare ? "page" : undefined}>Alla, även tidigare</Link>
      </div>
      <TillfalleForm del={del} />
      {!tillfallen?.length && <p className="empty">{del === "jakt" ? "Inga jaktdagar inlagda." : "Inga evenemang inlagda."}</p>}
      {tillfallen?.map((t) => {
        const a = anmalningar?.filter((x) => x.tillfalle_id === t.id) ?? [];
        const aktiv = (x: { status: string }) => x.status === "anmald" || x.status === "bekraftad";
        const tagna = a.filter((x) => aktiv(x) && !x.gast).reduce((s, x) => s + x.antal, 0);
        const gaster = a.filter((x) => aktiv(x) && x.gast).reduce((s, x) => s + x.antal, 0);
        const gastText = t.typ === "jakt" && t.synlighet === "medlem" && t.gastplatser > 0 ? ` · gästplatser: ${gaster} av ${t.gastplatser} à ${t.gastpris ?? 0} kr` : "";
        return (
          <article key={t.id} className="admin__panel" style={{ marginBottom: 14 }}>
            <div className="ff__head">
              <div>
                <span className="pill">{TYP[t.typ]}</span> <b style={{ marginLeft: 8 }}>{t.titel}</b>{!t.publicerad && <span className="pill pill--block" style={{ marginLeft: 8 }}>ej publicerad</span>}
                <div className="admin__meta">{t.datum}{t.tid ? " · " + t.tid : ""}{t.typ !== "evenemang" || t.anmalan ? ` · ${tagna} av ${t.platser} ${t.synlighet === "medlem" && t.typ !== "evenemang" ? "medlemsplatser" : "platser"}` : " · ingen anmälan"}{gastText}{t.synlighet === "medlem" && t.typ !== "evenemang" ? "" : ` · ${t.pris != null ? (t.pris === 0 ? "fri entré" : t.pris + " kr") : "—"}`}{t.typ === "evenemang" && !t.slug ? " · saknar adress — spara en gång till" : ""}{t.typ === "jakt" ? hf(t.id) : ""}</div>
              </div>
              <div className="admin__actions">
                {t.typ === "jakt" && <Link className="btn btn--sm" href={`/admin/tillfallen/${t.id}`}>Jaktledarvy</Link>}
                {t.typ === "evenemang" && t.slug && <a className="btn btn--sm btn--ghost" href={`/aktuellt/${t.slug}`} target="_blank" rel="noopener">Visa sidan</a>}
                <TillfalleForm tillfalle={t} del={del} />
                <TaBortKnapp gor={taBortTillfalle.bind(null, t.id)}
                  fraga={`Ta bort "${t.titel}" ${t.datum}?${a.length ? ` De ${a.length} anmälningarna försvinner också — hör av er till de anmälda först.` : ""} Det går inte att ångra.`} />
              </div>
            </div>
            {t.typ === "evenemang" && t.anmalan && (
              <SittningAdmin tillfalleId={t.id} pris={t.pris} sittningar={S.filter((s) => s.tillfalle_id === t.id).map((s) => ({
                ...s, tagna: a.filter((x) => x.sittning_id === s.id && (x.status === "anmald" || x.status === "bekraftad")).reduce((n, x) => n + x.antal, 0),
              }))} />
            )}
            {a.length > 0 && (
              <div className="tablewrap" style={{ marginTop: 12 }}>
                <table className="admin__table"><thead><tr><th>Namn</th><th>Kontakt</th><th>Antal</th><th>Meddelande</th><th>Status</th></tr></thead>
                  <tbody>{[...a].sort((x, y) => sittningNyckel(x.sittning_id).localeCompare(sittningNyckel(y.sittning_id))).map((x) => <AnmalanRad key={x.id} a={x} sittning={sittningNamn(x.sittning_id)} gast={x.gast ? gastInfo(x.jagare_id) : null} />)}</tbody></table>
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
