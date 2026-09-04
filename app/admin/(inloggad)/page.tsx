import Link from "next/link";
import { kravAdmin, datum, kr } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Oversikt() {
  const admin = await kravAdmin();
  const db = await supabaseServer();
  const idag = new Date().toISOString().slice(0, 10);
  const omEnVecka = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [{ data: ankomster }, { data: avresor }, { data: nyaBokningar }, { data: nyaForfragningar }, { count: vanner }, { count: attFakturera }] = await Promise.all([
    db.from("bokningar_admin").select("*").neq("status", "avbokad").gte("ankomst", idag).lte("ankomst", omEnVecka).order("ankomst"),
    db.from("bokningar_admin").select("*").neq("status", "avbokad").eq("avresa", idag),
    db.from("bokningar_admin").select("*").eq("status", "preliminar").order("skapad", { ascending: false }),
    db.from("forfragan").select("*").in("status", ["ny", "pagar"]).order("skapad", { ascending: false }),
    db.from("van").select("*", { count: "exact", head: true }).is("avanmald_tid", null),
    db.from("fakturaunderlag").select("*", { count: "exact", head: true }).eq("status", "ej_fakturerad"),
  ]);

  return (
    <>
      <header className="admin__head">
        <div><p className="label">Översikt</p><h1 className="admin__h1">God {new Date().getHours() < 12 ? "morgon" : "dag"}, {admin.namn?.split(" ")[0] ?? "du"}</h1></div>
        <p className="admin__meta">{new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}</p>
      </header>

      <div className="admin__stats">
        <Link href="/admin/bokningar?status=preliminar" className="stat"><b>{nyaBokningar?.length ?? 0}</b><span>Bokningar att bekräfta</span></Link>
        <Link href="/admin/forfragningar" className="stat"><b>{nyaForfragningar?.length ?? 0}</b><span>Obesvarade förfrågningar</span></Link>
        <Link href="/admin/kalender" className="stat"><b>{ankomster?.length ?? 0}</b><span>Ankomster inom en vecka</span></Link>
        <Link href="/admin/fakturering" className="stat"><b>{attFakturera ?? 0}</b><span>Att fakturera</span></Link>
        <Link href="/admin/vanner" className="stat"><b>{vanner ?? 0}</b><span>Westsuras Vänner</span></Link>
      </div>

      <div className="admin__cols">
        <section className="admin__panel">
          <h2 className="admin__h2">Att bekräfta</h2>
          {!nyaBokningar?.length && <p className="empty">Inga preliminära bokningar.</p>}
          {nyaBokningar?.map((b) => (
            <Link key={b.id} href={`/admin/bokningar#${b.nummer}`} className="row">
              <span className="row__main"><b>{b.gast_namn}</b> · {b.enheter}</span>
              <span className="row__meta">{datum(b.ankomst)}–{datum(b.avresa)} · {kr(b.summa)}</span>
            </Link>
          ))}
        </section>
        <section className="admin__panel">
          <h2 className="admin__h2">Förfrågningar</h2>
          {!nyaForfragningar?.length && <p className="empty">Inkorgen är tom.</p>}
          {nyaForfragningar?.map((f) => (
            <Link key={f.id} href={`/admin/forfragningar#${f.nummer}`} className="row">
              <span className="row__main"><b>{f.namn}</b> · {f.typ}</span>
              <span className="row__meta">{f.onskat_datum || "datum ej satt"} · {f.antal_gaster || "?"} gäster · <em>{f.status}</em></span>
            </Link>
          ))}
        </section>
      </div>

      <section className="admin__panel" style={{ marginTop: 24 }}>
        <h2 className="admin__h2">Kommande ankomster</h2>
        {!ankomster?.length && <p className="empty">Inga ankomster den närmaste veckan.</p>}
        {ankomster?.map((b) => (
          <div key={b.id} className="row">
            <span className="row__main"><b>{datum(b.ankomst)}</b> · {b.gast_namn} · {b.enheter}{b.antal_hundar ? " · 🐕" : ""}{b.frukost ? " · frukost" : ""}</span>
            <span className="row__meta">{b.status === "bekraftad" ? "Bekräftad" : "Preliminär"} · {b.gast_telefon}</span>
          </div>
        ))}
        {!!avresor?.length && <p className="admin__meta" style={{ marginTop: 12 }}>Avresor i dag: {avresor.map((a) => a.gast_namn).join(", ")}</p>}
      </section>
    </>
  );
}
