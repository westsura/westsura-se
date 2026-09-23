import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import SasongKort from "./SasongKort";
import SasongForm from "./SasongForm";
import type { SasongRad, NivaRad } from "./delar";

export const dynamic = "force-dynamic";

export default async function Sasonger() {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const [{ data: sasonger }, { data: nivaer }, { data: medlemmar }] = await Promise.all([
    db.from("jaktsasong").select("*").order("fran", { ascending: false }),
    db.from("medlemsniva").select("*").order("ordning"),
    db.from("jaktmedlem").select("sasong_id, niva_id, status"),
  ]);
  const S = (sasonger ?? []) as SasongRad[];
  const N = (nivaer ?? []) as NivaRad[];
  const tagna = (nivaId: string) => (medlemmar ?? []).filter((m) => m.niva_id === nivaId && m.status === "godkand").length;

  return (
    <>
      <header className="admin__head">
        <div><p className="label"><Link href="/admin/jaktklubb" style={{ textDecoration: "none" }}>Jaktklubben</Link> · Säsonger</p><h1 className="admin__h1">säsonger och nivåer</h1></div>
        <p className="admin__meta">Bara den aktiva säsongen syns på sajten. Nästa års nivåer kan ligga klara utan att visas.</p>
      </header>

      {S.map((sas) => (
        <SasongKort key={sas.id} sasong={sas} nivaer={N.filter((n) => n.sasong_id === sas.id)} tagna={Object.fromEntries(N.filter((n) => n.sasong_id === sas.id).map((n) => [n.id, tagna(n.id)]))} andraSasonger={S.filter((x) => x.id !== sas.id)} />
      ))}

      <div className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Ny säsong</h2>
        <SasongForm forslag={nastaSasong(S)} />
      </div>
    </>
  );
}

/** Förslag: året efter den senaste säsongen, jaktåret 1 juli–30 juni. */
function nastaSasong(S: SasongRad[]) {
  const senaste = S[0];
  const ar = senaste ? Number(senaste.fran.slice(0, 4)) + 1 : new Date().getFullYear();
  return { namn: `${ar}/${ar + 1}`, fran: `${ar}-07-01`, till: `${ar + 1}-06-30`, moms: senaste?.moms ?? 25 };
}
