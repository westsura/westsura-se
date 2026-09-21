import type { Metadata } from "next";
import Link from "next/link";
import { Vapen } from "@/components/Blocks";
import { site } from "@/lib/site";
import Panel from "../Panel";
import IgenKnapp from "./IgenKnapp";

export const metadata: Metadata = {
  title: "Inloggningslänken är skickad — Westsura Herrgårds jaktklubb",
  robots: { index: false, follow: false },
};

export default async function Skickat({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e = "" } = await searchParams;
  return (
    <div className="jk-login">
      <Panel kompakt />
      <div className="jk-login__form">
        <Link className="jk-tillbaka" href="/jaktklubb/login">←&nbsp; Tillbaka till inloggning</Link>
        <div className="jk-login__inner">
          {/* Skölden visas bara på mobil — där ersätter den det stora vapnet i panelen. */}
          <Vapen variant="skold" size={64} className="jk-skickat__skold" />
          <p className="label">Snart är du inne</p>
          <h1 className="jk-login__h1">Titta i din inkorg.</h1>
          <p className="jk-login__lede">Om adressen är kopplad till ett medlemskap får du ett mejl med en säker inloggningslänk.</p>
          <p className="jk-login__lede">Öppna mejlet på den här enheten och följ länken för att komma in i medlemsklubben.</p>
          <div className="jk-avdelare" />
          <p className="jk-hjalp">Inget mejl? Kontrollera skräpposten eller försök igen om en stund.</p>
          <IgenKnapp epost={e} />
          <Link className="jk-lank" href="/jaktklubb/login">←&nbsp; Byt e-postadress</Link>
        </div>
        <div className="jk-login__luft" />
        <p className="jk-hjalp">Personlig hjälp · <a href={site.phoneHref}>{site.phone}</a></p>
      </div>
    </div>
  );
}
