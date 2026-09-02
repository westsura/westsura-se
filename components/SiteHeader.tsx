"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="container">
        <Link className="brand" href="/" aria-label="Westsura Herrgård — till startsidan">
          <Image src="/bilder/logo-lockup-gron.png" alt="Westsura Herrgård" width={640} height={390} priority />
        </Link>
        <nav className="nav" aria-label="Huvudmeny">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <a className="tel" href={site.phoneHref}>{site.phone}</a>
          <Link className="btn" href="/boende#bokning">Boka</Link>
          <button className="menu-btn" type="button" aria-expanded={open} aria-controls="mobilmeny" onClick={() => setOpen(!open)}>
            {open ? "Stäng" : "Meny"}
          </button>
        </div>
      </div>
      <nav id="mobilmeny" className={`mobile-nav${open ? " open" : ""}`} aria-label="Mobilmeny">
        {nav.map((n) => (
          <Link key={n.href} href={n.href}>{n.label}</Link>
        ))}
        <a href={site.phoneHref}>Ring {site.phone}</a>
      </nav>
    </header>
  );
}
