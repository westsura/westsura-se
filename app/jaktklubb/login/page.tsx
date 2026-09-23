import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import Panel from "./Panel";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Logga in — Westsura Herrgårds jaktklubb",
  description: "Inloggning för medlemmar i Westsura Herrgårds jaktklubb.",
  robots: { index: false, follow: false },
};

const FEL: Record<string, string> = {
  "ingen-behorighet": "Den inloggade adressen har inget jägarkonto hos oss ännu. Ett konto skapas när du anmäler dig till en jaktdag, eller när ditt medlemskap godkänns. Ring oss så reder vi ut det.",
  lank: "Länken gick inte att använda. Den kan ha hunnit gå ut — be om en ny nedan.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ fel?: string }> }) {
  const { fel } = await searchParams;
  return (
    <div className="jk-login">
      <Panel />
      <div className="jk-login__form">
        <Link className="jk-tillbaka" href="/">←&nbsp; Till herrgårdens hemsida</Link>
        <div className="jk-login__inner">
          <p className="label">Medlemmar och gästjägare</p>
          <h1 className="jk-login__h1">Välkommen tillbaka.</h1>
          <p className="jk-login__lede">Här börjar din nästa dag på Westsura.<br />Logga in för att boka jakt, ladda upp dokument och göra säkerhetskursen.</p>
          <LoginForm fel={fel ? FEL[fel] ?? undefined : undefined} />
          <p className="jk-hjalp">Ditt lösenord fick du i välkomstmejlet.<br />Byt det när du vill under Mitt medlemskap.</p>
          <div className="jk-avdelare" />
          <p className="jk-hjalp">Ännu inte medlem?</p>
          <Link className="jk-lank" href="/jaktklubb">Läs om medlemskapet och ansök&nbsp; →</Link>
        </div>
        <div className="jk-login__luft" />
        <p className="jk-hjalp">Behöver du hjälp?&nbsp; <a href={site.phoneHref}>{site.phone}</a></p>
      </div>
    </div>
  );
}
