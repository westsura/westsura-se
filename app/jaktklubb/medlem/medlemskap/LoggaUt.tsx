"use client";

import { useState, useTransition } from "react";
import { loggaUtMedlem } from "@/app/jaktklubb/actions";

export default function LoggaUt() {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button className="btn btn--ghost" type="button" disabled={pending}
        onClick={() => start(async () => {
          const r = await loggaUtMedlem();
          if (r.ok) location.href = "/jaktklubb/login"; else setFel(r.fel ?? "Kunde inte logga ut.");
        })}>
        {pending ? "Loggar ut…" : "Logga ut"}
      </button>
      {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
    </>
  );
}
