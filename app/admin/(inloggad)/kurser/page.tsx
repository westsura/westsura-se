import Link from "next/link";
import { kravAdmin, kr } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import KursForm, { NyKurs, type KursRad } from "./KursForm";
import TaBortKnapp from "@/components/TaBortKnapp";
import { avbokaKursbokning } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type Bokning = { id: string; nummer: number; kurs_id: string; namn: string; epost: string; telefon: string | null; antal: number; rumstyp: string; deltagare: string | null; kost: string | null; meddelande: string | null; pris_per_person: number; earlybird: boolean; summa: number; status: string; underlag_id: string | null; skapad: string };

/** Kurser med fast helg: datum, priser och deltagarlista. */
export default async function Kurser() {
  await kravAdmin("vardskap", "ekonomi");
  const adm = supabaseAdmin();
  const [{ data: kurser }, { data: bokningar }] = await Promise.all([
    adm.from("kurs").select("*").order("datum_fran", { nullsFirst: false }).order("skapad"),
    adm.from("kursbokning").select("*").order("skapad"),
  ]);
  const B = (bokningar ?? []) as Bokning[];

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Kurser</p><h1 className="admin__h1">kurser och deltagare</h1></div>
        <p className="admin__meta">Bokningar på kurssidorna är bindande och får ett fakturaunderlag direkt.</p>
      </header>
      <NyKurs />
      {((kurser ?? []) as KursRad[]).map((k) => {
        const aktiva = B.filter((b) => b.kurs_id === k.id && b.status === "bokad");
        const avbokade = B.filter((b) => b.kurs_id === k.id && b.status !== "bokad");
        const tagna = aktiva.reduce((n, b) => n + b.antal, 0);
        return (
          <section key={k.id} id={`kurs-${k.id}`} style={{ marginBottom: 40 }}>
            <h2 className="admin__h2">{k.namn} <span className="admin__meta" style={{ fontFamily: "var(--font-sans)", fontWeight: 400 }}>· {k.datum_text}{k.med_boende ? " · helgkurs med boende" : " · dagskurs"}{!k.publicerad ? " · utkast" : ""}{!k.oppen ? " · stängd för bokning" : ""}</span></h2>
            <div className="admin__stats">
              <div className="stat"><b>{tagna} av {k.platser}</b><span>Platser bokade</span></div>
              <div className="stat"><b>{aktiva.filter((b) => b.rumstyp === "enkel").reduce((n, b) => n + b.antal, 0)}</b><span>I enkelrum</span></div>
              <div className="stat"><b>{kr(aktiva.reduce((n, b) => n + b.summa, 0))}</b><span>Bokat värde</span></div>
            </div>
            <KursForm k={k} />
            <h2 className="admin__h2" style={{ marginTop: 24 }}>Deltagare — {k.namn}</h2>
            <div className="admin__panel">
              <div className="tablewrap">
                <table className="admin__table">
                  <thead><tr><th>Nr</th><th>Bokare</th><th>Antal</th><th>Rum</th><th>Kost / meddelande</th><th className="num">Summa</th><th></th></tr></thead>
                  <tbody>
                    {!aktiva.length && <tr><td colSpan={7} className="empty">Inga bokningar än.</td></tr>}
                    {aktiva.map((b) => (
                      <tr key={b.id}>
                        <td className="num">{b.nummer}</td>
                        <td><b>{b.namn}</b><div className="admin__meta">{b.telefon} · {b.epost}</div>{b.deltagare && <div className="admin__meta">Med: {b.deltagare}</div>}</td>
                        <td className="num">{b.antal}</td>
                        <td>{!k.med_boende ? "—" : b.rumstyp === "enkel" ? "Enkelrum" : "Delat dubbel"}{b.earlybird ? <div className="admin__meta">Early Bird</div> : null}</td>
                        <td><small>{[b.kost, b.meddelande].filter(Boolean).join(" · ")}</small></td>
                        <td className="num">{kr(b.summa)}</td>
                        <td className="admin__actions">
                          {b.underlag_id && <Link className="btn btn--sm btn--ghost" href={`/admin/fakturering/${b.underlag_id}`}>Faktura</Link>}
                          <TaBortKnapp text="Avboka" gor={avbokaKursbokning.bind(null, b.id)}fraga={`Avboka ${b.namn} (${b.antal} plats${b.antal > 1 ? "er" : ""})? Platserna blir lediga igen. Kreditera fakturan i Fortnox om den redan är skickad.`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {!!avbokade.length && <p className="admin__meta" style={{ marginTop: 8 }}>Avbokade: {avbokade.map((b) => `${b.namn} (${b.antal})`).join(", ")}</p>}
          </section>
        );
      })}
    </>
  );
}
