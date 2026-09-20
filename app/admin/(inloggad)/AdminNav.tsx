"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { loggaUt } from "@/app/admin/actions";
import type { Roll } from "@/lib/admin";

/** `roller` tom betyder att posten syns för alla. Superadmin ser allt. */
const menu: { href: string; label: string; roller: Roll[] }[] = [
  { href: "/admin", label: "Översikt", roller: [] },
  { href: "/admin/kalender", label: "Kalender", roller: ["vardskap"] },
  { href: "/admin/bokningar", label: "Bokningar", roller: ["vardskap"] },
  { href: "/admin/forfragningar", label: "Förfrågningar", roller: ["vardskap"] },
  { href: "/admin/fakturering", label: "Fakturering", roller: ["vardskap"] },
  { href: "/admin/tillfallen", label: "Tillfällen", roller: ["vardskap", "jaktadmin"] },
  { href: "/admin/vanner", label: "Vänner", roller: ["vardskap", "kommunikation"] },
];

export default function AdminNav({ roller }: { roller: Roll[] }) {
  const p = usePathname();
  const superadmin = roller.includes("superadmin");
  const synliga = menu.filter((m) => !m.roller.length || superadmin || m.roller.some((r) => roller.includes(r)));
  return (
    <nav className="admin__nav" aria-label="Admin">
      <p className="label" style={{ marginBottom: 6 }}>Westsura</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: "0 0 20px", color: "var(--text-heading)" }}>Admin</p>
      {synliga.map((m) => (
        <Link key={m.href} href={m.href} aria-current={p === m.href || (m.href !== "/admin" && p.startsWith(m.href)) ? "page" : undefined}>{m.label}</Link>
      ))}
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <Link href="/" style={{ fontSize: 13 }}>Till sajten →</Link>
        <button type="button" onClick={async () => { await loggaUt(); location.href = "/admin/login"; }} className="admin__logout">Logga ut</button>
      </div>
    </nav>
  );
}
