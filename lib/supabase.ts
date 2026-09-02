import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabaseKonfigurerad = !!(url && anon);

/** Publik klient (läser bara det som är öppet: enheter, tillfällen, priser). */
export function supabasePublik() {
  if (!supabaseKonfigurerad) throw new Error("Supabase är inte konfigurerat (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)");
  return createClient(url, anon, { auth: { persistSession: false } });
}

/** Serverklient med full behörighet. Används bara i server actions, aldrig i klienten. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY saknas");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Serverklient som följer den inloggade adminanvändarens session (cookies). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(all) {
        try { all.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* i server components går det inte att sätta cookies */ }
      },
    },
  });
}
