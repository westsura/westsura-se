import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import ForfraganKort from "./ForfraganKort";

export const dynamic = "force-dynamic";

export default async function Forfragningar() {
  await kravAdmin("vardskap");
  const db = await supabaseServer();
  const { data } = await db.from("forfragan").select("*").order("skapad", { ascending: false }).limit(200);
  const { data: underlag } = await db.from("fakturaunderlag").select("id, forfragan_id, status").not("forfragan_id", "is", null).order("skapad", { ascending: false });
  const u = (id: string) => underlag?.find((x) => x.forfragan_id === id);
  const oppna = data?.filter((f) => f.status === "ny" || f.status === "pagar") ?? [];
  const ovriga = data?.filter((f) => f.status !== "ny" && f.status !== "pagar") ?? [];
  return (
    <>
      <header className="admin__head"><div><p className="label">Förfrågningar</p><h1 className="admin__h1">inkorgen</h1></div></header>
      {!oppna.length && <p className="empty" style={{ marginBottom: 24 }}>Inga öppna förfrågningar.</p>}
      {oppna.map((f) => <ForfraganKort key={f.id} f={f} underlag={u(f.id)} />)}
      {!!ovriga.length && <><h2 className="admin__h2" style={{ marginTop: 40 }}>Avslutade</h2>{ovriga.map((f) => <ForfraganKort key={f.id} f={f} underlag={u(f.id)} />)}</>}
    </>
  );
}
