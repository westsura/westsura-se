import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import type { Hund } from "@/lib/ekipage";
import EkipageLista, { type Ekipage } from "./EkipageLista";

export const dynamic = "force-dynamic";

/** Hundekipage: godkänn nya, filtrera på vad hundarna gör, mejla och bjud in till jaktdagar. */
export default async function EkipageSida() {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const [{ data: rader }, { data: hundar }, { data: jaktdagar }] = await Promise.all([
    adm.from("jaktmedlem").select("id, namn, epost, telefon, ort, status, ekipage, ekipage_status, jagarexamen, meddelande, skapad").not("ekipage", "is", null).order("skapad", { ascending: false }),
    adm.from("hund").select("id, agare_id, namn, ras, fodd, regnr, driver, eftersok, meriter"),
    adm.from("tillfalle").select("id, titel, datum").eq("typ", "jakt").gte("datum", idag).order("datum"),
  ]);
  const lista: Ekipage[] = (rader ?? []).map((r) => ({
    ...(r as Omit<Ekipage, "hundar">),
    hundar: ((hundar ?? []) as (Hund & { agare_id: string })[]).filter((h) => h.agare_id === r.id),
  }));

  return (
    <>
      <header className="admin__head">
        <div><p className="label"><Link href="/admin/jaktklubb">Jaktklubben</Link></p><h1 className="admin__h1">hundekipage</h1></div>
        <p className="admin__meta">Hundförare och eftersöksekipage registrerar sig på <a href="/jaktklubb/hundekipage" target="_blank" rel="noopener">/jaktklubb/hundekipage</a>. Godkända får inloggning och 50 % på boendet.</p>
      </header>
      <EkipageLista lista={lista} jaktdagar={(jaktdagar ?? []) as { id: string; titel: string; datum: string }[]} />
    </>
  );
}
