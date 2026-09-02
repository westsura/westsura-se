import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Håller admin-sessionen vid liv och skickar utloggade till inloggningen. */
export async function middleware(req: NextRequest) {
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

export const config = { matcher: ["/admin/:path*"] };
