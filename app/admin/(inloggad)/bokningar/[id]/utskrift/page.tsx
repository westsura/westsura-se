import Link from "next/link";
import { notFound } from "next/navigation";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import { ARENDETYP, ARENDESTATUS, DELTYP, arendeNamn, tid, type Arende, type Del } from "@/lib/arende";
import SkrivUt from "../../../SkrivUt";

export const dynamic = "force-dynamic";

const DAG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const langt = (d: string) => { const x = new Date(d + "T12:00:00"); return `${DAG[x.getDay()]} ${x.getDate()} ${MAN[x.getMonth()]} ${x.getFullYear()}`; };
const dagEfter = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };

/** Körschema för en bokning — att skriva ut inför konferensen, middagen eller arrangemanget. */
export default async function Utskrift({ params }: { params: Promise<{ id: string }> }) {
  await kravAdmin("vardskap");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await supabaseServer();
  const { data: a } = await db.from("arende").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();
  const arende = a as Arende;
  const [{ data: delar }, { data: lokaler }, { data: enheter }, { data: uppgifter }] = await Promise.all([
    db.from("arende_del").select("*").eq("arende_id", id).order("fran").order("tid_fran"),
    db.from("lokal").select("id, namn"),
    db.from("enhet").select("id, namn"),
    db.from("uppgift").select("text, forfallo").eq("arende_id", id).eq("klar", false).order("forfallo", { nullsFirst: false }),
  ]);
  const D = (delar ?? []) as Del[];
  const resurs = (d: Del) => [...d.lokal_ids.map((x) => lokaler?.find((l) => l.id === x)?.namn ?? x), ...d.enhet_ids.map((x) => enheter?.find((e) => e.id === x)?.namn ?? x)].join(", ");
  const dagar = [...new Set(D.map((d) => d.fran))];

  return (
    <div className="korschema">
      <div className="print-hide" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <Link href={`/admin/bokningar/${id}`}>← Tillbaka till bokningen</Link>
        <SkrivUt etikett="Skriv ut / spara som PDF" />
      </div>
      <p className="label">Körschema · #{arende.nummer} · {ARENDETYP[arende.typ]}{arende.typ !== "intern" ? ` · ${ARENDESTATUS[arende.status]}` : ""}</p>
      <h1 className="admin__h1" style={{ marginBottom: 6 }}>{arendeNamn(arende)}</h1>

      {arende.typ !== "intern" && (
        <dl className="uppgifter">
          {arende.kund_namn && <div><dt>Kontakt</dt><dd>{arende.kund_namn}{arende.kund_telefon ? ` · ${arende.kund_telefon}` : ""}{arende.kund_epost ? ` · ${arende.kund_epost}` : ""}</dd></div>}
          {arende.kund_foretag && <div><dt>Företag</dt><dd>{arende.kund_foretag}</dd></div>}
          {arende.antal_gaster != null && <div><dt>Antal gäster</dt><dd>{arende.antal_gaster}</dd></div>}
          {arende.onskemal && <div><dt>Önskemål</dt><dd style={{ whiteSpace: "pre-line" }}>{arende.onskemal}</dd></div>}
          {arende.anteckningar && <div><dt>Interna anteckningar</dt><dd style={{ whiteSpace: "pre-line" }}>{arende.anteckningar}</dd></div>}
        </dl>
      )}

      {dagar.map((dag) => (
        <section key={dag} className="korschema__dag">
          <h2 className="admin__h2">{langt(dag).replace(/^./, (c) => c.toUpperCase())}</h2>
          <table className="admin__table">
            <thead><tr><th>Tid</th><th>Vad</th><th>Var</th><th className="num">Antal</th></tr></thead>
            <tbody>
              {D.filter((d) => d.fran === dag).map((d) => (
                <tr key={d.id}>
                  <td>{d.typ === "boende" ? `till ${langt(dagEfter(d.till))}` : d.tid_fran ? `${tid(d.tid_fran)}${d.tid_till ? "–" + tid(d.tid_till) : ""}` : "—"}{d.typ !== "boende" && d.till !== d.fran ? ` (t.o.m. ${langt(d.till)})` : ""}</td>
                  <td><b>{DELTYP[d.typ]}</b>{d.beskrivning ? ` — ${d.beskrivning}` : ""}</td>
                  <td>{resurs(d) || "—"}</td>
                  <td className="num">{d.antal ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {!dagar.length && <p className="empty">Inga tjänster inlagda.</p>}

      {!!uppgifter?.length && (
        <section className="korschema__dag">
          <h2 className="admin__h2">Att göra</h2>
          <ul>{uppgifter.map((u, i) => <li key={i}>☐ {u.text}{u.forfallo ? ` (senast ${u.forfallo})` : ""}</li>)}</ul>
        </section>
      )}
      <p className="admin__meta" style={{ marginTop: 24 }}>Utskrivet {new Date().toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" })} · Westsura Herrgård</p>
    </div>
  );
}
