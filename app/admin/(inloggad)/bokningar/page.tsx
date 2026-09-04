import { kravAdmin, datum, kr } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import BokningsKnappar from "./BokningsKnappar";
import ManuellBokning from "./ManuellBokning";
import Link from "next/link";
import FakturaKnapp from "../FakturaKnapp";

export const dynamic = "force-dynamic";

export default async function Bokningar({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await kravAdmin("vardskap");
  const { status } = await searchParams;
  const db = await supabaseServer();
  let q = db.from("bokningar_admin").select("*").order("ankomst", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data: bokningar } = await q.limit(200);
  const { data: enheter } = await db.from("enhet").select("id, namn").eq("aktiv", true).order("ordning");

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Bokningar</p><h1 className="admin__h1">alla bokningar</h1></div>
        <div className="admin__filter">
          {[["", "Alla"], ["preliminar", "Preliminära"], ["bekraftad", "Bekräftade"], ["avbokad", "Avbokade"]].map(([v, l]) => (
            <Link key={v} href={v ? `/admin/bokningar?status=${v}` : "/admin/bokningar"} aria-current={(status ?? "") === v ? "page" : undefined}>{l}</Link>
          ))}
        </div>
      </header>

      <ManuellBokning enheter={enheter ?? []} />

      <div className="admin__panel">
        <div className="tablewrap">
          <table className="admin__table">
            <thead><tr><th>Nr</th><th>Gäst</th><th>Datum</th><th>Enheter</th><th>Pers</th><th className="num">Summa</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {!bokningar?.length && <tr><td colSpan={8} className="empty">Inga bokningar.</td></tr>}
              {bokningar?.map((b) => (
                <tr key={b.id} id={String(b.nummer)} className={`st-${b.status}`}>
                  <td className="num">{b.nummer}</td>
                  <td><b>{b.gast_namn}</b><br /><small>{b.gast_epost}{b.gast_telefon ? " · " + b.gast_telefon : ""}</small>{b.meddelande && <><br /><small><em>{b.meddelande}</em></small></>}</td>
                  <td>{datum(b.ankomst)} – {datum(b.avresa)}</td>
                  <td>{b.enheter}{b.frukost ? <><br /><small>Frukost</small></> : null}{b.antal_hundar ? <><br /><small>{b.antal_hundar} hund</small></> : null}{b.rabattkod ? <><br /><small>Kod {b.rabattkod}</small></> : null}</td>
                  <td className="num">{b.antal_personer}</td>
                  <td className="num">{kr(b.summa)}</td>
                  <td><span className={`pill pill--${b.status}`}>{b.status}</span><br /><small>{b.kalla}</small></td>
                  <td>
                    <BokningsKnappar id={b.id} status={b.status} />
                    <div style={{ marginTop: 6 }}><FakturaKnapp bokningId={b.id} underlagId={b.underlag_id} status={b.fakturastatus} /></div>
                    {b.faktura && <small title={[b.faktura.foretag, b.faktura.orgnr, b.faktura.adress, b.faktura.referens, b.faktura.epost].filter(Boolean).join(" · ")}>Fakturauppgifter lämnade</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
