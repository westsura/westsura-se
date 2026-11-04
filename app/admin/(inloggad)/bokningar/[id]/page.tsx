import Link from "next/link";
import { notFound } from "next/navigation";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import { ARENDETYP, ARENDESTATUS, arendeNamn, foljUpp, type Arende, type Del } from "@/lib/arende";
import { Statusknappar, Uppgifter, Delar, TaBort } from "./Arendevy";

export const dynamic = "force-dynamic";

export default async function Bokning({ params }: { params: Promise<{ id: string }> }) {
  await kravAdmin("vardskap");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await supabaseServer();
  const { data: a } = await db.from("arende").select("*").eq("id", id).maybeSingle();
  if (!a) notFound();
  const arende = a as Arende;
  const [{ data: delar }, { data: enheter }, { data: lokaler }, { data: forfragan }] = await Promise.all([
    db.from("arende_del").select("*").eq("arende_id", id).order("fran").order("tid_fran"),
    db.from("enhet").select("id, namn, ingar_i").eq("aktiv", true).order("ordning"),
    db.from("lokal").select("id, namn").eq("aktiv", true).order("ordning"),
    arende.forfragan_id ? db.from("forfragan").select("nummer, typ, onskat_datum, antal_gaster, meddelande, skapad, hundar").eq("id", arende.forfragan_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const folj = foljUpp(arende);

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="label"><Link href="/admin/bokningar">← Bokningar</Link></p>
          <h1 className="admin__h1">{arendeNamn(arende)}</h1>
          <p className="admin__meta">
            #{arende.nummer} · <span className="kal-typ" data-typ={arende.typ}>{ARENDETYP[arende.typ]}</span>
            {arende.typ !== "intern" && <> · <span className={`pill pill--${arende.status}`}>{ARENDESTATUS[arende.status]}</span></>}
            {folj && <> · <span className={`folj folj--${folj.niva}`}>{folj.text}</span></>}
          </p>
        </div>
        <Statusknappar a={arende} />
      </header>

      <div className="arende">
        <Delar a={arende} delar={(delar ?? []) as Del[]} resurser={{ enheter: enheter ?? [], lokaler: lokaler ?? [] }} />
        <Uppgifter a={arende} />
        {forfragan && (
          <section className="admin__panel">
            <h2 className="admin__h2">Förfrågan från sajten</h2>
            <p className="admin__meta" style={{ marginTop: 0 }}>Nr {forfragan.nummer} · {new Date(forfragan.skapad).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })} · {forfragan.typ} · önskat datum: {forfragan.onskat_datum || "—"} · {forfragan.antal_gaster || "?"} gäster{forfragan.hundar ? " · med hund" : ""}</p>
            {forfragan.meddelande && <p style={{ whiteSpace: "pre-line", marginBottom: 0 }}>{forfragan.meddelande}</p>}
          </section>
        )}
        <p className="admin__meta">Skapad {new Date(arende.skapad).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" })} · senast ändrad {new Date(arende.uppdaterad).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" })} · <TaBort a={arende} /></p>
      </div>
    </>
  );
}
