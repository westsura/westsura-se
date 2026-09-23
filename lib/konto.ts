import { supabaseAdmin } from "@/lib/supabase";

/**
 * Konton och lösenord — körs alltid med servicenyckeln, från server actions.
 * Inloggningen är e-post + lösenord; engångslänken finns bara kvar som "glömt lösenord".
 */

const TECKEN = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Ett läsbart engångslösenord, t.ex. "skog-4Kq7-vind". Byts av användaren efter första inloggningen. */
export function slumpaLosenord() {
  const ord = ["skog", "vind", "torn", "mosse", "gryning", "sadel", "ek", "tall", "fjall", "hage", "kvall", "rad"];
  const a = ord[Math.floor(Math.random() * ord.length)], b = ord[Math.floor(Math.random() * ord.length)];
  let mitt = "";
  for (let i = 0; i < 4; i++) mitt += TECKEN[Math.floor(Math.random() * TECKEN.length)];
  return `${a}-${mitt}-${b}`;
}

export function kollaLosenord(l: string): string | null {
  if (l.length < 8) return "Lösenordet behöver minst åtta tecken.";
  return null;
}

/** Hittar auth-användaren för en adress, via en funktion som bara servicenyckeln får anropa. */
export async function authIdFor(epost: string): Promise<string | null> {
  const { data } = await supabaseAdmin().rpc("auth_user_id_for", { e: epost.toLowerCase() });
  return (data as string | null) ?? null;
}

/**
 * För nya jägarkonton: skapar inloggning med engångslösenord om adressen saknar konto,
 * kopplar medlemsraden och returnerar lösenordet (att lägga i välkomstmejlet). Null om kontot redan fanns.
 */
export async function inloggningForNyttKonto(medlemId: string, epost: string): Promise<string | null> {
  const adm = supabaseAdmin();
  const finns = await authIdFor(epost);
  if (finns) { await adm.from("jaktmedlem").update({ anvandare_id: finns }).eq("id", medlemId).is("anvandare_id", null); return null; }
  const losenord = slumpaLosenord();
  const k = await sattLosenord(epost, losenord);
  if (!k.ok) { console.error("kunde inte skapa inloggning", k.fel); return null; }
  await adm.from("jaktmedlem").update({ anvandare_id: k.id }).eq("id", medlemId);
  return losenord;
}

/**
 * Ser till att adressen har ett inloggningskonto med det angivna lösenordet.
 * Finns kontot sätts lösenordet om; annars skapas det, färdigbekräftat.
 */
export async function sattLosenord(epost: string, losenord: string): Promise<{ ok: true; id: string; ny: boolean } | { ok: false; fel: string }> {
  const fel = kollaLosenord(losenord);
  if (fel) return { ok: false, fel };
  const adm = supabaseAdmin();
  const e = epost.toLowerCase();
  const id = await authIdFor(e);
  if (id) {
    const { error } = await adm.auth.admin.updateUserById(id, { password: losenord, email_confirm: true });
    if (error) return { ok: false, fel: error.message };
    return { ok: true, id, ny: false };
  }
  const { data, error } = await adm.auth.admin.createUser({ email: e, password: losenord, email_confirm: true });
  if (error || !data.user) return { ok: false, fel: error?.message ?? "Kunde inte skapa kontot." };
  return { ok: true, id: data.user.id, ny: true };
}
