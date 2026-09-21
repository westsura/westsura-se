"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { skickaMedlemslank } from "@/app/jaktklubb/actions";

export default function LoginForm({ fel: felFranLanken }: { fel?: string }) {
  const [fel, setFel] = useState<string | null>(felFranLanken ?? null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <form className="form form--1" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      setFel(null);
      start(async () => {
        const r = await skickaMedlemslank(fd);
        if (r.ok) router.push(`/jaktklubb/login/skickat?e=${encodeURIComponent(String(fd.get("epost") ?? ""))}`);
        else setFel(r.fel ?? "Kunde inte skicka länken.");
      });
    }}>
      <div className="field">
        <label htmlFor="jk-epost">E-postadress</label>
        <input type="email" id="jk-epost" name="epost" required autoComplete="email" placeholder="Din e-postadress" />
      </div>
      {fel && <div className="notice notice--fel" role="alert">{fel}</div>}
      <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka inloggningslänk"}</button>
    </form>
  );
}
