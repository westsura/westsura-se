"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { taBortUnderlag } from "@/app/admin/actions";

/** Syns bara för ofakturerade underlag. Är fakturan skapad i Fortnox krediteras den i stället. */
export default function TaBortKnapp({ id, nummer, status }: { id: string; nummer: number; status: string }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (status !== "ej_fakturerad") return null;
  return (
    <>
      <button type="button" className="btn btn--sm btn--ghost" disabled={pending} title="Ta bort underlaget"
        onClick={() => {
          if (!confirm(`Ta bort underlag ${nummer}? Bokningen eller förfrågan finns kvar.`)) return;
          setFel(null);
          start(async () => {
            const r = await taBortUnderlag(id);
            if (r.ok) router.refresh(); else setFel(r.fel ?? "Kunde inte ta bort underlaget.");
          });
        }}>
        {pending ? "…" : "Ta bort"}
      </button>
      {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
    </>
  );
}
