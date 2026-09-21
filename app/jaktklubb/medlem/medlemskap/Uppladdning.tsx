"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { laddaUppDokument } from "@/app/jaktklubb/actions";
import { MAX_MB, TILLATNA } from "../delar";

export default function Uppladdning({ typ, namn }: { typ: string; namn: string }) {
  const [fel, setFel] = useState<string | null>(null);
  const [klar, setKlar] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();

  return (
    <div className="jk-upp">
      <label className="jk-upp__knapp">
        <input ref={ref} type="file" accept={TILLATNA.join(",")} disabled={pending}
          onChange={(e) => {
            const fil = e.target.files?.[0];
            if (!fil) return;
            setFel(null); setKlar(false);
            const fd = new FormData();
            fd.set("typ", typ);
            fd.set("fil", fil);
            start(async () => {
              const r = await laddaUppDokument(fd);
              if (ref.current) ref.current.value = "";
              if (r.ok) { setKlar(true); router.refresh(); } else setFel(r.fel ?? "Uppladdningen gick inte igenom.");
            });
          }} />
        <span className="btn btn--sm btn--ghost">{pending ? "Laddar upp…" : `Ladda upp ${namn.toLowerCase()}`}</span>
      </label>
      <p className="jk-hjalp">PDF, JPG eller PNG. Högst {MAX_MB} MB.</p>
      {klar && <p className="notice">Tack — dokumentet är inskickat och väntar på granskning.</p>}
      {fel && <p className="notice notice--fel" role="alert">{fel}</p>}
    </div>
  );
}
