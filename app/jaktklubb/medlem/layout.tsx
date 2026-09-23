import type { Metadata } from "next";
import { kravMedlem, arMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import { site } from "@/lib/site";
import MedlemsNav from "./MedlemsNav";
import { sasongKort } from "./delar";

export const metadata: Metadata = {
  title: { default: "Medlemsklubben", template: "%s | Westsura Herrgårds jaktklubb" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MedlemsLayout({ children }: { children: React.ReactNode }) {
  const medlem = await kravMedlem();
  const { data: sasong } = await supabaseAdmin().from("jaktsasong").select("namn").eq("aktiv", true).maybeSingle();
  return (
    <div className="jk">
      <MedlemsNav sasong={sasongKort(sasong?.namn)} arMedlem={arMedlem(medlem)} />
      <div className="jk-main">{children}</div>
      <footer className="jk-fot">
        <b>Westsura Herrgård</b>
        <span className="jk-head__luft" />
        <span>Personlig hjälp · <a href={site.phoneHref}>{site.phone}</a></span>
      </footer>
    </div>
  );
}
