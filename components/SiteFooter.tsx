import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-brand">
          <Image src="/bilder/logo-lockup-guld.png" alt="Westsura Herrgård" width={903} height={467} />
          <p>En plats att längta tillbaka till.</p>
        </div>
        <div className="grid grid-4">
          <div>
            <h4>Sidor</h4>
            <ul>
              <li><Link href="/boende">Boende</Link></li>
              <li><Link href="/konferens">Konferens</Link></li>
              <li><Link href="/event">Event</Link></li>
              <li><Link href="/jakt">Jakt</Link></li>
              <li><Link href="/paket">Paket &amp; Erbjudanden</Link></li>
              <li><Link href="/om-oss">Om oss &amp; historien</Link></li>
            </ul>
          </div>
          <div>
            <h4>Bra att veta</h4>
            <ul>
              <li><Link href="/villkor">Bokningsvillkor</Link></li>
              <li><Link href="/integritetspolicy">Integritetspolicy</Link></li>
              <li><Link href="/hundar">Hundar på Westsura</Link></li>
              <li><Link href="/goda-grannar">Goda grannar</Link></li>
              <li><Link href="/kontakt">Kontakt &amp; hitta hit</Link></li>
            </ul>
          </div>
          <div>
            <h4>Kontakt</h4>
            <p style={{ marginBottom: 8 }}>
              {site.name}<br />{site.address.street}<br />{site.address.zip} {site.address.city}
            </p>
            <p style={{ marginBottom: 0 }}>
              <a href={site.phoneHref}>{site.phone}</a><br />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>
          <div>
            <h4>Följ oss</h4>
            <ul>
              <li><a href={site.social.instagram} rel="noopener">Instagram</a></li>
              <li><a href={site.social.facebook} rel="noopener">Facebook</a></li>
              <li><a href={site.social.linkedin} rel="noopener">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{site.company} · {site.orgNr}</span>
          <span>Hundar är varmt välkomna i samtliga rum</span>
        </div>
      </div>
    </footer>
  );
}
