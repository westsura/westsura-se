"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { kravMedlem } from "@/lib/jakt";
import { mejlDokumentVantar, mejlAnmalan } from "@/lib/epost";
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

/* ---------- Boka jaktdag ---------- */

/** Anmäler medlemmen till en av klubbens jaktdagar. Kölista när det är fullt. */
export async function bokaJaktdag(tillfalleId: string): Promise<{ ok: boolean; fel?: string; status?: string }> {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();

  // Alla tre handlingar ska vara godkända före första jaktdag.
  const { count, error: felDok } = await adm.from("medlemsdokument")
    .select("id", { count: "exact", head: true }).eq("medlem_id", medlem.id).eq("status", "godkand");
  if (felDok) return { ok: false, fel: felDok.message };
  if (count !== 3) return { ok: false, fel: "Ladda upp och få dina dokument godkända innan du bokar." };

  // Bara klubbens egna, publicerade jaktdagar framåt i tiden.
  const idag = new Date().toISOString().slice(0, 10);
  const { data: t, error: felT } = await adm.from("tillfalle")
    .select("id, titel, datum, typ, synlighet, publicerad").eq("id", tillfalleId).maybeSingle();
  if (felT) return { ok: false, fel: felT.message };
  if (!t || t.typ !== "jakt" || t.synlighet !== "medlem" || !t.publicerad || t.datum < idag) {
    return { ok: false, fel: "Jaktdagen går inte att boka." };
  }

  const { data: finns, error: felFinns } = await adm.from("anmalan")
    .select("id").eq("tillfalle_id", tillfalleId).eq("epost", medlem.epost).neq("status", "avbokad").maybeSingle();
  if (felFinns) return { ok: false, fel: felFinns.message };
  if (finns) return { ok: false, fel: "Du är redan anmäld till den här jaktdagen." };

  const { data, error } = await adm.rpc("skapa_anmalan", {
    p_tillfalle: tillfalleId, p_namn: medlem.namn, p_epost: medlem.epost,
    p_telefon: medlem.telefon, p_antal: 1, p_meddelande: null,
  });
  if (error) return { ok: false, fel: error.message };
  const rad = (data as { anmalan_id: string; status: string }[])[0];

  try {
    await mejlAnmalan({ epost: medlem.epost, namn: medlem.namn, titel: t.titel, datum: t.datum, status: rad.status, antal: 1 });
  } catch (e) { console.error("mejl misslyckades", e); }

  revalidatePath("/jaktklubb/medlem"); revalidatePath("/jaktklubb/medlem/boka"); revalidatePath("/jaktklubb/medlem/bokningar");
  revalidatePath("/admin/tillfallen");
  return { ok: true, status: rad.status };
}

/** Avbokar medlemmens egen anmälan. */
export async function avbokaAnmalan(anmalanId: string): Promise<{ ok: boolean; fel?: string }> {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  // eq på e-posten gör att ingen kan avboka någon annans plats.
  const { data, error } = await adm.from("anmalan").update({ status: "avbokad" })
    .eq("id", anmalanId).eq("epost", medlem.epost).select("id");
  if (error) return { ok: false, fel: error.message };
  if (!data?.length) return { ok: false, fel: "Bokningen hittades inte." };
  revalidatePath("/jaktklubb/medlem"); revalidatePath("/jaktklubb/medlem/boka"); revalidatePath("/jaktklubb/medlem/bokningar");
  revalidatePath("/admin/tillfallen");
  return { ok: true };
}
