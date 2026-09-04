"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { taBortUnderlag } from "@/app/admin/actions";

export default function TaBortKnapp({ id, nummer }: { id: string; nummer: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="btn btn--sm btn--ghost" disabled={pending} title="Ta bort underlaget"
      onClick={() => { if (confirm(`Ta bort underlag ${nummer}? Bokningen eller förfrågan finns kvar.`)) start(async () => { await taBortUnderlag(id); router.refresh(); }); }}>
      {pending ? "…" : "Ta bort"}
    </button>
  );
}
