import type { Metadata } from "next";
import { kravMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import Boka, { type Jaktdag } from "./Boka";

export const metadata: Metadata = { title: "Boka jakt" };
export const dynamic = "force-dynamic";

export default async function BokaJakt() {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);

  const [{ data: tillfallen }, { data: mina }, { count: godkanda }] = await Promise.all([
    adm.from("tillfalle").select("id, titel, beskrivning, datum, tid, samling, program, platser")
      .eq("typ", "jakt").eq("synlighet", "medlem").eq("publicerad", true).gte("datum", idag).order("datum"),
    adm.from("anmalan").select("tillfalle_id, status").eq("epost", medlem.epost).neq("status", "avbokad"),
    adm.from("medlemsdokument").select("id", { count: "exact", head: true }).eq("medlem_id", medlem.id).eq("status", "godkand"),
  ]);

  const jaktdagar: Jaktdag[] = await Promise.all((tillfallen ?? []).map(async (t) => {
    const { data: kvar } = await adm.rpc("platser_kvar", { t: t.id });
    return {
      ...t,
      kvar: typeof kvar === "number" ? kvar : t.platser,
      minStatus: (mina ?? []).find((a) => a.tillfalle_id === t.id)?.status ?? null,
    } as Jaktdag;
  }));

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Jakten på Westsura</p>
          <h1 className="jk-h1">Hitta din nästa jaktdag.</h1>
          <p className="jk-lede">Välj en gemensam jaktdag eller planera ett vak- och pyrschdygn på våra marker.</p>
        </div>
      </header>

      {!jaktdagar.length && (
        <section className="jk-kort jk-kort--ljus jk-kort--bred">
          <p className="jk-lede mb-0">Säsongens jaktdagar läggs upp inom kort. Du får ett mejl när de finns här.</p>
        </section>
      )}
      {!!jaktdagar.length && <Boka jaktdagar={jaktdagar} dokumentKlara={godkanda === 3} />}

      <section className="jk-kort jk-kort--bred jk-veta">
        <p className="jk-etikett">Inför din bokning</p>
        <p className="jk-lede mb-0">Årets säkerhets- och skyttekurs behöver vara genomförd. Boende och mat bokas separat.</p>
      </section>
    </>
  );
}
