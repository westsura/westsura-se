import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { authIdFor } from "@/lib/konto";
import SattLosenord from "./SattLosenord";
import NyAdmin from "./NyAdmin";
import Behorighet from "./Behorighet";
import { OMRADEN } from "@/lib/roller";
import TaBortKnapp from "@/components/TaBortKnapp";
import { taBortAdmin } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

type Inbjudan = { epost: string; namn: string | null; roller: string[]; skapad: string };

/** Superadmin: vilka som får logga in i admin och deras lösenord. Inbjudningar läggs till i tabellen admin_inbjudan. */
export default async function Anvandare() {
  const jag = await kravAdmin("superadmin");
  const { data } = await supabaseAdmin().from("admin_inbjudan").select("*").order("skapad");
  const lista = (data ?? []) as Inbjudan[];
  const harKonto = await Promise.all(lista.map(async (i) => !!(await authIdFor(i.epost))));

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Admin</p><h1 className="admin__h1">användare</h1></div>
        <p className="admin__meta">Lägg till personer, välj vilka delar av admin de kommer åt, och ta bort den som inte längre ska ha tillgång.</p>
      </header>
      <NyAdmin />
      <div className="admin__panel">
        <div className="tablewrap">
          <table className="admin__table">
            <thead><tr><th>Namn</th><th>E-post</th><th>Tillgång till</th><th>Konto</th><th></th></tr></thead>
            <tbody>
              {lista.map((i, n) => (
                <tr key={i.epost}>
                  <td><b>{i.namn ?? "—"}</b></td>
                  <td>{i.epost}</td>
                  <td><Behorighet epost={i.epost} roller={i.roller} /></td>
                  <td><span className={`pill pill--${harKonto[n] ? "godkand" : "saknas"}`}>{harKonto[n] ? "Finns" : "Inget ännu"}</span></td>
                  <td className="admin__actions">
                    <SattLosenord epost={i.epost} />
                    {i.epost.toLowerCase() !== jag.epost.toLowerCase() && (
                      <TaBortKnapp gor={taBortAdmin.bind(null, i.epost)} fraga={`Ta bort ${i.namn ?? i.epost} från admin? Personen kan inte längre logga in i admin.`} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Vad områdena ger</h2>
        {OMRADEN.map((o) => <p key={o.roll} className="admin__meta" style={{ margin: "0 0 6px" }}><b>{o.namn}:</b> {o.ger}</p>)}
      </div>
    </>
  );
}
