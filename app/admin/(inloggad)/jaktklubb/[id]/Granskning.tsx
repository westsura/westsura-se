"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { granskaDokument, signeradDokumentlank } from "@/app/admin/actions";
import { DOKUMENTSTATUS, type Dokument } from "../delar";

/** Granskning av ett dokument: öppna kopian, godkänn eller underkänn. */
export default function Granskning({ namn, typ, d, forslagGiltigTill }: { namn: string; typ: string; d?: Dokument; forslagGiltigTill: string }) {
  const [giltig, setGiltig] = useState(d?.giltig_till ?? forslagGiltigTill);
  const [kommentar, setKommentar] = useState(d?.kommentar ?? "");
  const [visaKommentar, setVisaKommentar] = useState(false);
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  // Jaktkort och älgskyttemärke gäller ett jaktår; ett utgånget godkännande visas som saknat.
  const arsvis = typ === "jaktkort" || typ === "algskyttemarke";
  const utgangen = d?.status === "godkand" && !!d.giltig_till && d.giltig_till < new Date().toISOString().slice(0, 10);
  const status = utgangen ? "saknas" : d?.status ?? "saknas";

  const oppna = () => start(async () => {
    setFel(null);
    const r = await signeradDokumentlank(d!.id);
    if (r.ok) window.open(r.url, "_blank", "noopener"); else setFel(r.fel);
  });

  const granska = (godkand: boolean) => start(async () => {
    setFel(null);
    const r = await granskaDokument(d!.id, godkand, godkand && arsvis ? giltig : null, godkand ? null : kommentar);
    if (r.ok) { setVisaKommentar(false); router.refresh(); } else setFel(r.fel ?? "Något gick fel.");
  });

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <span className="row__main">
        <b>{namn}</b>
        {d?.kommentar && <div className="admin__meta">Kommentar: {d.kommentar}</div>}
        {d?.granskad && <div className="admin__meta">Granskad {new Date(d.granskad).toLocaleDateString("sv-SE")}</div>}
        {fel && <div className="notice notice--fel" role="alert" style={{ marginTop: 8 }}>{fel}</div>}
        {visaKommentar && (
          <div className="ff__foot">
            <input value={kommentar} onChange={(e) => setKommentar(e.target.value)} disabled={pending}
              placeholder="Vad behöver kompletteras? Medlemmen får kommentaren i mejl." style={{ flex: 1 }} />
            <button className="btn btn--sm" type="button" disabled={pending} onClick={() => granska(false)}>Skicka underkännande</button>
            <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={() => setVisaKommentar(false)}>Avbryt</button>
          </div>
        )}
      </span>
      <span className="row__meta">
        {d?.giltig_till ? `${utgangen ? "gällde" : ""} t.o.m. ${d.giltig_till} · ` : ""}
        <span className={`pill pill--${status}`}>{utgangen ? "Utgånget" : DOKUMENTSTATUS[status]}</span>
        {d && (
          <span className="admin__actions" style={{ marginTop: 8, justifyContent: "flex-end" }}>
            <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={oppna}>Öppna</button>
            {arsvis && status !== "godkand" && (
              <input type="date" value={giltig} onChange={(e) => setGiltig(e.target.value)} disabled={pending} title="Giltigt till och med" />
            )}
            {status !== "godkand" && <button className="btn btn--sm" type="button" disabled={pending} onClick={() => granska(true)}>Godkänn</button>}
            {status !== "underkand" && <button className="btn btn--sm btn--ghost" type="button" disabled={pending} onClick={() => setVisaKommentar(true)}>Underkänn</button>}
          </span>
        )}
      </span>
    </div>
  );
}
