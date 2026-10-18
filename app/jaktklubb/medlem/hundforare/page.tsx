import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { kravMedlem, harEkipage } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import HundforareDagar, { type Dag } from "./HundforareDagar";

export const metadata: Metadata = { title: "Jaktdagar för hundförare" };
export const dynamic = "force-dynamic";

/** Utlagda jaktdagar där hundföraren kan anmäla intresse att gå med hund. */
export default async function JaktdagarHundforare() {
  const medlem = await kravMedlem();
  if (!harEkipage(medlem)) redirect("/jaktklubb/medlem");
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const [{ data: dagar }, { data: mina }, { data: hundar }] = await Promise.all([
    adm.from("tillfalle").select("id, titel, beskrivning, datum, tid, samling").eq("typ", "jakt").eq("publicerad", true).gte("datum", idag).order("datum"),
    adm.from("hundforare_anmalan").select("id, tillfalle_id, status, hund_ids, meddelande").eq("jagare_id", medlem.id),
    adm.from("hund").select("id, namn, ras").eq("agare_id", medlem.id).order("skapad"),
  ]);
  const lista: Dag[] = ((dagar ?? []) as Omit<Dag, "anmalan">[]).map((d) => ({
    ...d, anmalan: ((mina ?? []) as NonNullable<Dag["anmalan"]>[]).find((a) => a.tillfalle_id === d.id && a.status !== "aterkallad") ?? null,
  }));

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Jaktdagar för hundförare</p>
          <h1 className="jk-h1">Gå med hund på jakten.</h1>
          <p className="jk-lede">Här ligger herrgårdens kommande jaktdagar. Anmäl intresse för de dagar du kan, och välj vilka hundar du vill ha med — jaktledaren godkänner och du får besked per mejl.</p>
        </div>
      </header>
      {!(hundar ?? []).length && <p className="notice">Lägg först in dina hundar under <Link href="/jaktklubb/medlem/hundar">Mina hundar</Link>.</p>}
      <HundforareDagar dagar={lista} hundar={(hundar ?? []) as { id: string; namn: string; ras: string | null }[]} />
    </>
  );
}
