import Link from "next/link";
import { kravAdmin, kr, FAKTURASTATUS as STATUS } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import NyttUnderlag from "./NyttUnderlag";
import TaBortKnapp from "./TaBortKnapp";

export const dynamic = "force-dynamic";

export default async function Fakturering({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await kravAdmin("vardskap");
  const { status = "ej_fakturerad" } = await searchParams;
  const db = await supabaseServer();
  let q = db.from("fakturaunderlag_admin").select("*").order("skapad", { ascending: false });
  if (status !== "alla") q = q.eq("status", status);
  const { data: rader } = await q.limit(300);

  const { data: alla } = await db.from("fakturaunderlag_admin").select("status, summa, forfallodatum").in("status", ["ej_fakturerad", "fakturerad"]);
  const idag = new Date().toISOString().slice(0, 10);
  const attFakturera = alla?.filter((r) => r.status === "ej_fakturerad") ?? [];
  const obetalda = alla?.filter((r) => r.status === "fakturerad") ?? [];
  const forfallna = obetalda.filter((r) => r.forfallodatum && r.forfallodatum < idag);
  const sum = (xs: { summa: number }[]) => xs.reduce((a, r) => a + r.summa, 0);

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Fakturering</p><h1 className="admin__h1">underlag till fortnox</h1></div>
        <div className="admin__filter">
          {[["ej_fakturerad", "Att fakturera"], ["fakturerad", "Fakturerade"], ["betald", "Betalda"], ["alla", "Alla"]].map(([v, l]) => (
            <Link key={v} href={`/admin/fakturering?status=${v}`} aria-current={status === v ? "page" : undefined}>{l}</Link>
          ))}
        </div>
      </header>

      <div className="admin__stats">
        <Link className="stat" href="/admin/fakturering?status=ej_fakturerad"><b>{attFakturera.length}</b><span>Att fakturera · {kr(sum(attFakturera))}</span></Link>
        <Link className="stat" href="/admin/fakturering?status=fakturerad"><b>{obetalda.length}</b><span>Obetalda · {kr(sum(obetalda))}</span></Link>
        <div className="stat" style={forfallna.length ? { borderTopColor: "#a33" } : undefined}><b>{forfallna.length}</b><span>Förfallna · {kr(sum(forfallna))}</span></div>
        <div className="stat"><NyttUnderlag /><span style={{ display: "block", marginTop: 8 }}>Utan bokning eller förfrågan</span></div>
      </div>

      <div className="admin__panel">
        <div className="tablewrap">
          <table className="admin__table">
            <thead><tr><th>Nr</th><th>Kund</th><th>Avser</th><th>Källa</th><th className="num">Summa</th><th>Förfaller</th><th>Status</th><th>Fortnox</th><th></th></tr></thead>
            <tbody>
              {!rader?.length && <tr><td colSpan={9} className="empty">Inget här. Underlag skapas från en bokning eller förfrågan, eller med knappen Nytt.</td></tr>}
              {rader?.map((u) => {
                const sen = u.status === "fakturerad" && u.forfallodatum && u.forfallodatum < idag;
                return (
                  <tr key={u.id} className={u.status === "krediterad" ? "st-avbokad" : ""}>
                    <td className="num"><Link href={`/admin/fakturering/${u.id}`}>{u.nummer}</Link></td>
                    <td><b>{u.kund_foretag || u.kund_namn || <em>namn saknas</em>}</b>{u.kund_foretag && <><br /><small>{u.kund_namn}</small></>}</td>
                    <td><Link href={`/admin/fakturering/${u.id}`} style={{ textDecoration: "none" }}>{u.rubrik}</Link></td>
                    <td><small>{u.bokning_nummer ? <Link href={`/admin/bokningar#${u.bokning_nummer}`}>Bokning {u.bokning_nummer}</Link> : u.forfragan_nummer ? <Link href={`/admin/forfragningar#${u.forfragan_nummer}`}>Förfrågan {u.forfragan_nummer}</Link> : "Manuellt"}</small></td>
                    <td className="num">{kr(u.summa)}</td>
                    <td style={sen ? { color: "#a33", fontWeight: 700 } : undefined}>{u.forfallodatum ?? "—"}</td>
                    <td><span className={`pill pill--${u.status}`}>{STATUS[u.status]}</span></td>
                    <td>{u.fortnox_nummer ?? <small>—</small>}</td>
                    <td className="admin__actions"><Link className="btn btn--sm" href={`/admin/fakturering/${u.id}`}>Öppna</Link><TaBortKnapp id={u.id} nummer={u.nummer} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
