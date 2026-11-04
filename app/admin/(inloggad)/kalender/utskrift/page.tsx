import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import { KATEGORI, ARENDESTATUS, type Arende } from "@/lib/arende";
import { hamtaPoster, paDag, plus, iso } from "@/lib/kalender";
import SkrivUt from "../../SkrivUt";

export const dynamic = "force-dynamic";

const DAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const langt = (d: string) => { const x = new Date(d + "T12:00:00"); return `${DAG[x.getDay()]} ${x.getDate()} ${MAN[x.getMonth()]}`; };

/** Körschema för en dag (eller några dagar): allt som händer, med kontakt, antal och önskemål. */
export default async function Dagsschema({ searchParams }: { searchParams: Promise<{ d?: string; dagar?: string }> }) {
  await kravAdmin("vardskap");
  const sp = await searchParams;
  const fran = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : iso(new Date());
  const antal = Math.min(14, Math.max(1, Number(sp.dagar) || 1));
  const till = plus(fran, antal - 1);
  const db = await supabaseServer();
  const [poster, { data: delar }, { data: lokaler }, { data: enheter }] = await Promise.all([
    hamtaPoster(fran, till),
    db.from("arende_del").select("id, arende:arende_id(*)").lte("fran", till).gte("till", fran),
    db.from("lokal").select("id, namn"),
    db.from("enhet").select("id, namn"),
  ]);
  // Kunduppgifter och önskemål för de interna bokningarna.
  const arendeFor = new Map(((delar ?? []) as unknown as { id: string; arende: Arende }[]).map((d) => [d.id, d.arende]));
  const resurs = (l: string[], e: string[]) => [...l.map((x) => lokaler?.find((y) => y.id === x)?.namn ?? x), ...e.map((x) => enheter?.find((y) => y.id === x)?.namn ?? x)].join(", ");

  return (
    <div className="korschema">
      <div className="print-hide" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <Link href={`/admin/kalender?vy=dag&d=${fran}`}>← Kalendern</Link>
        <Link href={`/admin/kalender/utskrift?d=${fran}&dagar=1`}>En dag</Link>
        <Link href={`/admin/kalender/utskrift?d=${fran}&dagar=7`}>Sju dagar</Link>
        <SkrivUt etikett="Skriv ut / spara som PDF" />
      </div>
      <p className="label">Körschema · Westsura Herrgård</p>
      <h1 className="admin__h1">{antal === 1 ? langt(fran) : `${langt(fran)} – ${langt(till)}`}</h1>
      {Array.from({ length: antal }, (_, i) => plus(fran, i)).map((dag) => {
        const p = paDag(poster, dag);
        return (
          <section key={dag} className="korschema__dag">
            {antal > 1 && <h2 className="admin__h2">{langt(dag).replace(/^./, (c) => c.toUpperCase())}</h2>}
            {!p.length ? <p className="empty">Inget inlagt.</p> : (
              <table className="admin__table">
                <thead><tr><th>Tid</th><th>Vad</th><th>Var</th><th>Kontakt / noteringar</th></tr></thead>
                <tbody>
                  {p.map((x) => {
                    const a = x.kalla === "arende" ? arendeFor.get(x.id) : undefined;
                    return (
                      <tr key={x.id + dag}>
                        <td>{x.fran === dag && x.tid_fran ? `${x.tid_fran}${x.tid_till ? "–" + x.tid_till : ""}` : x.fran < dag ? "pågår" : "hela dagen"}</td>
                        <td><b>{x.titel}</b><br /><small>{KATEGORI[x.kategori]?.namn}{x.under ? ` · ${x.under}` : ""}{a && a.typ !== "intern" ? ` · ${ARENDESTATUS[a.status]}` : ""}{a?.antal_gaster ? ` · ${a.antal_gaster} gäster` : ""}</small></td>
                        <td>{resurs(x.lokaler, x.enheter) || "—"}</td>
                        <td><small>{a ? [a.kund_namn, a.kund_telefon].filter(Boolean).join(" · ") : ""}{a?.onskemal ? <><br />Önskemål: {a.onskemal}</> : null}{a?.anteckningar ? <><br />Internt: {a.anteckningar}</> : null}</small></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
      <p className="admin__meta" style={{ marginTop: 24 }}>Utskrivet {new Date().toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" })}</p>
    </div>
  );
}
