import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { kravRiktigMedlem } from "@/lib/jakt";
import { hamtaJaktdag } from "@/lib/jaktdag";
import Jaktledarvy from "@/components/jaktledare/Jaktledarvy";

export const metadata: Metadata = { title: "Jaktledare" };
export const dynamic = "force-dynamic";

/** Jaktledarvyn i medlemsklubben — bara för den medlem som är utpekad jaktledare för dagen. */
export default async function JaktledareSida({ params }: { params: Promise<{ id: string }> }) {
  const medlem = await kravRiktigMedlem();
  const { id } = await params;
  const dag = await hamtaJaktdag(id);
  if (!dag) notFound();
  if (dag.tillfalle.jaktledare_id !== medlem.id) redirect("/jaktklubb/medlem");
  return (
    <div className="jk-jaktledare">
      <Jaktledarvy dag={dag} admin={false} tillbaka={{ href: "/jaktklubb/medlem", label: "Översikt" }} />
    </div>
  );
}
