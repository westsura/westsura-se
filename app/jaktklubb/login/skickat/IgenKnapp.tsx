"use client";

import { useState, useTransition } from "react";
import { skickaMedlemslank } from "@/app/jaktklubb/actions";

/** Skickar samma engångslänk en gång till, utan att lämna sidan. */
export default function IgenKnapp({ epost }: { epost: string }) {
  const [svar, setSvar] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button className="btn btn--ghost btn--block" type="button" disabled={pending || !epost}
        onClick={() => start(async () => {
          setSvar(null);
          const fd = new FormData();
          fd.set("epost", epost);
          const r = await skickaMedlemslank(fd);
          setSvar(r.ok ? { ok: true, text: "En ny länk är på väg." } : { ok: false, text: r.fel ?? "Kunde inte skicka länken." });
        })}>
        {pending ? "Skickar…" : "Skicka länken igen"}
      </button>
      {svar && <div className={`notice${svar.ok ? "" : " notice--fel"}`} role="alert">{svar.text}</div>}
    </>
  );
}
