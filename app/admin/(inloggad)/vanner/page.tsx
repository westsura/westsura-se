import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Vanner() {
  await kravAdmin("kommunikation", "vardskap");
  const db = await supabaseServer();
  const { data } = await db.from("van").select("*").order("samtycke_tid", { ascending: false });
  const aktiva = data?.filter((v) => !v.avanmald_tid) ?? [];
  return (
    <>
      <header className="admin__head">
        <div><p className="label">Westsuras Vänner</p><h1 className="admin__h1">{aktiva.length} vänner</h1></div>
        <a className="btn btn--ghost btn--sm" href={`data:text/csv;charset=utf-8,${encodeURIComponent("namn;epost;anmald\n" + aktiva.map((v) => `${v.namn ?? ""};${v.epost};${v.samtycke_tid.slice(0, 10)}`).join("\n"))}`} download="westsuras-vanner.csv">Ladda ner som CSV</a>
      </header>
      <div className="admin__panel">
        <p className="admin__meta" style={{ marginBottom: 12 }}>Nyhetsbrevsredaktören kommer i etapp III. Tills dess: ladda ner listan och skicka från Resend eller ert e-postprogram.</p>
        <div className="tablewrap">
          <table className="admin__table"><thead><tr><th>Namn</th><th>E-post</th><th>Anmäld</th><th>Källa</th></tr></thead>
            <tbody>{aktiva.map((v) => <tr key={v.id}><td>{v.namn}</td><td>{v.epost}</td><td>{v.samtycke_tid.slice(0, 10)}</td><td>{v.kalla}</td></tr>)}</tbody></table>
        </div>
      </div>
    </>
  );
}
