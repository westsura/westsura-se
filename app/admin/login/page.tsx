"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { skickaInloggningslank } from "@/app/admin/actions";

function LoginForm() {
  const params = useSearchParams();
  const [skickat, setSkickat] = useState(false);
  const [fel, setFel] = useState<string | null>(params.get("fel") === "ingen-behorighet" ? "Kontot har inte behörighet till admin." : null);
  const [pending, start] = useTransition();
  return (
    <div className="admin__login" style={{ minHeight: "60vh" }}>
      <Image src="/bilder/logo-lockup-gron.png" alt="Westsura Herrgård" width={640} height={390} style={{ height: 80, width: "auto", margin: "0 auto 28px" }} />
      <div className="card" style={{ borderTopColor: "var(--accent)" }}>
        <p className="label">Admin</p>
        <h3>Logga in</h3>
        {skickat ? (
          <p style={{ fontSize: 16 }}>En inloggningslänk är skickad till din e-post. Öppna den i samma webbläsare — länken gäller i en timme.</p>
        ) : (
          <form className="form" style={{ gridTemplateColumns: "1fr" }} onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null); start(async () => { const r = await skickaInloggningslank(fd); if (r.ok) setSkickat(true); else setFel(r.fel || "Något gick fel"); }); }}>
            <div className="field"><label htmlFor="l-epost">E-postadress</label><input id="l-epost" name="epost" type="email" required autoComplete="email" autoFocus /></div>
            {fel && <div className="notice" style={{ borderLeftColor: "#a33" }}>{fel}</div>}
            <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka inloggningslänk"}</button>
            <p style={{ fontSize: 13, color: "var(--ws-ink-40)", margin: 0 }}>Inget lösenord — du får en länk per mejl varje gång.</p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return <Suspense><LoginForm /></Suspense>;
}
