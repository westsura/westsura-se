"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/** Liten "Ta bort"-knapp med bekräftelse. Skickar till `efter` om sidan inte längre finns. */
export default function TaBortKnapp({ fraga, gor, efter, text = "Ta bort" }: {
  fraga: string; gor: () => Promise<{ ok: boolean; fel?: string }>; efter?: string; text?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className="admin__logout" type="button" disabled={pending} onClick={() => {
      if (!confirm(fraga)) return;
      start(async () => {
        const r = await gor();
        if (!r.ok) { alert(r.fel ?? "Kunde inte ta bort."); return; }
        if (efter) router.push(efter); else router.refresh();
      });
    }}>{pending ? "Tar bort…" : text}</button>
  );
}
