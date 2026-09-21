"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { avbokaAnmalan } from "@/app/jaktklubb/actions";

export default function Avboka({ id, titel }: { id: string; titel: string }) {
  const [fel, setFel] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <button className="btn btn--sm btn--ghost" type="button" disabled={pending}
        onClick={() => {
          if (!confirm(`Avboka din plats på ${titel}?`)) return;
          setFel(null);
          start(async () => {
            const r = await avbokaAnmalan(id);
            if (r.ok) router.refresh(); else setFel(r.fel ?? "Avbokningen gick inte igenom.");
          });
        }}>
        {pending ? "Avbokar…" : "Avboka"}
      </button>
      {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
    </>
  );
}
