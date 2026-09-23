"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loggaInAdmin, skickaInloggningslank } from "@/app/admin/actions";

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [lage, setLage] = useState<"login" | "glomt" | "skickat">("login");
  const [fel, setFel] = useState<string | null>(
    params.get("fel") === "ingen-behorighet" ? "Kontot har inte behörighet till admin."
    : params.get("fel") === "lank" ? "Länken gick inte att använda — be om en ny."
    : null,
  );
  const [pending, start] = useTransition();

  return (
    <div className="admin__login" style={{ minHeight: "60vh" }}>
      <Image src="/bilder/logo-lockup-gron.png" alt="Westsura Herrgård" width={640} height={390} style={{ height: 80, width: "auto", margin: "0 auto 28px" }} />
      <div className="card" style={{ borderTopColor: "var(--accent)" }}>
        <p className="label">Admin</p>
        <h3>{lage === "login" ? "Logga in" : "Glömt lösenord"}</h3>

        {lage === "skickat" && (
          <p style={{ fontSize: 16 }}>Ett mejl med en länk är skickat. Öppna den, så kommer du till sidan där du väljer ett nytt lösenord.</p>
        )}

        {lage === "login" && (
          <form className="form" style={{ gridTemplateColumns: "1fr" }} onSubmit={(e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
            start(async () => { const r = await loggaInAdmin(fd); if (r.ok) { router.push("/admin"); router.refresh(); } else setFel(r.fel || "Något gick fel"); });
          }}>
            <div className="field"><label htmlFor="l-epost">E-postadress</label><input id="l-epost" name="epost" type="email" required autoComplete="username" autoFocus /></div>
            <div className="field"><label htmlFor="l-losen">Lösenord</label><input id="l-losen" name="losenord" type="password" required autoComplete="current-password" /></div>
            {fel && <div className="notice" style={{ borderLeftColor: "#a33" }}>{fel}</div>}
            <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Loggar in…" : "Logga in"}</button>
            <button type="button" className="admin__logout" style={{ padding: 0 }} onClick={() => { setFel(null); setLage("glomt"); }}>Glömt lösenordet?</button>
          </form>
        )}

        {lage === "glomt" && (
          <form className="form" style={{ gridTemplateColumns: "1fr" }} onSubmit={(e) => {
            e.preventDefault(); const fd = new FormData(e.currentTarget); setFel(null);
            start(async () => { const r = await skickaInloggningslank(fd); if (r.ok) setLage("skickat"); else setFel(r.fel || "Något gick fel"); });
          }}>
            <div className="field"><label htmlFor="g-epost">E-postadress</label><input id="g-epost" name="epost" type="email" required autoComplete="username" autoFocus /></div>
            {fel && <div className="notice" style={{ borderLeftColor: "#a33" }}>{fel}</div>}
            <button className="btn btn--block" type="submit" disabled={pending}>{pending ? "Skickar…" : "Skicka länk för nytt lösenord"}</button>
            <button type="button" className="admin__logout" style={{ padding: 0 }} onClick={() => { setFel(null); setLage("login"); }}>Tillbaka till inloggningen</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return <Suspense><LoginForm /></Suspense>;
}
