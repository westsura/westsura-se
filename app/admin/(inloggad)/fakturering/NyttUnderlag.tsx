"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { skapaTomtUnderlag } from "@/app/admin/actions";

export default function NyttUnderlag() {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <button className="btn btn--sm" disabled={pending} style={{ marginTop: 6 }} onClick={() => start(async () => { setFel(null); const r = await skapaTomtUnderlag(); if (r.ok) router.push(`/admin/fakturering/${r.id}`); else setFel(r.fel); })}>
        {pending ? "Skapar…" : "Nytt underlag"}
      </button>
      {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
    </>
  );
}
