import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import { PLATSHALLARE, type Mejlmall } from "@/lib/arendemejl";
import MallForm from "./MallForm";

export const dynamic = "force-dynamic";

export default async function Mallar() {
  await kravAdmin("vardskap");
  const db = await supabaseServer();
  const { data } = await db.from("mejlmall").select("*").order("ordning");
  return (
    <>
      <header className="admin__head">
        <div><p className="label"><Link href="/admin/bokningar">← Bokningar</Link></p><h1 className="admin__h1">mejlmallar</h1></div>
        <p className="admin__meta">Mallarna är utgångspunkten — varje mejl går att ändra innan det skickas.</p>
      </header>
      <section className="admin__panel" style={{ marginBottom: 20 }}>
        <h2 className="admin__h2">Platshållare</h2>
        <p className="admin__meta" style={{ marginTop: 0, marginBottom: 10 }}>Skriv dem i ämne, rubrik eller text så fylls de i från bokningen.</p>
        <dl className="uppgifter">{PLATSHALLARE.map(([k, v]) => <div key={k}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
      </section>
      {((data ?? []) as Mejlmall[]).map((m) => <MallForm key={m.id} m={m} />)}
    </>
  );
}
