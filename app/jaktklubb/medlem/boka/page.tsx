import type { Metadata } from "next";
import Link from "next/link";
import { kravMedlem, kursStatus, arMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import Boka, { type Jaktdag } from "./Boka";

export const metadata: Metadata = { title: "Boka jakt" };
export const dynamic = "force-dynamic";

export default async function BokaJakt() {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const kurs = await kursStatus(medlem);
  const gast = !arMedlem(medlem);

  // Medlemmar ser klubbens egna jaktdagar och de öppna; gästjägare bara de öppna.
  const [{ data: tillfallen }, { data: mina }, { count: godkanda }] = await Promise.all([
    adm.from("tillfalle").select("id, titel, beskrivning, datum, tid, samling, program, platser, pris, synlighet")
      .eq("typ", "jakt").in("synlighet", gast ? ["publik"] : ["medlem", "publik"]).eq("publicerad", true).gte("datum", idag).order("datum"),
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
          <p className="jk-lede">{gast ? "Öppna jaktdagar bokas här. Som medlem får du dessutom klubbens egna jaktdagar och ingående vak- och pyrschdygn." : "Välj en gemensam jaktdag eller planera ett vak- och pyrschdygn på våra marker."}</p>
        </div>
      </header>

      {!jaktdagar.length && (
        <section className="jk-kort jk-kort--ljus jk-kort--bred">
          <p className="jk-lede mb-0">Säsongens jaktdagar läggs upp inom kort. Du får ett mejl när de finns här.</p>
        </section>
      )}
      {/* Mjuk spärr: bokningen går igenom, men kursen påminns om tills den är godkänd */}
      {!kurs.godkand && (
        <p className="kurs__varning" role="status">
          <span>Säkerhetskursen är inte genomförd. Du kan boka nu, men provet måste vara godkänt före din första jaktdag — <Link href="/jaktklubb/medlem/sakerhetskurs">gör kursen här</Link>, det tar en kvart.</span>
        </p>
      )}
      {!!jaktdagar.length && <Boka jaktdagar={jaktdagar} dokumentKlara={godkanda === 3} kursKlar={kurs.godkand} gast={gast} />}

      <section className="jk-kort jk-kort--bred jk-veta">
        <p className="jk-etikett">Inför din bokning</p>
        <p className="jk-lede mb-0">Säkerhetskursen görs online i medlemsklubben och ska vara godkänd före första jaktdagen. Boende och mat bokas separat.</p>
      </section>
    </>
  );
}
