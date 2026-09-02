import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import Blockera from "./Blockera";

export const dynamic = "force-dynamic";

const MAN = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function Kalender({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await kravAdmin("vardskap");
  const { m } = await searchParams;
  const nu = new Date();
  const [ar, man] = (m ?? `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, "0")}`).split("-").map(Number);
  const start = new Date(Date.UTC(ar, man - 1, 1));
  const slut = new Date(Date.UTC(ar, man, 1));
  const dagar = Array.from({ length: Math.round((slut.getTime() - start.getTime()) / 86400000) }, (_, i) => new Date(start.getTime() + i * 86400000));
  const fg = new Date(Date.UTC(ar, man - 2, 1)), ng = slut;

  const db = await supabaseServer();
  const [{ data: enheter }, { data: bokningar }, { data: blockeringar }] = await Promise.all([
    db.from("enhet").select("id, namn, ingar_i, ar_hela_boendet").eq("aktiv", true).order("ordning"),
    db.from("bokningar_admin").select("*").neq("status", "avbokad").lt("ankomst", iso(slut)).gt("avresa", iso(start)),
    db.from("blockering").select("*").lt("fran", iso(slut)).gt("till", iso(start)),
  ]);

  type Cell = { typ: "bokning" | "block"; namn: string; status?: string; id: string; start: boolean; slut: boolean };
  const cell = (enhetId: string, d: Date): Cell | null => {
    const ds = iso(d);
    const b = bokningar?.find((x) => x.enhet_ids?.includes(enhetId) && x.ankomst <= ds && x.avresa > ds);
    if (b) return { typ: "bokning", namn: b.gast_namn, status: b.status, id: String(b.nummer), start: b.ankomst === ds, slut: iso(new Date(new Date(b.avresa).getTime() - 86400000)) === ds };
    const bl = blockeringar?.find((x) => x.enhet_id === enhetId && x.fran <= ds && x.till > ds);
    if (bl) return { typ: "block", namn: bl.orsak || "Blockerad", id: bl.id, start: bl.fran === ds, slut: iso(new Date(new Date(bl.till).getTime() - 86400000)) === ds };
    return null;
  };
  const idagIso = iso(new Date());

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Kalender</p><h1 className="admin__h1">{MAN[man - 1]} {ar}</h1></div>
        <div className="admin__filter">
          <Link href={`/admin/kalender?m=${fg.getUTCFullYear()}-${String(fg.getUTCMonth() + 1).padStart(2, "0")}`}>← {MAN[fg.getUTCMonth()]}</Link>
          <Link href="/admin/kalender">I dag</Link>
          <Link href={`/admin/kalender?m=${ng.getUTCFullYear()}-${String(ng.getUTCMonth() + 1).padStart(2, "0")}`}>{MAN[ng.getUTCMonth()]} →</Link>
        </div>
      </header>

      <Blockera enheter={(enheter ?? []).map((e) => ({ id: e.id, namn: e.namn }))} blockeringar={(blockeringar ?? []).map((b) => ({ id: b.id, enhet: enheter?.find((e) => e.id === b.enhet_id)?.namn ?? b.enhet_id, fran: b.fran, till: b.till, orsak: b.orsak }))} />

      <div className="admin__panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tablewrap" style={{ margin: 0 }}>
          <table className="cal">
            <thead>
              <tr>
                <th className="cal__enhet">Enhet</th>
                {dagar.map((d) => {
                  const wd = d.getUTCDay();
                  return <th key={iso(d)} className={`cal__dag${wd === 0 || wd === 6 ? " is-helg" : ""}${iso(d) === idagIso ? " is-idag" : ""}`}><span>{["S", "M", "T", "O", "T", "F", "L"][wd]}</span>{d.getUTCDate()}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {enheter?.map((e) => (
                <tr key={e.id} className={e.ingar_i ? "is-delrum" : e.ar_hela_boendet ? "is-hela" : ""}>
                  <td className="cal__enhet">{e.ingar_i ? "↳ " : ""}{e.namn}</td>
                  {dagar.map((d) => {
                    const c = cell(e.id, d);
                    const wd = d.getUTCDay();
                    return (
                      <td key={iso(d)} className={`cal__cell${wd === 0 || wd === 6 ? " is-helg" : ""}${c ? ` is-${c.typ}${c.status ? " is-" + c.status : ""}` : ""}${c?.start ? " is-start" : ""}${c?.slut ? " is-slut" : ""}`} title={c ? `${c.namn}${c.status ? " · " + c.status : ""}` : `${e.namn} ${iso(d)} ledig`}>
                        {c?.start && <span className="cal__namn">{c.namn}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="admin__meta" style={{ marginTop: 12 }}>
        <span className="pill pill--bekraftad">bekräftad</span> <span className="pill pill--preliminar">preliminär</span> <span className="pill pill--block">blockerad</span> — hela boendet visar upptaget så fort någon enhet är bokad.
      </p>
    </>
  );
}
