import { notFound } from "next/navigation";
import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { hamtaJaktdag } from "@/lib/jaktdag";
import Jaktledarvy from "@/components/jaktledare/Jaktledarvy";

export const dynamic = "force-dynamic";

/** Jaktledarvyn i admin: deltagare, såtar, pass och avskjutning för en jaktdag. */
export default async function JaktdagAdmin({ params }: { params: Promise<{ id: string }> }) {
  await kravAdmin("jaktadmin", "jaktledare");
  const { id } = await params;
  const dag = await hamtaJaktdag(id);
  if (!dag) notFound();
  const { data: medlemmar } = await supabaseAdmin().from("jaktmedlem").select("id, namn").eq("status", "godkand").order("namn");
  return <Jaktledarvy dag={dag} admin medlemmar={(medlemmar ?? []) as { id: string; namn: string }[]} tillbaka={{ href: "/admin/tillfallen", label: "Tillfällen" }} />;
}
