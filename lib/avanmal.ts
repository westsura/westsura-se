import { createHmac, timingSafeEqual } from "crypto";
import { site } from "@/lib/site";

/**
 * Avanmälningslänk för Westsuras Vänner. Länken signeras så att ingen kan
 * avanmäla någon annan genom att bara byta e-postadressen i adressen.
 */
const nyckel = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "westsura";

export function avanmalToken(epost: string) {
  return createHmac("sha256", nyckel()).update("van:" + epost.toLowerCase()).digest("base64url").slice(0, 32);
}

export function giltigToken(epost: string, token: string) {
  const a = Buffer.from(avanmalToken(epost)), b = Buffer.from(token || "");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function avanmalLank(epost: string) {
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  return `${bas}/vanner/avsluta?e=${encodeURIComponent(epost.toLowerCase())}&t=${avanmalToken(epost)}`;
}
