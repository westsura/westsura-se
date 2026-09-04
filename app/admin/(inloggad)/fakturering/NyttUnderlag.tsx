"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { skapaTomtUnderlag } from "@/app/admin/actions";

export default function NyttUnderlag() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className="btn btn--sm" disabled={pending} style={{ marginTop: 6 }} onClick={() => start(async () => { const r = await skapaTomtUnderlag(); if (r.ok) router.push(`/admin/fakturering/${r.id}`); else alert(r.fel); })}>
      {pending ? "Skapar…" : "Nytt underlag"}
    </button>
  );
}
