"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { kravMedlem } from "@/lib/jakt";
import { mejlDokumentVantar } from "@/lib/epost";
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

/* ---------- Medlemmens dokument ---------- */

const MAX_BYTE = 10 * 1024 * 1024;
const TILLATNA: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
const TYPER: Record<string, string> = { jaktkort: "Statligt jaktkort", id: "ID-handling", algskyttemarke: "Älgskyttemärke" };

/**
 * Laddar upp en kopia till den privata bucketen och ersätter den förra.
 * Går via servicenyckeln: bucketen har inga policys för anon eller authenticated.
 */
export async function laddaUppDokument(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  const medlem = await kravMedlem();
  const typ = s(fd.get("typ"));
  if (!TYPER[typ]) return { ok: false, fel: "Okänd dokumenttyp." };

  const fil = fd.get("fil");
  if (!(fil instanceof File) || !fil.size) return { ok: false, fel: "Välj en fil att ladda upp." };
  if (fil.size > MAX_BYTE) return { ok: false, fel: `Filen är för stor. Högst ${MAX_BYTE / 1024 / 1024} MB.` };
  const ext = TILLATNA[fil.type];
  if (!ext) return { ok: false, fel: "Filen måste vara en PDF, JPG eller PNG." };

  const adm = supabaseAdmin();
  const sokvag = `${medlem.id}/${typ}.${ext}`;

  // En tidigare uppladdning kan ha haft ett annat filformat — den filen städas bort.
  const { data: fanns, error: felUppslag } = await adm.from("medlemsdokument").select("fil").eq("medlem_id", medlem.id).eq("typ", typ).maybeSingle();
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (fanns?.fil && fanns.fil !== sokvag) await adm.storage.from("medlemsdokument").remove([fanns.fil]);

  const { error: felUppladdning } = await adm.storage.from("medlemsdokument")
    .upload(sokvag, fil, { contentType: fil.type, upsert: true });
  if (felUppladdning) return { ok: false, fel: felUppladdning.message };

  const { error } = await adm.from("medlemsdokument").upsert({
    medlem_id: medlem.id, typ, fil: sokvag, status: "inskickad",
    kommentar: null, giltig_till: null, granskad_av: null, granskad: null,
  }, { onConflict: "medlem_id,typ" });
  if (error) return { ok: false, fel: error.message };

  try { await mejlDokumentVantar({ namn: medlem.namn, dokument: TYPER[typ] }); } catch (e) { console.error("mejl misslyckades", e); }
  revalidatePath("/jaktklubb/medlem/medlemskap");
  revalidatePath("/admin/jaktklubb");
  revalidatePath(`/admin/jaktklubb/${medlem.id}`);
  return { ok: true };
}
