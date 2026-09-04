"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { skapaUnderlagFranBokning, skapaUnderlagFranForfragan } from "@/app/admin/actions";
import { FAKTURASTATUS } from "@/lib/faktura";

/** Länk till befintligt fakturaunderlag, eller knapp som skapar ett. */
export default function FakturaKnapp({ bokningId, forfraganId, underlagId, status }: { bokningId?: string; forfraganId?: string; underlagId?: string | null; status?: string | null }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  if (underlagId) {
    return <Link className={`pill pill--${status ?? "ej_fakturerad"}`} href={`/admin/fakturering/${underlagId}`} style={{ textDecoration: "none" }}>{FAKTURASTATUS[status ?? "ej_fakturerad"]} →</Link>;
  }
  return (
    <button className="btn btn--sm btn--ghost" disabled={pending} onClick={() => start(async () => {
      const r = bokningId ? await skapaUnderlagFranBokning(bokningId) : forfraganId ? await skapaUnderlagFranForfragan(forfraganId) : { ok: false as const, fel: "Inget att utgå från." };
      if (r.ok) router.push(`/admin/fakturering/${r.id}`); else alert(r.fel);
    })}>{pending ? "Skapar…" : "Fakturaunderlag"}</button>
  );
}
