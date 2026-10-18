import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { kravMedlem, harEkipage } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import type { Hund } from "@/lib/ekipage";
import HundLista from "./HundLista";

export const metadata: Metadata = { title: "Mina hundar" };
export const dynamic = "force-dynamic";

export default async function MinaHundar() {
  const medlem = await kravMedlem();
  if (!harEkipage(medlem)) redirect("/jaktklubb/medlem");
  const { data } = await supabaseAdmin().from("hund").select("id, namn, ras, fodd, regnr, driver, eftersok, meriter").eq("agare_id", medlem.id).order("skapad");
  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Mina hundar</p>
          <h1 className="jk-h1">Dina hundar.</h1>
          <p className="jk-lede">Håll uppgifterna aktuella — jaktledaren ser dem när du anmäler intresse för en jaktdag. Du kan ha upp till åtta hundar.</p>
        </div>
      </header>
      <HundLista hundar={(data ?? []) as Hund[]} />
    </>
  );
}
