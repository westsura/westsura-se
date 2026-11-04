"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sattFakturastatus, skapaUnderlagFranArende } from "@/app/admin/arenden";

/** Fakturerad/betald på bokningen och koppling till fakturaunderlaget. */
export function Fakturering({ arendeId, status, underlagId, ekonomi }: { arendeId: string; status: string; underlagId: string | null; ekonomi: boolean }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <section className="admin__panel">
      <div className="ff__head">
        <h2 className="admin__h2" style={{ margin: 0 }}>Fakturering</h2>
        <select value={status} disabled={pending} aria-label="Fakturastatus" onChange={(e) => {
          const v = e.target.value;
          if (underlagId && !confirm("Bokningen har ett fakturaunderlag — statusen följer annars underlaget automatiskt. Ändra ändå här?")) return;
          start(async () => { const r = await sattFakturastatus(arendeId, v); if (!r.ok) setFel(r.fel ?? "Kunde inte ändra."); });
        }}>
          <option value="ej">Ej fakturerad</option><option value="fakturerad">Fakturerad</option><option value="betald">Betald</option>
        </select>
      </div>
      <p className="admin__meta" style={{ marginTop: 8 }}>
        {underlagId
          ? <>Fakturaunderlag finns{ekonomi ? <> — <Link href={`/admin/fakturering/${underlagId}`}>öppna underlaget</Link></> : " (hanteras under Fakturering)"}. Statusen uppdateras när underlaget markeras som fakturerat eller betalt.</>
          : <>Inget fakturaunderlag ännu. <button className="linkbtn" disabled={pending} onClick={() => {
              if (!confirm("Skapa ett fakturaunderlag med kunduppgifterna och en rad per tjänst? Priserna fylls i under Fakturering.")) return;
              start(async () => { const r = await skapaUnderlagFranArende(arendeId); if (r.ok && r.id) { if (ekonomi) router.push(`/admin/fakturering/${r.id}`); } else setFel(r.fel ?? "Kunde inte skapa."); });
            }}>Skapa fakturaunderlag</button></>}
      </p>
      {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
    </section>
  );
}

/** Historik över ändringar, senaste först. */
export function Historik({ rader }: { rader: { id: string; vem: string | null; text: string; tid: string }[] }) {
  const [alla, setAlla] = useState(false);
  const visa = alla ? rader : rader.slice(0, 6);
  return (
    <section className="admin__panel">
      <h2 className="admin__h2">Historik</h2>
      {!rader.length && <p className="empty">Inga ändringar loggade ännu.</p>}
      <ul className="historik">
        {visa.map((r) => (
          <li key={r.id}><time>{new Date(r.tid).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time><span>{r.text}{r.vem && <small> · {r.vem}</small>}</span></li>
        ))}
      </ul>
      {rader.length > 6 && <button className="linkbtn" onClick={() => setAlla(!alla)}>{alla ? "Visa färre" : `Visa alla ${rader.length}`}</button>}
    </section>
  );
}
