import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import { KATEGORI } from "@/lib/arende";
import { hamtaPoster, paDag, plus, iso, type Post } from "@/lib/kalender";
import Blockera from "./Blockera";

export const dynamic = "force-dynamic";

const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const VD = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
const vd = (d: string) => (new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7; // 0 = måndag
const dagnr = (d: string) => Number(d.slice(8, 10));
const STATUSNAMN: Record<string, string> = { forfragan: "Förfrågan", preliminar: "Preliminär", bekraftad: "Bekräftad", avbokad: "Avbokad", info: "Information" };
const VYER = [["dag", "Dag"], ["vecka", "Vecka"], ["manad", "Månad"], ["resurser", "Lokaler & boende"]] as const;

/** Gemensam boknings- och verksamhetskalender i admin. */
export default async function Kalender({ searchParams }: { searchParams: Promise<{ vy?: string; d?: string; typ?: string; avbokade?: string }> }) {
  await kravAdmin("vardskap");
  const sp = await searchParams;
  const vy = (VYER.map((v) => v[0]) as string[]).includes(sp.vy ?? "") ? sp.vy! : "manad";
  const idag = iso(new Date());
  const d = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : idag;
  const typer = (sp.typ ?? "").split(",").filter((t) => t in KATEGORI);
  const visaAvbokade = sp.avbokade === "1";

  // Intervall per vy.
  const manStart = d.slice(0, 8) + "01";
  const manSlut = plus(iso(new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)), 1))), -1);
  const veckaStart = plus(d, -vd(d));
  const [fran, till] = vy === "dag" ? [d, d] : vy === "vecka" ? [veckaStart, plus(veckaStart, 6)]
    : vy === "manad" ? [plus(manStart, -vd(manStart)), plus(manSlut, 6 - vd(manSlut))] : [manStart, manSlut];

  const db = await supabaseServer();
  const [alla, { data: enheter }, { data: lokaler }, { data: blockeringar }] = await Promise.all([
    hamtaPoster(fran, till, visaAvbokade),
    db.from("enhet").select("id, namn, ingar_i, ar_hela_boendet").eq("aktiv", true).order("ordning"),
    db.from("lokal").select("id, namn").eq("aktiv", true).order("ordning"),
    vy === "resurser" ? db.from("blockering").select("*").lt("fran", plus(till, 1)).gt("till", fran) : Promise.resolve({ data: [] }),
  ]);
  const poster = typer.length ? alla.filter((p) => typer.includes(p.kategori)) : alla;
  // Tar posten den här enheten? Räknar med hela boendet och rum som ingår i en flygel (åt båda hållen).
  const enhet = (id: string) => enheter?.find((z) => z.id === id);
  const tarEnhet = (id: string, x: Post) => {
    const e = enhet(id);
    return x.enheter.some((y) => {
      const f = enhet(y);
      return y === id || f?.ar_hela_boendet || e?.ar_hela_boendet || e?.ingar_i === y || f?.ingar_i === id;
    });
  };
  const resursNamn = (p: Post) => [...p.lokaler.map((l) => lokaler?.find((x) => x.id === l)?.namn ?? l), ...p.enheter.map((e) => enheter?.find((x) => x.id === e)?.namn ?? e)].join(", ");

  // Länkar som behåller vy, datum och filter.
  const lank = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const v = { vy, d, typ: typer.join(","), avbokade: visaAvbokade ? "1" : "", ...p };
    for (const [k, x] of Object.entries(v)) if (x) u.set(k, x);
    return `/admin/kalender?${u.toString()}`;
  };
  const steg = vy === "dag" ? 1 : vy === "vecka" ? 7 : 0;
  const forra = steg ? plus(d, -steg) : iso(new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 2, 1)));
  const nasta = steg ? plus(d, steg) : iso(new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)), 1)));
  const rubrik = vy === "dag" ? `${VD[vd(d)]} ${dagnr(d)} ${MAN[Number(d.slice(5, 7)) - 1]}`
    : vy === "vecka" ? `vecka ${veckonummer(veckaStart)} · ${dagnr(veckaStart)} ${MAN[Number(veckaStart.slice(5, 7)) - 1].slice(0, 3)} – ${dagnr(plus(veckaStart, 6))} ${MAN[Number(plus(veckaStart, 6).slice(5, 7)) - 1].slice(0, 3)}`
    : `${MAN[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;

  const chip = (p: Post, d0: string, kort = false) => (
    <Link key={p.id + d0} href={p.href} className={`kal-post kal-post--${p.status}`} style={{ ["--kat" as string]: KATEGORI[p.kategori]?.farg }} title={`${p.titel}${p.under ? " — " + p.under : ""} · ${STATUSNAMN[p.status]}`}>
      {p.tid_fran && p.fran === d0 && <span className="kal-post__tid">{p.tid_fran}</span>}
      <span className="kal-post__titel">{p.fran < d0 && kort ? "↳ " : ""}{p.titel}</span>
      {!kort && (p.under || p.lokaler.length + p.enheter.length > 0) && <span className="kal-post__under">{[p.under, resursNamn(p)].filter(Boolean).join(" · ")}</span>}
    </Link>
  );

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Kalender</p><h1 className="admin__h1">{rubrik}</h1></div>
        <div className="admin__actions">
          <Link className="btn btn--sm" href={`/admin/bokningar/ny?datum=${d}`}>+ Bokning</Link>
          <Link className="btn btn--sm btn--ghost" href={`/admin/bokningar/ny?intern=1&datum=${d}`}>+ Intern aktivitet</Link>
          <Link className="btn btn--sm btn--ghost" href={`/admin/kalender/utskrift?d=${vy === "vecka" ? veckaStart : d}&dagar=${vy === "vecka" ? 7 : 1}`}>Skriv ut {vy === "vecka" ? "veckan" : "dagen"}</Link>
        </div>
      </header>

      <div className="kal-verktyg">
        <div className="admin__filter">
          <Link href={lank({ d: forra })} aria-label="Föregående">←</Link>
          <Link href={lank({ d: idag })}>I dag</Link>
          <Link href={lank({ d: nasta })} aria-label="Nästa">→</Link>
        </div>
        <div className="admin__filter">
          {VYER.map(([v, l]) => <Link key={v} href={lank({ vy: v })} aria-current={vy === v ? "page" : undefined}>{l}</Link>)}
        </div>
      </div>
      <div className="kal-filter">
        <Link href={lank({ typ: "" })} className={!typer.length ? "is-pa" : ""}>Allt</Link>
        {Object.entries(KATEGORI).map(([k, v]) => {
          const pa = typer.includes(k);
          const nya = pa ? typer.filter((t) => t !== k) : [...typer, k];
          return <Link key={k} href={lank({ typ: nya.join(",") })} className={pa ? "is-pa" : ""} style={{ ["--kat" as string]: v.farg }}><i />{v.namn}</Link>;
        })}
        <Link href={lank({ avbokade: visaAvbokade ? "" : "1" })} className={visaAvbokade ? "is-pa" : ""}>Visa avbokade</Link>
      </div>

      {vy === "manad" && (
        <div className="kal-manad">
          {VD.map((n) => <div key={n} className="kal-manad__vd">{n.slice(0, 3)}</div>)}
          {Array.from({ length: Math.round((Date.parse(till) - Date.parse(fran)) / 86400000) + 1 }, (_, i) => plus(fran, i)).map((dag) => {
            const p = paDag(poster, dag);
            const utanfor = dag.slice(0, 7) !== d.slice(0, 7);
            return (
              <div key={dag} className={`kal-manad__dag${utanfor ? " is-utanfor" : ""}${dag === idag ? " is-idag" : ""}${vd(dag) >= 5 ? " is-helg" : ""}`}>
                <Link href={lank({ vy: "dag", d: dag })} className="kal-manad__nr">{dagnr(dag)}</Link>
                {p.slice(0, 4).map((x) => chip(x, dag, true))}
                {p.length > 4 && <Link href={lank({ vy: "dag", d: dag })} className="kal-manad__fler">+{p.length - 4} till</Link>}
              </div>
            );
          })}
        </div>
      )}

      {vy === "vecka" && (
        <div className="kal-vecka">
          {Array.from({ length: 7 }, (_, i) => plus(veckaStart, i)).map((dag) => {
            const p = paDag(poster, dag);
            return (
              <div key={dag} className={`kal-vecka__dag${dag === idag ? " is-idag" : ""}`}>
                <Link href={lank({ vy: "dag", d: dag })} className="kal-vecka__rubrik"><b>{VD[vd(dag)].slice(0, 3)}</b> {dagnr(dag)}</Link>
                {!p.length && <span className="kal-tom">—</span>}
                {p.map((x) => chip(x, dag))}
              </div>
            );
          })}
        </div>
      )}

      {vy === "dag" && (() => {
        const p = paDag(poster, d);
        const upptagen = (fn: (x: Post) => boolean) => paDag(alla, d).filter((x) => x.reserverar && fn(x));
        return (
          <div className="kal-dag">
            <section className="admin__panel">
              <h2 className="admin__h2">På schemat</h2>
              {!p.length && <p className="empty">Inget inlagt den här dagen.</p>}
              <div className="kal-dag__lista">{p.map((x) => (
                <div key={x.id} className="kal-dag__rad">
                  <span className="kal-dag__tid">{x.fran === d && x.tid_fran ? `${x.tid_fran}${x.tid_till ? "–" + x.tid_till : ""}` : x.fran < d ? "pågår" : "hela dagen"}</span>
                  <div>
                    {chip(x, d)}
                    <small className="muted">{KATEGORI[x.kategori]?.namn} · {STATUSNAMN[x.status]}{x.kategori === "boende" && x.fran === d ? " · ankomst" : ""}{x.kategori === "boende" && x.till === d ? " · avresa i morgon" : ""}</small>
                  </div>
                </div>
              ))}</div>
            </section>
            <section className="admin__panel">
              <h2 className="admin__h2">Lokaler och boende</h2>
              <ul className="kal-resurslista">
                {(lokaler ?? []).map((l) => { const u = upptagen((x) => x.lokaler.includes(l.id)); return (
                  <li key={l.id} className={u.length ? "is-upptagen" : ""}><b>{l.namn}</b><span>{u.length ? u.map((x) => `${x.titel}${x.tid_fran ? " " + x.tid_fran + (x.tid_till ? "–" + x.tid_till : "") : ""}`).join(", ") : "Ledig"}</span></li>
                ); })}
                {(enheter ?? []).map((e) => { const u = upptagen((x) => tarEnhet(e.id, x)); return (
                  <li key={e.id} className={u.length ? "is-upptagen" : ""}><b>{e.ingar_i ? "↳ " : ""}{e.namn}</b><span>{u.length ? [...new Set(u.map((x) => x.titel))].join(", ") : "Ledigt"}</span></li>
                ); })}
              </ul>
            </section>
          </div>
        );
      })()}

      {vy === "resurser" && (() => {
        const dagar = Array.from({ length: Math.round((Date.parse(till) - Date.parse(fran)) / 86400000) + 1 }, (_, i) => plus(fran, i));
        const rader: { id: string; namn: string; klass: string; traff: (x: Post) => boolean }[] = [
          ...(lokaler ?? []).map((l) => ({ id: "l-" + l.id, namn: l.namn, klass: "is-lokal", traff: (x: Post) => x.lokaler.includes(l.id) })),
          ...(enheter ?? []).map((e) => ({ id: "e-" + e.id, namn: (e.ingar_i ? "↳ " : "") + e.namn, klass: e.ingar_i ? "is-delrum" : e.ar_hela_boendet ? "is-hela" : "",
            traff: (x: Post) => tarEnhet(e.id, x) })),
        ];
        return (
          <>
            <Blockera enheter={(enheter ?? []).map((e) => ({ id: e.id, namn: e.namn }))} blockeringar={((blockeringar ?? []) as { id: string; enhet_id: string; fran: string; till: string; orsak: string | null }[]).map((b) => ({ id: b.id, enhet: enheter?.find((e) => e.id === b.enhet_id)?.namn ?? b.enhet_id, fran: b.fran, till: b.till, orsak: b.orsak }))} />
            <div className="admin__panel" style={{ padding: 0, overflow: "hidden" }}>
              <div className="tablewrap" style={{ margin: 0 }}>
                <table className="cal">
                  <thead><tr><th className="cal__enhet">Lokal / boende</th>{dagar.map((x) => <th key={x} className={`cal__dag${vd(x) >= 5 ? " is-helg" : ""}${x === idag ? " is-idag" : ""}`}><span>{["M", "T", "O", "T", "F", "L", "S"][vd(x)]}</span>{dagnr(x)}</th>)}</tr></thead>
                  <tbody>
                    {rader.map((r) => (
                      <tr key={r.id} className={r.klass}>
                        <td className="cal__enhet">{r.namn}</td>
                        {dagar.map((x) => {
                          const p = paDag(poster, x).filter((y) => (y.reserverar || y.status === "forfragan") && r.traff(y));
                          const f = p[0];
                          return (
                            <td key={x} className={`cal__cell${vd(x) >= 5 ? " is-helg" : ""}`}>
                              {f && <Link href={f.href} className={`kal-cell kal-post--${f.status}`} style={{ ["--kat" as string]: KATEGORI[f.kategori]?.farg }} title={p.map((y) => `${y.titel}${y.tid_fran ? " " + y.tid_fran : ""} · ${STATUSNAMN[y.status]}`).join("\n")}>{f.fran === x || x === dagar[0] ? <span>{f.titel}</span> : null}</Link>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="admin__meta" style={{ marginTop: 10 }}>Tomt = ledigt. Förfrågningar visas streckade och reserverar inget. Hela boendet visas upptaget så fort någon del är bokad.</p>
          </>
        );
      })()}

      <div className="kal-forklaring">
        <span><i className="kal-post kal-post--bekraftad" /> Bekräftad</span>
        <span><i className="kal-post kal-post--preliminar" /> Preliminär</span>
        <span><i className="kal-post kal-post--forfragan" /> Förfrågan</span>
        <span><i className="kal-post kal-post--info" /> Information (reserverar inget)</span>
      </div>
    </>
  );
}

function veckonummer(mandag: string) {
  const t = new Date(plus(mandag, 3) + "T12:00:00Z");
  const jan4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((t.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}
