"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { loggaUt } from "@/app/admin/actions";

const menu = [
  { href: "/admin", label: "Översikt" },
  { href: "/admin/kalender", label: "Kalender" },
  { href: "/admin/bokningar", label: "Bokningar" },
  { href: "/admin/forfragningar", label: "Förfrågningar" },
  { href: "/admin/tillfallen", label: "Tillfällen" },
  { href: "/admin/vanner", label: "Vänner" },
];

export default function AdminNav() {
  const p = usePathname();
  return (
    <nav className="admin__nav" aria-label="Admin">
      <p className="label" style={{ marginBottom: 6 }}>Westsura</p>
      <p style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: "0 0 20px", color: "var(--text-heading)" }}>Admin</p>
      {menu.map((m) => (
        <Link key={m.href} href={m.href} aria-current={p === m.href || (m.href !== "/admin" && p.startsWith(m.href)) ? "page" : undefined}>{m.label}</Link>
      ))}
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <Link href="/" style={{ fontSize: 13 }}>Till sajten →</Link>
        <button type="button" onClick={async () => { await loggaUt(); location.href = "/admin/login"; }} className="admin__logout">Logga ut</button>
      </div>
    </nav>
  );
}
