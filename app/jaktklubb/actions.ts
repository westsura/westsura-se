"use server";

import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { site } from "@/lib/site";

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/**
 * Engångslänk till medlemsklubben. Samma mekanik som adminens inloggning:
 * adressen måste finnas som godkänd medlem innan någon länk skickas.
 */
export async function skickaMedlemslank(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  const epost = s(fd.get("epost")).toLowerCase();
  if (!epost.includes("@")) return { ok: false, fel: "Ange en e-postadress." };

  // ar_jaktmedlem får bara anropas av servicenyckeln — annars gick det att fråga
  // utifrån om en godtycklig adress är medlem i klubben.
  const adm = supabaseAdmin();
  const { data: medlem, error: felUppslag } = await adm.rpc("ar_jaktmedlem", { e: epost });
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!medlem) return { ok: false, fel: "Adressen är inte registrerad som medlem – ring oss." };

  const db = await supabaseServer();
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  const { error } = await db.auth.signInWithOtp({
    email: epost,
    options: { emailRedirectTo: `${bas}/jaktklubb/auth/callback`, shouldCreateUser: true },
  });
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}

/** Loggar ut medlemmen. Ligger här och inte i lib/jakt.ts — server actions kräver "use server". */
export async function loggaUtMedlem() {
  const db = await supabaseServer();
  const { error } = await db.auth.signOut();
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}
