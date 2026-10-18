"use client";

import { useState, useTransition } from "react";
import { svaraHundforare } from "@/app/jaktledare/actions";
import type { HundforareDeltagare } from "@/lib/jaktdag";
import { DRIVERNAMN, EKIPAGETYP } from "@/lib/ekipage";

const STATUS: Record<string, string> = { intresse: "Intresse — att svara på", godkand: "Med på jakten", avbojd: "Inte denna gång" };

/** Hundförare som anmält intresse för jaktdagen: godkänn eller avböj. Den som godkänns får ett mejl. */
export default function Hundforare({ tillfalleId, lista }: { tillfalleId: string; lista: HundforareDeltagare[] }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const med = lista.filter((h) => h.status === "godkand");
  const svara = (id: string, beslut: "godkand" | "avbojd") => start(async () => {
    setFel(null);
    const r = await svaraHundforare(tillfalleId, id, beslut);
    if (!r.ok) setFel(r.fel ?? "Kunde inte spara.");
  });

  return (
    <>
      <h2 className="admin__h2" style={{ marginTop: 32 }}>Hundförare {med.length ? `· ${med.length} med` : ""}</h2>
      <div className="admin__panel">
        {!lista.length && <p className="empty">Inga hundförare har anmält intresse ännu. Bjud in under Jaktklubb › Hundekipage.</p>}
        {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
        {!!lista.length && (
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Hundförare</th><th>Hundar</th><th>Status</th><th className="print-hide"></th></tr></thead>
              <tbody>
                {lista.map((h) => (
                  <tr key={h.id} className={h.status === "avbojd" ? "print-hide" : undefined}>
                    <td>
                      <b>{h.namn}</b>{h.ekipage && <div className="admin__meta">{EKIPAGETYP[h.ekipage]}</div>}
                      <div className="admin__meta">{h.telefon && <a href={`tel:${h.telefon}`}>{h.telefon}</a>}{h.telefon ? " · " : ""}{h.epost}</div>
                      {h.meddelande && <div className="admin__meta"><em>{h.meddelande}</em></div>}
                    </td>
                    <td>
                      {!h.hundar.length && <span className="admin__meta">—</span>}
                      {h.hundar.map((d) => (
                        <div key={d.id}><b>{d.namn}</b>{d.ras ? `, ${d.ras}` : ""}<div className="admin__meta">{[...d.driver.map((x) => DRIVERNAMN[x] ?? x), d.eftersok ? "Eftersök" : ""].filter(Boolean).join(" · ")}</div></div>
                      ))}
                    </td>
                    <td><span className={`pill pill--${h.status === "godkand" ? "godkand" : h.status === "avbojd" ? "avbojd" : "inskickad"}`}>{STATUS[h.status] ?? h.status}</span></td>
                    <td className="admin__actions print-hide">
                      {h.status !== "godkand" && <button className="btn btn--sm" type="button" disabled={pending} onClick={() => svara(h.id, "godkand")}>Godkänn</button>}
                      {h.status !== "avbojd" && <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={() => svara(h.id, "avbojd")}>{h.status === "godkand" ? "Ta bort från jakten" : "Avböj"}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
