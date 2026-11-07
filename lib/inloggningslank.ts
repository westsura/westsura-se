import { supabaseAdmin } from "@/lib/supabase";
import { site } from "@/lib/site";

/**
 * Engångslänk för inloggning ("glömt lösenord") som fungerar oavsett enhet och webbläsare.
 *
 * Supabase egen länk är bunden till webbläsaren där den beställdes (PKCE), och den förbrukas
 * av e-postsystemens länkskannrar (t.ex. Microsoft Safe Links) som "klickar" på länken innan
 * mottagaren gör det. Därför skapas länken här och pekar på en egen sida där man trycker
 * på en knapp — först då förbrukas engångskoden.
 */
export async function skapaInloggningslank(epost: string, sida: "/jaktklubb/auth/bekrafta" | "/admin/auth/bekrafta", next: string) {
  const adm = supabaseAdmin();
  let { data, error } = await adm.auth.admin.generateLink({ type: "magiclink", email: epost });
  if (error && /not.*found|no user/i.test(error.message)) {
    // Kontot finns inte än (t.ex. medlem som aldrig fått inloggning) — skapa det och försök igen.
    const { error: felSkapa } = await adm.auth.admin.createUser({ email: epost, email_confirm: true });
    if (felSkapa) return { fel: felSkapa.message };
    ({ data, error } = await adm.auth.admin.generateLink({ type: "magiclink", email: epost }));
  }
  if (error || !data?.properties?.hashed_token) return { fel: error?.message ?? "Kunde inte skapa länken." };
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  const q = new URLSearchParams({ token_hash: data.properties.hashed_token, type: "magiclink", next });
  return { lank: `${bas}${sida}?${q.toString()}` };
}
