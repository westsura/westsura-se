import Link from "next/link";
import { kravAdmin, datum, kr } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import { ARENDETYP, ARENDESTATUS, arendeNamn, foljUpp, tid, type Arende, type Del } from "@/lib/arende";

export const dynamic = "force-dynamic";

type Rad = {
  key: string; href: string; nummer: string; namn: string; kontakt: string; typ: string; status: string;
  datum: string | null; vad: string; folj: { niva: string; text: string } | null; kalla: string;
};

const STATUSFILTER = [["", "Alla aktiva"], ["forfragan", "Förfrågningar"], ["preliminar", "Preliminära"], ["bekraftad", "Bekräftade"], ["avbokad", "Avbokade"]];

/** Alla bokningar på ett ställe: interna (förfrågningar, konferenser, middagar, interna aktiviteter) och boende bokat på sajten. */
export default async function Bokningar({ searchParams }: { searchParams: Promise<{ q?: string; typ?: string; status?: string; tid?: string }> }) {
  await kravAdmin("vardskap");
  const { q = "", typ = "", status = "", tid: period = "kommande" } = await searchParams;
  const db = await supabaseServer();
  const idag = new Date().toISOString().slice(0, 10);

  const [{ data: arenden }, { data: delar }, { data: webb }, { data: lokaler }, { data: enheter }] = await Promise.all([
    db.from("arende").select("*").order("skapad", { ascending: false }).limit(500),
    db.from("arende_del").select("*").order("fran"),
    typ && typ !== "boende" ? Promise.resolve({ data: [] }) : db.from("bokningar_admin").select("*").order("ankomst", { ascending: false }).limit(300),
    db.from("lokal").select("id, namn"),
    db.from("enhet").select("id, namn"),
  ]);
  const D = (delar ?? []) as Del[];
  const lokalNamn = (id: string) => lokaler?.find((l) => l.id === id)?.namn ?? id;
  const enhetNamn = (id: string) => enheter?.find((e) => e.id === id)?.namn ?? id;

  const rader: Rad[] = [
    ...((arenden ?? []) as Arende[]).map((a) => {
      const mina = D.filter((d) => d.arende_id === a.id);
      const forsta = mina[0];
      return {
        key: a.id, href: `/admin/bokningar/${a.id}`, nummer: `#${a.nummer}`, namn: arendeNamn(a),
        kontakt: [a.kund_namn !== arendeNamn(a) ? a.kund_namn : null, a.kund_telefon, a.kund_epost].filter(Boolean).join(" · "),
        typ: a.typ, status: a.status, datum: forsta?.fran ?? null,
        vad: mina.map((d) => `${datum(d.fran)}${d.tid_fran ? " " + tid(d.tid_fran) : ""} ${d.beskrivning || d.typ}${d.lokal_ids.length ? " · " + d.lokal_ids.map(lokalNamn).join(", ") : ""}${d.enhet_ids.length ? " · " + d.enhet_ids.map(enhetNamn).join(", ") : ""}`).join("\n") || "Datum ej satt",
        folj: foljUpp(a, idag), kalla: a.forfragan_id ? "Förfrågan via sajten" : a.typ === "intern" ? "Internt" : "Admin",
      };
    }),
    ...((webb ?? []) as { id: string; nummer: number; gast_namn: string; gast_telefon: string | null; gast_epost: string; status: string; ankomst: string; avresa: string; enheter: string | null; paket_namn: string | null; summa: number; antal_personer: number }[]).map((b) => ({
      key: b.id, href: `/admin/bokningar/boende#${b.nummer}`, nummer: String(b.nummer), namn: b.gast_namn,
      kontakt: [b.gast_telefon, b.gast_epost].filter(Boolean).join(" · "), typ: "boende", status: b.status, datum: b.ankomst,
      vad: `${datum(b.ankomst)}–${datum(b.avresa)} · ${b.paket_namn ? b.paket_namn + " · " : ""}${b.enheter ?? ""} · ${b.antal_personer} pers · ${kr(b.summa)}`,
      folj: null, kalla: "Bokat på sajten",
    })),
  ];

  const sok = q.trim().toLowerCase();
  const synliga = rader
    .filter((r) => (status ? r.status === status : r.status !== "avbokad"))
    .filter((r) => !typ || r.typ === typ)
    .filter((r) => period === "alla" || !r.datum || r.datum >= idag)
    .filter((r) => !sok || `${r.nummer} ${r.namn} ${r.kontakt} ${r.vad}`.toLowerCase().includes(sok) || (sok.match(/^\d{4}-\d{2}-\d{2}$/) && r.datum === sok))
    .sort((a, b) => (a.datum ?? "9999") < (b.datum ?? "9999") ? (period === "alla" ? 1 : -1) : (period === "alla" ? -1 : 1));
  const attFoljaUpp = synliga.filter((r) => r.folj);

  const lank = (p: Record<string, string>) => {
    const u = new URLSearchParams({ ...(q && { q }), ...(typ && { typ }), ...(status && { status }), ...(period !== "kommande" && { tid: period }), ...p });
    for (const [k, v] of [...u.entries()]) if (!v) u.delete(k);
    const s = u.toString();
    return `/admin/bokningar${s ? "?" + s : ""}`;
  };

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Bokningar</p><h1 className="admin__h1">bokningar och förfrågningar</h1></div>
        <div className="admin__actions">
          <Link className="btn btn--sm" href="/admin/bokningar/ny">+ Ny bokning</Link>
          <Link className="btn btn--sm btn--ghost" href="/admin/bokningar/ny?intern=1">+ Intern aktivitet</Link>
          <Link className="btn btn--sm btn--ghost" href="/admin/bokningar/mallar">Mejlmallar</Link>
        </div>
      </header>

      <form className="admin__sok" action="/admin/bokningar">
        <input name="q" defaultValue={q} placeholder="Sök kund, företag, nummer eller datum (2026-12-06)" aria-label="Sök" />
        {typ && <input type="hidden" name="typ" value={typ} />}
        {status && <input type="hidden" name="status" value={status} />}
        {period !== "kommande" && <input type="hidden" name="tid" value={period} />}
        <button className="btn btn--sm" type="submit">Sök</button>
      </form>

      <div className="admin__filter admin__filter--rad">
        {STATUSFILTER.map(([v, l]) => <Link key={v} href={lank({ status: v })} aria-current={status === v ? "page" : undefined}>{l}</Link>)}
      </div>
      <div className="admin__filter admin__filter--rad">
        <Link href={lank({ typ: "" })} aria-current={!typ ? "page" : undefined}>Alla typer</Link>
        {Object.entries(ARENDETYP).map(([k, v]) => <Link key={k} href={lank({ typ: k })} aria-current={typ === k ? "page" : undefined}>{v}</Link>)}
        <span style={{ flex: 1 }} />
        <Link href={lank({ tid: period === "alla" ? "" : "alla" })}>{period === "alla" ? "Visa bara kommande" : "Visa även tidigare"}</Link>
      </div>

      {!!attFoljaUpp.length && (
        <div className="notice" style={{ marginBottom: 16 }}>
          <strong>Att följa upp:</strong> {attFoljaUpp.map((r, i) => <span key={r.key}>{i ? ", " : " "}<Link href={r.href}>{r.namn}</Link> ({r.folj!.text.toLowerCase()})</span>)}
        </div>
      )}

      <div className="admin__panel">
        <div className="tablewrap">
          <table className="admin__table bok-tabell">
            <thead><tr><th>Nr</th><th>Kund / aktivitet</th><th>Vad och när</th><th>Typ</th><th>Status</th></tr></thead>
            <tbody>
              {!synliga.length && <tr><td colSpan={5} className="empty">Inga bokningar matchar.</td></tr>}
              {synliga.map((r) => (
                <tr key={r.key} className={`st-${r.status}`}>
                  <td className="num"><Link href={r.href}>{r.nummer}</Link></td>
                  <td><Link href={r.href}><b>{r.namn}</b></Link>{r.kontakt && <><br /><small>{r.kontakt}</small></>}<br /><small className="muted">{r.kalla}</small></td>
                  <td><small style={{ whiteSpace: "pre-line" }}>{r.vad}</small></td>
                  <td><span className="kal-typ" data-typ={r.typ}>{ARENDETYP[r.typ] ?? r.typ}</span></td>
                  <td><span className={`pill pill--${r.status}`}>{ARENDESTATUS[r.status] ?? r.status}</span>{r.folj && <><br /><small className={`folj folj--${r.folj.niva}`}>{r.folj.text}</small></>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="admin__meta" style={{ marginTop: 12 }}>Boende som gäster bokat på sajten hanteras som förut under <Link href="/admin/bokningar/boende">Boende bokat på sajten</Link>. Förfrågningar från sajten läggs in här automatiskt.</p>
    </>
  );
}
