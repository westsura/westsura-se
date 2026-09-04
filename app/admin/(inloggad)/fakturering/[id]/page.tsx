import Link from "next/link";
import { notFound } from "next/navigation";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import Underlag from "./Underlag";

export const dynamic = "force-dynamic";

export default async function UnderlagSida({ params }: { params: Promise<{ id: string }> }) {
  await kravAdmin("vardskap");
  const { id } = await params;
  const db = await supabaseServer();
  const { data: u } = await db.from("fakturaunderlag_admin").select("*").eq("id", id).maybeSingle();
  if (!u) notFound();
  const { data: rader } = await db.from("fakturarad").select("id, beskrivning, antal, enhet, a_pris, moms").eq("underlag_id", id).order("ordning");

  return (
    <>
      <header className="admin__head print-hide">
        <div><p className="label"><Link href="/admin/fakturering" style={{ textDecoration: "none" }}>Fakturering</Link> · Underlag {u.nummer}</p><h1 className="admin__h1">{u.rubrik}</h1></div>
        <p className="admin__meta">
          {u.bokning_nummer && <Link href={`/admin/bokningar#${u.bokning_nummer}`}>Bokning {u.bokning_nummer}</Link>}
          {u.forfragan_nummer && <Link href={`/admin/forfragningar#${u.forfragan_nummer}`}>Förfrågan {u.forfragan_nummer}</Link>}
          {!u.bokning_nummer && !u.forfragan_nummer && "Manuellt underlag"}
        </p>
      </header>
      <Underlag u={u} rader={(rader ?? []).map((r) => ({ ...r, antal: Number(r.antal), a_pris: Number(r.a_pris) }))} />
    </>
  );
}
