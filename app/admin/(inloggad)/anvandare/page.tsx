import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { authIdFor } from "@/lib/konto";
import SattLosenord from "./SattLosenord";
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
        <p className="admin__meta">Inloggning sker med e-post och lösenord. Sätt ett lösenord åt den som är ny — hen byter sedan själv under Byt lösenord.</p>
      </header>
      <div className="admin__panel">
        <div className="tablewrap">
          <table className="admin__table">
            <thead><tr><th>Namn</th><th>E-post</th><th>Roller</th><th>Konto</th><th>Lösenord</th></tr></thead>
            <tbody>
              {lista.map((i, n) => (
                <tr key={i.epost}>
                  <td><b>{i.namn ?? "—"}</b></td>
                  <td>{i.epost}</td>
                  <td>{i.roller.join(", ")}</td>
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
    </>
  );
}
