import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Håller admin-sessionen vid liv och skickar utloggade till inloggningen. */
export async function middleware(req: NextRequest) {
  // Gamla WordPress-adresser med stor bokstav (/Konferens) → /konferens.
  // Görs här och inte i next.config, där matchningen inte skiljer på stora och små bokstäver.
  const sokvag = req.nextUrl.pathname.replace(/\/$/, "");
  if (STORA.includes(sokvag.slice(1).toLowerCase())) {
    if (sokvag !== sokvag.toLowerCase()) {
      const url = req.nextUrl.clone(); url.pathname = sokvag.toLowerCase();
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return res;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(all: { name: string; value: string; options?: CookieOptions }[]) {
        all.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        all.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const p = req.nextUrl.pathname;

  // Jaktklubbens medlemsdel. Hålls isär från adminomdirigeringarna.
  if (p.startsWith("/jaktklubb")) {
    if (!user && p.startsWith("/jaktklubb/medlem")) {
      const url = req.nextUrl.clone(); url.pathname = "/jaktklubb/login"; url.search = "";
      return NextResponse.redirect(url);
    }
    // En inloggad som inte är medlem skickas tillbaka hit av kravMedlem med
    // ?fel=ingen-behorighet. Utan undantaget för fel skulle de två
    // omdirigeringarna studsa mot varandra i all oändlighet.
    if (user && p === "/jaktklubb/login" && !req.nextUrl.searchParams.has("fel")) {
      const url = req.nextUrl.clone(); url.pathname = "/jaktklubb/medlem"; url.search = "";
      return NextResponse.redirect(url);
    }
    return res;
  }

  const oppen = p.startsWith("/admin/login") || p.startsWith("/admin/auth");
  if (!user && !oppen) {
    const url = req.nextUrl.clone(); url.pathname = "/admin/login"; url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && p === "/admin/login") {
    const url = req.nextUrl.clone(); url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  return res;
}

const STORA = ["konferens", "boende", "jakt", "event", "paket", "kontakt", "om-oss", "brollop", "hundar"];

export const config = {
  matcher: [
    "/admin/:path*", "/jaktklubb/medlem/:path*", "/jaktklubb/login",
    "/konferens", "/boende", "/jakt", "/event", "/paket", "/kontakt", "/om-oss", "/brollop", "/hundar",
  ],
};
