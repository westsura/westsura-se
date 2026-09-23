"use client";

import { useState, useTransition } from "react";

/** Byt lösenord — samma formulär i admin och medlemsklubben, olika server action. */
export default function LosenordForm({ action, klarText = "Lösenordet är bytt." }: { action: (fd: FormData) => Promise<{ ok: boolean; fel?: string }>; klarText?: string }) {
  const [medd, setMedd] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="form form--1" onSubmit={(e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget); const f = e.currentTarget; setMedd(null);
      start(async () => { const r = await action(fd); if (r.ok) { setMedd({ ok: true, text: klarText }); f.reset(); } else setMedd({ ok: false, text: r.fel ?? "Något gick fel." }); });
    }}>
      <div className="field"><label htmlFor="ny-losen">Nytt lösenord</label><input id="ny-losen" name="losenord" type="password" required minLength={8} autoComplete="new-password" /><p className="hint">Minst åtta tecken.</p></div>
      <div className="field"><label htmlFor="ny-losen2">Upprepa lösenordet</label><input id="ny-losen2" name="losenord2" type="password" required minLength={8} autoComplete="new-password" /></div>
      {medd && <div className={`notice${medd.ok ? "" : " notice--fel"}`} role={medd.ok ? "status" : "alert"}>{medd.text}</div>}
      <button className="btn" type="submit" disabled={pending}>{pending ? "Sparar…" : "Byt lösenord"}</button>
    </form>
  );
}
