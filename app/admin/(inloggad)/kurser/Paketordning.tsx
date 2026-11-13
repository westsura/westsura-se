"use client";

import { useState, useTransition } from "react";
import { sparaPaketordning } from "@/app/admin/actions";

type Post = { id: string; namn: string; info?: string };

/** Ordningen på paketsidan: flytta upp, ner, först eller sist — och spara. */
export default function Paketordning({ poster }: { poster: Post[] }) {
  const [lista, setLista] = useState(poster);
  const [oppen, setOppen] = useState(false);
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const andrad = lista.map((p) => p.id).join() !== poster.map((p) => p.id).join();
  const flytta = (i: number, till: number) => setLista((l) => { const n = [...l]; const [x] = n.splice(i, 1); n.splice(Math.max(0, Math.min(n.length, till)), 0, x); return n; });

  return (
    <section className="admin__panel" style={{ marginBottom: 24 }}>
      <div className="ff__head">
        <h2 className="admin__h2" style={{ margin: 0 }}>Ordning på paketsidan</h2>
        <button className="btn btn--sm btn--ghost" onClick={() => setOppen(!oppen)}>{oppen ? "Stäng" : "Ändra ordning"}</button>
      </div>
      {oppen && (
        <>
          <ol className="paketordning">
            {lista.map((p, i) => (
              <li key={p.id}>
                <span><b>{p.namn}</b>{p.info && <small className="muted"> · {p.info}</small>}</span>
                <span className="admin__actions">
                  <button type="button" className="btn btn--sm btn--ghost" disabled={i === 0} onClick={() => flytta(i, 0)} title="Först">Först</button>
                  <button type="button" className="btn btn--sm btn--ghost" disabled={i === 0} onClick={() => flytta(i, i - 1)} aria-label="Flytta upp">↑</button>
                  <button type="button" className="btn btn--sm btn--ghost" disabled={i === lista.length - 1} onClick={() => flytta(i, i + 1)} aria-label="Flytta ner">↓</button>
                  <button type="button" className="btn btn--sm btn--ghost" disabled={i === lista.length - 1} onClick={() => flytta(i, lista.length - 1)} title="Sist">Sist</button>
                </span>
              </li>
            ))}
          </ol>
          <div className="cta-row" style={{ marginTop: 12 }}>
            <button className="btn btn--sm" disabled={pending || !andrad} onClick={() => start(async () => {
              setMedd(null);
              const r = await sparaPaketordning(lista.map((p) => p.id));
              setMedd(r.ok ? "Sparat — paketsidan visar den nya ordningen." : r.fel ?? "Kunde inte spara.");
            })}>{pending ? "Sparar…" : "Spara ordningen"}</button>
            {andrad && <button className="linkbtn" onClick={() => setLista(poster)}>Ångra</button>}
            {medd && <span className="admin__meta" role="status">{medd}</span>}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>Opublicerade aktiviteter syns inte på paketsidan förrän de publiceras, men får sin plats här direkt.</p>
        </>
      )}
    </section>
  );
}
