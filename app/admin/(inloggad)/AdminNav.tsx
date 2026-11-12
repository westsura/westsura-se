"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { loggaUt } from "@/app/admin/actions";
import type { Roll } from "@/lib/admin";

type Post = { href: string; label: string; roller: Roll[] };

/** Menyn i grupper. `roller` tom = alla. Superadmin ser allt; en grupp utan synliga poster döljs. */
const grupper: { rubrik: string | null; poster: Post[] }[] = [
  { rubrik: null, poster: [{ href: "/admin", label: "Översikt", roller: [] }] },
  { rubrik: "Bokningar", poster: [
    { href: "/admin/kalender", label: "Kalender", roller: ["vardskap"] },
    { href: "/admin/bokningar", label: "Bokningar", roller: ["vardskap"] },
    { href: "/admin/bokningar/boende", label: "Boende bokat på sajten", roller: ["vardskap"] },
  ] },
  { rubrik: "Evenemang & aktiviteter", poster: [
    { href: "/admin/evenemang", label: "Evenemang", roller: ["vardskap"] },
    { href: "/admin/kurser", label: "Kurser & aktiviteter", roller: ["vardskap", "ekonomi"] },
  ] },
  { rubrik: "Jakt", poster: [
    { href: "/admin/tillfallen", label: "Jaktdagar & kurser", roller: ["jaktadmin"] },
    { href: "/admin/jaktklubb", label: "Jaktklubben", roller: ["jaktadmin"] },
    { href: "/admin/sakerhetskurs", label: "Säkerhetskurs", roller: ["jaktadmin"] },
  ] },
  { rubrik: "Ekonomi", poster: [
    { href: "/admin/priser", label: "Priser", roller: ["ekonomi"] },
    { href: "/admin/fakturering", label: "Fakturering", roller: ["ekonomi"] },
  ] },
  { rubrik: "Kommunikation", poster: [{ href: "/admin/vanner", label: "Westsuras Vänner", roller: ["vardskap", "kommunikation"] }] },
  { rubrik: "Inställningar", poster: [{ href: "/admin/anvandare", label: "Användare", roller: ["superadmin"] }] },
];

export default function AdminNav({ roller }: { roller: Roll[] }) {
  const p = usePathname();
  const superadmin = roller.includes("superadmin");
  const far = (m: Post) => !m.roller.length || superadmin || m.roller.some((r) => roller.includes(r));
  const alla = grupper.flatMap((g) => g.poster).filter(far);
  // Mest specifika träffen är aktiv (så att Bokningar inte lyser när man är på Boende bokat på sajten).
  const aktiv = alla.filter((m) => p === m.href || (m.href !== "/admin" && p.startsWith(m.href + "/"))).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="admin__nav" aria-label="Admin">
      <p className="label" style={{ marginBottom: 6 }}>Westsura</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: "0 0 20px", color: "var(--text-heading)" }}>Admin</p>
      {grupper.map((g) => {
        const synliga = g.poster.filter(far);
        if (!synliga.length) return null;
        return (
          <div key={g.rubrik ?? "start"} className="admin__navgrupp">
            {g.rubrik && <p className="admin__navrubrik">{g.rubrik}</p>}
            {synliga.map((m) => <Link key={m.href} href={m.href} aria-current={aktiv === m.href ? "page" : undefined}>{m.label}</Link>)}
          </div>
        );
      })}
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <Link href="/" style={{ fontSize: 13 }}>Till sajten →</Link>
        <Link href="/admin/losenord" style={{ fontSize: 13 }}>Byt lösenord</Link>
        <button type="button" onClick={async () => { await loggaUt(); location.href = "/admin/login"; }} className="admin__logout">Logga ut</button>
      </div>
    </nav>
  );
}
