"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { kravMedlem, kursStatus } from "@/lib/jakt";
import { mejlDokumentVantar, mejlAnmalan, mejlVakOnskad } from "@/lib/epost";
import { vakPris } from "@/lib/vak";
import { kollaLosenord } from "@/lib/konto";
import { site } from "@/lib/site";

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** E-post + lösenord. Adressen måste vara medlem eller gästjägare. */
export async function loggaInMedlem(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  const epost = s(fd.get("epost")).toLowerCase(), losenord = s(fd.get("losenord"));
  if (!epost.includes("@") || !losenord) return { ok: false, fel: "Ange e-post och lösenord." };
  const adm = supabaseAdmin();
  const { data: medlem, error: felUppslag } = await adm.rpc("ar_jaktmedlem", { e: epost });
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!medlem) return { ok: false, fel: "Adressen har inget jägarkonto hos oss. Ett konto skapas när du anmäler dig till en jaktdag eller när ditt medlemskap godkänns." };
  const db = await supabaseServer();
  const { error } = await db.auth.signInWithPassword({ email: epost, password: losenord });
  if (error) return { ok: false, fel: error.message.includes("Invalid login") ? "Fel e-post eller lösenord." : error.message };
  return { ok: true };
}

/** Inloggad medlem byter sitt lösenord. */
export async function bytLosenordMedlem(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravMedlem();
  const losenord = s(fd.get("losenord"));
  const fel = kollaLosenord(losenord);
  if (fel) return { ok: false, fel };
  if (losenord !== s(fd.get("losenord2"))) return { ok: false, fel: "Lösenorden stämmer inte överens." };
  const db = await supabaseServer();
  const { error } = await db.auth.updateUser({ password: losenord });
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}

/**
 * Glömt lösenord: engångslänk per mejl som leder till sidan där ett nytt sätts.
 * Adressen måste finnas som medlem innan någon länk skickas.
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
    options: { emailRedirectTo: `${bas}/jaktklubb/auth/callback?next=/jaktklubb/medlem/losenord`, shouldCreateUser: true },
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
  const tillaten = t && t.typ === "jakt" && t.publicerad && t.datum >= idag && (t.synlighet === "publik" || (t.synlighet === "medlem" && medlem.status === "godkand"));
  if (!tillaten) return { ok: false, fel: "Jaktdagen går inte att boka." };

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
  await adm.from("anmalan").update({ jagare_id: medlem.id }).eq("id", rad.anmalan_id);

  try {
    await mejlAnmalan({ epost: medlem.epost, namn: medlem.namn, titel: t.titel, datum: t.datum, status: rad.status, antal: 1 });
  } catch (e) { console.error("mejl misslyckades", e); }

  revalidatePath("/jaktklubb/medlem"); revalidatePath("/jaktklubb/medlem/boka"); revalidatePath("/jaktklubb/medlem/bokningar");
  revalidatePath("/admin/tillfallen");
  return { ok: true, status: rad.status };
}

/* ---------- Vak & pyrsch ---------- */

/**
 * Önskar ett vak- eller pyrschdygn bland dem herrgården lagt ut. Datumen släpps av
 * admin så att vak och pyrsch inte stör drevjakterna; vissa dygn är bara för
 * medlemmar, andra även för gäster. Medlemmar betalar enligt nivåns kvot, gäster
 * dygnets pris. Jaktledaren (admin) bekräftar och sätter område.
 */
export async function onskaVakdygn(fd: FormData): Promise<{ ok: boolean; fel?: string; pris?: number }> {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const gast = medlem.status !== "godkand";
  const utbudId = s(fd.get("utbud"));
  let typ = s(fd.get("typ")) === "pyrsch" ? "pyrsch" : "vak";
  const onskatOmrade = s(fd.get("omrade")) || null;
  const meddelande = s(fd.get("meddelande")) || null;
  let pris = 0;
  if (!utbudId) return { ok: false, fel: "Välj ett av de utlagda dygnen." };

  const { data: sasong } = await adm.from("jaktsasong").select("id").eq("aktiv", true).maybeSingle();
  const { data: u, error } = await adm.from("vakutbud").select("id, datum, typ, pris, publicerad, synlighet").eq("id", utbudId).maybeSingle();
  if (error) return { ok: false, fel: error.message };
  if (!u || !u.publicerad || u.datum < idag) return { ok: false, fel: "Dygnet går inte att boka längre." };
  if (gast && u.synlighet !== "alla") return { ok: false, fel: "Det här dygnet är bara för medlemmar." };
  const { data: kvar } = await adm.rpc("vakutbud_kvar", { u: utbudId });
  if (typeof kvar === "number" && kvar <= 0) return { ok: false, fel: "Dygnet är redan bokat." };
  const datum: string = u.datum;
  if (u.typ !== "bada") typ = u.typ;
  pris = gast ? u.pris : 0;

  // Medlemmens kvot: ingående dygn per säsong enligt nivån, därefter pris per dygn.
  if (!gast) {
    const { data: niva } = medlem.niva_id
      ? await adm.from("medlemsniva").select("vakdygn_ingar, vakdygn_pris").eq("id", medlem.niva_id).maybeSingle()
      : { data: null };
    const { count } = await adm.from("vakbokning").select("id", { count: "exact", head: true })
      .eq("jagare_id", medlem.id).in("status", ["onskad", "bekraftad"]).eq("sasong_id", sasong?.id ?? "00000000-0000-0000-0000-000000000000");
    pris = vakPris(niva as { vakdygn_ingar: number | null; vakdygn_pris: number } | null, count ?? 0);
  }

  const { data: finns } = await adm.from("vakbokning").select("id").eq("jagare_id", medlem.id).eq("datum", datum).in("status", ["onskad", "bekraftad"]).maybeSingle();
  if (finns) return { ok: false, fel: "Du har redan önskat det dygnet." };

  const { error: felInsert } = await adm.from("vakbokning").insert({
    jagare_id: medlem.id, utbud_id: utbudId, sasong_id: sasong?.id ?? null, datum, typ,
    onskat_omrade_id: onskatOmrade, pris, meddelande,
  });
  if (felInsert) return { ok: false, fel: felInsert.message };

  let omradeNamn: string | null = null;
  if (onskatOmrade) {
    const { data: o } = await adm.from("vakomrade").select("namn").eq("id", onskatOmrade).maybeSingle();
    omradeNamn = o?.namn ?? null;
  }
  try {
    await mejlVakOnskad({ epost: medlem.epost, namn: medlem.namn, datum, typ: typ === "vak" ? "Vak" : "Pyrsch", omrade: omradeNamn, pris, meddelande, gast });
  } catch (e) { console.error("mejl misslyckades", e); }

  revalidatePath("/jaktklubb/medlem/vak"); revalidatePath("/jaktklubb/medlem"); revalidatePath("/admin/jaktklubb/vak"); revalidatePath("/admin/jaktklubb");
  return { ok: true, pris };
}

/** Jägaren avbokar ett eget dygn som inte passerat. */
export async function avbokaVakdygn(id: string): Promise<{ ok: boolean; fel?: string }> {
  const medlem = await kravMedlem();
  const adm = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const { data: b } = await adm.from("vakbokning").select("id, datum, status").eq("id", id).eq("jagare_id", medlem.id).maybeSingle();
  if (!b || (b.status !== "onskad" && b.status !== "bekraftad")) return { ok: false, fel: "Dygnet går inte att avboka." };
  if (b.datum < idag) return { ok: false, fel: "Dygnet har redan varit." };
  const { error } = await adm.from("vakbokning").update({ status: "avbokad" }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/jaktklubb/medlem/vak"); revalidatePath("/admin/jaktklubb/vak");
  return { ok: true };
}

/* ---------- Säkerhetskurs ---------- */
export type Provfraga = { id: string; fraga: string; alternativ: string[] };

/**
 * Startar ett prov: slumpar frågor ur poolen och sparar vilka det blev.
 * Rätt svar lämnar aldrig servern — rättningen sker i lamnaProv.
 */
export async function startaProv(): Promise<{ ok: true; provId: string; fragor: Provfraga[] } | { ok: false; fel: string }> {
  const medlem = await kravMedlem();
  const { installning } = await kursStatus(medlem);
  const adm = supabaseAdmin();
  const { data: pool, error } = await adm.from("kursfraga").select("id, fraga, alternativ, kritisk").eq("publicerad", true);
  if (error) return { ok: false, fel: error.message };
  if (!pool?.length) return { ok: false, fel: "Provet är inte upplagt ännu. Ring oss så hjälper vi dig." };

  // Alla kritiska frågor är alltid med; resten fylls på slumpvis upp till antal_fragor.
  const bland = <T,>(xs: T[]) => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const kritiska = bland(pool.filter((f) => f.kritisk));
  const ovriga = bland(pool.filter((f) => !f.kritisk));
  const antal = Math.min(Math.max(installning.antal_fragor, kritiska.length), pool.length);
  const valda = bland([...kritiska, ...ovriga.slice(0, Math.max(0, antal - kritiska.length))]);

  const { data: sasong } = await adm.from("jaktsasong").select("id").eq("aktiv", true).maybeSingle();
  const { data: prov, error: felProv } = await adm.from("kursprov").insert({
    medlem_id: medlem.id, sasong_id: sasong?.id ?? null, version: installning.version, fragor: valda.map((f) => f.id),
  }).select("id").single();
  if (felProv || !prov) return { ok: false, fel: felProv?.message ?? "Kunde inte starta provet." };

  return { ok: true, provId: prov.id, fragor: valda.map((f) => ({ id: f.id, fraga: f.fraga, alternativ: f.alternativ as string[] })) };
}

export type Provresultat = {
  godkand: boolean; poang: number; max: number; procent: number; kritisktFel: boolean; godkantProcent: number;
  genomgang: { id: string; fraga: string; ditt: number; ratt: number; alternativ: string[]; kritisk: boolean; forklaring: string | null; avsnitt: string | null }[];
};

/** Rättar provet på servern och sätter medlemmens kursflagga vid godkänt. */
export async function lamnaProv(provId: string, svar: Record<string, number>): Promise<{ ok: true; resultat: Provresultat } | { ok: false; fel: string }> {
  const medlem = await kravMedlem();
  const { installning } = await kursStatus(medlem);
  const adm = supabaseAdmin();
  const { data: prov, error } = await adm.from("kursprov").select("id, fragor, inlamnad").eq("id", provId).eq("medlem_id", medlem.id).maybeSingle();
  if (error) return { ok: false, fel: error.message };
  if (!prov) return { ok: false, fel: "Provet hittades inte." };
  if (prov.inlamnad) return { ok: false, fel: "Provet är redan inlämnat." };

  const { data: fragor } = await adm.from("kursfraga").select("id, fraga, alternativ, ratt, kritisk, forklaring, avsnitt:avsnitt_id(rubrik)").in("id", prov.fragor as string[]);
  const lista = (fragor ?? []) as unknown as { id: string; fraga: string; alternativ: string[]; ratt: number; kritisk: boolean; forklaring: string | null; avsnitt: { rubrik: string } | null }[];
  let poang = 0, kritisktFel = false;
  const genomgang = (prov.fragor as string[]).map((id) => {
    const f = lista.find((x) => x.id === id)!;
    const ditt = typeof svar[id] === "number" ? svar[id] : -1;
    const rattSvar = ditt === f.ratt;
    if (rattSvar) poang++; else if (f.kritisk) kritisktFel = true;
    return { id, fraga: f.fraga, ditt, ratt: f.ratt, alternativ: f.alternativ, kritisk: f.kritisk, forklaring: f.forklaring, avsnitt: f.avsnitt?.rubrik ?? null };
  });
  const max = genomgang.length;
  const procent = max ? Math.round((poang / max) * 100) : 0;
  const godkand = !kritisktFel && procent >= installning.godkant_procent;

  const nu = new Date().toISOString();
  await adm.from("kursprov").update({ svar, poang, max, kritiskt_fel: kritisktFel, godkand, inlamnad: nu }).eq("id", provId);
  if (godkand) {
    await adm.from("jaktmedlem").update({ kurs_genomford: true, kurs_godkand: nu, kurs_version: installning.version }).eq("id", medlem.id);
  }
  revalidatePath("/jaktklubb/medlem"); revalidatePath("/jaktklubb/medlem/sakerhetskurs"); revalidatePath("/jaktklubb/medlem/boka"); revalidatePath("/jaktklubb/medlem/medlemskap");
  revalidatePath("/admin/sakerhetskurs"); revalidatePath("/admin/jaktklubb");
  return { ok: true, resultat: { godkand, poang, max, procent, kritisktFel, godkantProcent: installning.godkant_procent, genomgang } };
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
