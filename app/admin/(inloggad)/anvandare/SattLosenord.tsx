"use client";

import { useState, useTransition } from "react";
import { sattAdminLosenord } from "@/app/admin/actions";

export default function SattLosenord({ epost }: { epost: string }) {
  const [oppen, setOppen] = useState(false);
  const [medd, setMedd] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!oppen) return <button className="btn btn--sm btn--ghost" type="button" onClick={() => setOppen(true)}>Sätt lösenord</button>;
  return (
    <form className="admin__actions" onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); fd.set("epost", epost);
      start(async () => { const r = await sattAdminLosenord(fd); setMedd(r.ok ? "Sparat." : r.fel ?? "Fel"); if (r.ok) setOppen(false); });
    }}>
      <input name="losenord" type="password" minLength={8} required placeholder="Minst 8 tecken" autoComplete="new-password" />
      <button className="btn btn--sm" type="submit" disabled={pending}>{pending ? "…" : "Spara"}</button>
      <button className="btn btn--sm btn--ghost" type="button" onClick={() => setOppen(false)}>Avbryt</button>
      {medd && <span className="admin__meta">{medd}</span>}
    </form>
  );
}
