import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import NyBokning from "../NyBokning";

export const dynamic = "force-dynamic";

export default async function Ny({ searchParams }: { searchParams: Promise<{ intern?: string; datum?: string }> }) {
  await kravAdmin("vardskap");
  const { intern, datum } = await searchParams;
  const db = await supabaseServer();
  const [{ data: enheter }, { data: lokaler }] = await Promise.all([
    db.from("enhet").select("id, namn, ingar_i").eq("aktiv", true).order("ordning"),
    db.from("lokal").select("id, namn").eq("aktiv", true).order("ordning"),
  ]);
  return (
    <>
      <header className="admin__head">
        <div><p className="label"><Link href="/admin/bokningar">← Bokningar</Link></p><h1 className="admin__h1">{intern ? "ny intern aktivitet" : "ny bokning"}</h1></div>
      </header>
      <NyBokning intern={!!intern} datum={datum && /^\d{4}-\d{2}-\d{2}$/.test(datum) ? datum : undefined} resurser={{ enheter: enheter ?? [], lokaler: lokaler ?? [] }} />
    </>
  );
}
