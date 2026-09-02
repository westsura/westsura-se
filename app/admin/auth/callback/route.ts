import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/** Byter engångskoden i inloggningslänken mot en session. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const res = NextResponse.redirect(new URL("/admin", url.origin));
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(all: { name: string; value: string; options?: CookieOptions }[]) { all.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
    },
  });
  let error = null;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "magiclink" | "email" }));
  else return NextResponse.redirect(new URL("/admin/login?fel=lank", url.origin));
  if (error) return NextResponse.redirect(new URL("/admin/login?fel=lank", url.origin));
  return res;
}
