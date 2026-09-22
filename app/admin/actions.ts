"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { kravAdmin } from "@/lib/admin";
import { mejlMedlemGodkand, mejlMedlemVantelista, mejlMedlemAvbojd, mejlDokumentstatus, mejlDokumentKlar } from "@/lib/epost";
import { Resend } from "resend";
import { site } from "@/lib/site";
import { FAKTURASTATUS } from "@/lib/faktura";

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/* ---------- Inloggning ---------- */
export async function skickaInloggningslank(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  const epost = s(fd.get("epost")).toLowerCase();
  if (!epost.includes("@")) return { ok: false, fel: "Ange en e-postadress." };
  const admin = supabaseAdmin();
  const { data: inbjuden, error: felUppslag } = await admin.rpc("ar_inbjuden", { e: epost });
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!inbjuden) return { ok: false, fel: "Adressen har inte behörighet till admin. Be superadmin lägga till dig." };
  const db = await supabaseServer();
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  const { error } = await db.auth.signInWithOtp({ email: epost, options: { emailRedirectTo: `${bas}/admin/auth/callback`, shouldCreateUser: true } });
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}

export async function loggaUt() {
  const db = await supabaseServer();
  const { error } = await db.auth.signOut();
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}

/* ---------- Bokningar ---------- */
export async function sattBokningsstatus(id: string, status: "preliminar" | "bekraftad" | "avbokad") {
  const db = await supabaseServer();
  const { error } = await db.from("bokning").update({ status }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  if (status === "bekraftad") {
    // Statusen är redan satt — ett fel här får bara påverka mejlet.
    const { data: b, error: felBokning } = await db.from("bokningar_admin").select("*").eq("id", id).single();
    if (felBokning) console.error("kunde inte hämta bokningen till bekräftelsemejlet", felBokning.message);
    if (b && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: felMejl } = await resend.emails.send({
          from: process.env.EPOST_FRAN || "Westsura Herrgård <boka@westsura.se>", to: [b.gast_epost],
          subject: `Bokning ${b.nummer} bekräftad — Westsura Herrgård`,
          html: `<p>Hej ${b.gast_namn},</p><p>Din bokning <strong>${b.nummer}</strong> är nu bekräftad: ${b.enheter}, ${b.ankomst} till ${b.avresa}. Summa ${b.summa.toLocaleString("sv-SE")} kr, betalning senast 7 dagar före ankomst.</p><p>Incheckning från kl. 15.00. Varmt välkomna!</p><p>${site.name} · ${site.phone}</p>`,
        });
        if (felMejl) console.error(`Mejlet gick inte fram (bokning ${b.nummer} bekräftad) till ${b.gast_epost}:`, felMejl.name, felMejl.message);
      } catch (e) { console.error(e); }
    }
  }
  revalidatePath("/admin/bokningar"); revalidatePath("/admin"); revalidatePath("/admin/kalender");
  return { ok: true };
}

export async function skapaManuellBokning(fd: FormData): Promise<{ ok: boolean; fel?: string; nummer?: number }> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, fel: "Inte inloggad" };
  const admin = supabaseAdmin();
  const enheter = s(fd.get("enheter")).split(",").map((x) => x.trim()).filter(Boolean);
  const { data, error } = await admin.rpc("skapa_bokning", {
    p_enheter: enheter, p_ankomst: s(fd.get("ankomst")), p_avresa: s(fd.get("avresa")),
    p_namn: s(fd.get("namn")), p_epost: s(fd.get("epost")) || "okand@westsura.se", p_telefon: s(fd.get("telefon")),
    p_personer: Number(s(fd.get("personer")) || 2), p_hundar: Number(s(fd.get("hundar")) || 0),
    p_frukost: !!fd.get("frukost"), p_kod: null, p_meddelande: s(fd.get("meddelande")) || null,
  });
  if (error) return { ok: false, fel: error.message };
  const rad = (data as { bokning_id: string; nummer: number }[])[0];
  // Bokningen finns redan; misslyckas märkningen blir den kvar som preliminär från webben.
  const { error: felMark } = await admin.from("bokning").update({ kalla: "admin", status: "bekraftad" }).eq("id", rad.bokning_id);
  if (felMark) console.error("kunde inte märka bokningen som admin/bekräftad", rad.nummer, felMark.message);
  revalidatePath("/admin/bokningar"); revalidatePath("/admin/kalender");
  return { ok: true, nummer: rad.nummer };
}

/* ---------- Blockeringar ---------- */
export async function skapaBlockering(fd: FormData) {
  const db = await supabaseServer();
  const enheter = s(fd.get("enheter")).split(",").map((x) => x.trim()).filter(Boolean);
  const rader = enheter.map((e) => ({ enhet_id: e, fran: s(fd.get("fran")), till: s(fd.get("till")), orsak: s(fd.get("orsak")) || null }));
  const { error } = await db.from("blockering").insert(rader);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/kalender");
  return { ok: true };
}
export async function taBortBlockering(id: string) {
  const db = await supabaseServer();
  const { error } = await db.from("blockering").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/kalender");
  return { ok: true };
}

/* ---------- Förfrågningar ---------- */
export async function uppdateraForfragan(id: string, status: string, anteckningar: string) {
  const db = await supabaseServer();
  const { error } = await db.from("forfragan").update({ status, anteckningar }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/forfragningar"); revalidatePath("/admin");
  return { ok: true };
}

/* ---------- Fakturering ---------- */
export type Fakturarad = { id?: string; beskrivning: string; antal: number; enhet: string; a_pris: number; moms: number };
type KundFaktura = { foretag?: string; orgnr?: string; adress?: string; referens?: string; epost?: string } | null;

const FRUKOST_PRIS = 95;

function kundFalt(namn: string, epost: string, telefon: string | null, f: KundFaktura) {
  return {
    kund_namn: namn, kund_foretag: f?.foretag || null, kund_orgnr: f?.orgnr || null, kund_adress: f?.adress || null,
    kund_referens: f?.referens || null, kund_epost: f?.epost || epost || null, kund_telefon: telefon || null,
  };
}

/** Underlag från en boendebokning: en rad per enhet, frukost, ev. rabatt — allt hämtat ur bokningen. */
export async function skapaUnderlagFranBokning(bokningId: string): Promise<{ ok: true; id: string } | { ok: false; fel: string }> {
  const db = await supabaseServer();
  const { data: b, error: felBokning } = await db.from("bokningar_admin").select("*").eq("id", bokningId).single();
  if (felBokning) return { ok: false, fel: felBokning.message };
  if (!b) return { ok: false, fel: "Bokningen hittades inte." };
  if (b.underlag_id) return { ok: true, id: b.underlag_id };
  const { data: rader, error: felRader } = await db.from("bokningsrad").select("natter, pris_per_natt, belopp, enhet:enhet_id(namn)").eq("bokning_id", bokningId);
  if (felRader) return { ok: false, fel: felRader.message };
  const natter = Math.max(1, Math.round((new Date(b.avresa).getTime() - new Date(b.ankomst).getTime()) / 86400000));
  const period = `${datumKort(b.ankomst)}–${datumKort(b.avresa)}`;
  const fr: Fakturarad[] = (rader ?? []).map((r) => {
    const e = r.enhet as unknown as { namn: string } | null;
    return { beskrivning: `${e?.namn ?? "Boende"}, ${period}`, antal: r.natter, enhet: "natt", a_pris: r.pris_per_natt, moms: 12 };
  });
  let delsumma = fr.reduce((a, r) => a + r.antal * r.a_pris, 0);
  if (b.frukost) { const n = b.antal_personer * natter; fr.push({ beskrivning: "Frukostkorg", antal: n, enhet: "st", a_pris: FRUKOST_PRIS, moms: 12 }); delsumma += n * FRUKOST_PRIS; }
  const rabatt = delsumma - b.summa;
  if (rabatt > 0) fr.push({ beskrivning: `Rabatt${b.rabattkod ? " (" + b.rabattkod + ")" : ""}`, antal: 1, enhet: "st", a_pris: -rabatt, moms: 12 });

  const { data: u, error } = await db.from("fakturaunderlag").insert({
    bokning_id: bokningId, rubrik: `Boende ${period}, bokning ${b.nummer}`,
    ...kundFalt(b.gast_namn, b.gast_epost, b.gast_telefon, b.faktura as KundFaktura),
    forfallodatum: forfallo(b.ankomst),
  }).select("id").single();
  if (error || !u) return { ok: false, fel: error?.message ?? "Kunde inte skapa underlag." };
  const { error: felInsert } = await db.from("fakturarad").insert(fr.map((r, i) => ({ ...r, underlag_id: u.id, ordning: i })));
  if (felInsert) return { ok: false, fel: felInsert.message };
  revalidatePath("/admin/fakturering"); revalidatePath("/admin/bokningar");
  return { ok: true, id: u.id };
}

/** Underlag från en förfrågan (event, konferens, jakt): rubrik och kund fylls i, raderna skriver ni själva. */
export async function skapaUnderlagFranForfragan(forfraganId: string): Promise<{ ok: true; id: string } | { ok: false; fel: string }> {
  const db = await supabaseServer();
  const { data: f, error: felForfragan } = await db.from("forfragan").select("*").eq("id", forfraganId).single();
  if (felForfragan) return { ok: false, fel: felForfragan.message };
  if (!f) return { ok: false, fel: "Förfrågan hittades inte." };
  const { data: finns, error: felFinns } = await db.from("fakturaunderlag").select("id").eq("forfragan_id", forfraganId).order("skapad", { ascending: false }).limit(1).maybeSingle();
  if (felFinns) return { ok: false, fel: felFinns.message };
  if (finns) return { ok: true, id: finns.id };
  const { data: u, error } = await db.from("fakturaunderlag").insert({
    forfragan_id: forfraganId, rubrik: `${f.typ}${f.onskat_datum ? ", " + f.onskat_datum : ""}, förfrågan ${f.nummer}`,
    ...kundFalt(f.namn, f.epost, f.telefon, f.faktura as KundFaktura),
    anteckning: f.antal_gaster ? `${f.antal_gaster} gäster` : null,
  }).select("id").single();
  if (error || !u) return { ok: false, fel: error?.message ?? "Kunde inte skapa underlag." };
  revalidatePath("/admin/fakturering"); revalidatePath("/admin/forfragningar");
  return { ok: true, id: u.id };
}

export async function skapaTomtUnderlag(): Promise<{ ok: true; id: string } | { ok: false; fel: string }> {
  const db = await supabaseServer();
  const { data: u, error } = await db.from("fakturaunderlag").insert({ rubrik: "Nytt underlag", kund_namn: "" }).select("id").single();
  if (error || !u) return { ok: false, fel: error?.message ?? "Kunde inte skapa underlag." };
  revalidatePath("/admin/fakturering");
  return { ok: true, id: u.id };
}

export async function sparaUnderlag(id: string, fd: FormData, rader: Fakturarad[]) {
  const db = await supabaseServer();
  const d = (k: string) => s(fd.get(k)) || null;
  const status = s(fd.get("status")) as "ej_fakturerad" | "fakturerad" | "betald" | "krediterad";
  const { error } = await db.from("fakturaunderlag").update({
    rubrik: s(fd.get("rubrik")) || "Underlag", kund_namn: s(fd.get("kund_namn")),
    kund_foretag: d("kund_foretag"), kund_orgnr: d("kund_orgnr"), kund_adress: d("kund_adress"), kund_referens: d("kund_referens"),
    kund_epost: d("kund_epost"), kund_telefon: d("kund_telefon"),
    status, fortnox_nummer: d("fortnox_nummer"), fakturerad: d("fakturerad"), forfallodatum: d("forfallodatum"), betald: d("betald"),
    anteckning: d("anteckning"),
  }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  const { error: felRensa } = await db.from("fakturarad").delete().eq("underlag_id", id);
  if (felRensa) return { ok: false, fel: felRensa.message };
  const rena = rader.filter((r) => r.beskrivning.trim()).map((r, i) => ({ underlag_id: id, ordning: i, beskrivning: r.beskrivning.trim(), antal: Number(r.antal) || 0, enhet: r.enhet || "st", a_pris: Number(r.a_pris) || 0, moms: Number(r.moms) || 0 }));
  if (rena.length) { const { error: e2 } = await db.from("fakturarad").insert(rena); if (e2) return { ok: false, fel: e2.message }; }
  revalidatePath("/admin/fakturering"); revalidatePath(`/admin/fakturering/${id}`); revalidatePath("/admin/bokningar"); revalidatePath("/admin");
  return { ok: true };
}

/** Bara ofakturerade underlag får tas bort — är det fakturerat finns en faktura i Fortnox. */
export async function taBortUnderlag(id: string) {
  const db = await supabaseServer();
  const { data: u, error: felUppslag } = await db.from("fakturaunderlag").select("status").eq("id", id).maybeSingle();
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!u) return { ok: false, fel: "Underlaget hittades inte." };
  if (u.status !== "ej_fakturerad") {
    return { ok: false, fel: `Underlaget har status ${FAKTURASTATUS[u.status]} och kan inte tas bort — det finns en faktura i Fortnox. Kreditera den i stället.` };
  }
  const { error } = await db.from("fakturaunderlag").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/fakturering"); revalidatePath("/admin/bokningar"); revalidatePath("/admin/jaktklubb");
  return { ok: true };
}

const datumKort = (d: string) => new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
/** Betalning senast 7 dagar före ankomst, dock aldrig bakåt i tiden. */
function forfallo(ankomst: string) {
  const d = new Date(ankomst); d.setDate(d.getDate() - 7);
  const min = new Date(); min.setDate(min.getDate() + 10);
  return (d < min ? min : d).toISOString().slice(0, 10);
}

/* ---------- Tillfällen ---------- */
export async function sparaTillfalle(fd: FormData) {
  const db = await supabaseServer();
  const rad = {
    typ: s(fd.get("typ")), titel: s(fd.get("titel")), beskrivning: s(fd.get("beskrivning")) || null,
    datum: s(fd.get("datum")), tid: s(fd.get("tid")) || null, platser: Number(s(fd.get("platser")) || 0),
    pris: s(fd.get("pris")) ? Number(s(fd.get("pris"))) : null, publicerad: !!fd.get("publicerad"),
    synlighet: s(fd.get("synlighet")) === "medlem" ? "medlem" : "publik",
    samling: s(fd.get("samling")) || null, program: s(fd.get("program")) || null,
  };
  const id = s(fd.get("id"));
  const { error } = id ? await db.from("tillfalle").update(rad).eq("id", id) : await db.from("tillfalle").insert(rad);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/tillfallen"); revalidatePath("/jakt"); revalidatePath("/jaktklubb/medlem/boka");
  return { ok: true };
}
export async function sattAnmalanStatus(id: string, status: string) {
  const db = await supabaseServer();
  const { error } = await db.from("anmalan").update({ status }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/tillfallen");
  return { ok: true };
}

/* ---------- Jaktklubben ---------- */
// Jaktadmin får läsa och skriva jaktmedlem och medlemsdokument genom RLS, men inte
// fakturaunderlag — den ytan hör till vardskap. Avgiftsunderlaget skapas därför med
// servicenyckeln, efter att kravAdmin("jaktadmin") har kontrollerat behörigheten.

const DOKUMENTTYPER = ["jaktkort", "id", "algskyttemarke"] as const;

/** Tar bort medlemmens filer ur den privata bucketen och raderar raderna. */
async function raderaMedlemsdokument(medlemId: string): Promise<string | null> {
  const adm = supabaseAdmin();
  const { data, error } = await adm.from("medlemsdokument").select("fil").eq("medlem_id", medlemId);
  if (error) return error.message;
  const filer = (data ?? []).map((d) => d.fil).filter(Boolean);
  if (filer.length) {
    const { error: felFiler } = await adm.storage.from("medlemsdokument").remove(filer);
    if (felFiler) return felFiler.message;
  }
  const { error: felRader } = await adm.from("medlemsdokument").delete().eq("medlem_id", medlemId);
  return felRader?.message ?? null;
}

function uppdateraJaktklubb(id?: string) {
  revalidatePath("/admin/jaktklubb");
  if (id) revalidatePath(`/admin/jaktklubb/${id}`);
  revalidatePath("/jaktklubb");
}

export async function godkannMedlem(id: string, nivaId: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();

  // Hela godkännandet sker i godkann_medlem, i en transaktion med medlemsraden låst.
  // Två samtidiga godkännanden kan därför inte skapa var sitt avgiftsunderlag.
  const { error } = await adm.rpc("godkann_medlem", { p_medlem: id, p_niva: nivaId });
  if (error) return { ok: false, fel: error.message };

  const { data: medlem, error: felMedlem } = await adm
    .from("jaktmedlem").select("namn, epost, jaktsasong(namn), medlemsniva!jaktmedlem_niva_id_fkey(namn, avgift)")
    .eq("id", id).single();
  if (felMedlem) return { ok: false, fel: felMedlem.message };

  const sasong = medlem.jaktsasong as unknown as { namn: string } | null;
  const niva = medlem.medlemsniva as unknown as { namn: string; avgift: number } | null;
  try {
    if (sasong && niva) await mejlMedlemGodkand({ epost: medlem.epost, namn: medlem.namn, sasong: sasong.namn, niva: niva.namn, avgift: niva.avgift });
  } catch (e) { console.error("mejl misslyckades", e); }
  uppdateraJaktklubb(id); revalidatePath("/admin/fakturering");
  return { ok: true };
}

export async function vantelistaMedlem(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { data: medlem, error: felMedlem } = await adm.from("jaktmedlem").select("namn, epost").eq("id", id).single();
  if (felMedlem) return { ok: false, fel: felMedlem.message };
  if (!medlem) return { ok: false, fel: "Medlemmen hittades inte." };
  const { error } = await adm.from("jaktmedlem").update({ status: "vantelista" }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  try { await mejlMedlemVantelista(medlem); } catch (e) { console.error("mejl misslyckades", e); }
  uppdateraJaktklubb(id);
  return { ok: true };
}

export async function avbojMedlem(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { data: medlem, error: felMedlem } = await adm.from("jaktmedlem").select("namn, epost").eq("id", id).single();
  if (felMedlem) return { ok: false, fel: felMedlem.message };
  if (!medlem) return { ok: false, fel: "Medlemmen hittades inte." };
  const { error } = await adm.from("jaktmedlem").update({ status: "avbojd" }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  const felDok = await raderaMedlemsdokument(id);
  if (felDok) return { ok: false, fel: `Ansökan är avböjd, men dokumenten kunde inte raderas: ${felDok}` };
  try { await mejlMedlemAvbojd(medlem); } catch (e) { console.error("mejl misslyckades", e); }
  uppdateraJaktklubb(id);
  return { ok: true };
}

export async function avslutaMedlemskap(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { error } = await adm.from("jaktmedlem").update({ status: "avslutad" }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  const felDok = await raderaMedlemsdokument(id);
  if (felDok) return { ok: false, fel: `Medlemskapet är avslutat, men dokumenten kunde inte raderas: ${felDok}` };
  uppdateraJaktklubb(id);
  return { ok: true };
}

export async function sparaMedlemsanteckning(id: string, anteckning: string) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { error } = await db.from("jaktmedlem").update({ anteckning: anteckning || null }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraJaktklubb(id);
  return { ok: true };
}

export async function sattKursGenomford(id: string, genomford: boolean) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { error } = await db.from("jaktmedlem").update({ kurs_genomford: genomford }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraJaktklubb(id);
  return { ok: true };
}

/* ---------- Granskning av medlemmarnas dokument ---------- */

const DOKUMENTNAMN: Record<string, string> = { jaktkort: "Statligt jaktkort", id: "ID-handling", algskyttemarke: "Älgskyttemärke" };

/** Kort länk till en kopia i den privata bucketen. Gäller i tio minuter. */
export async function signeradDokumentlank(dokumentId: string): Promise<{ ok: true; url: string } | { ok: false; fel: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { data: d, error: felUppslag } = await adm.from("medlemsdokument").select("fil").eq("id", dokumentId).maybeSingle();
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!d) return { ok: false, fel: "Dokumentet hittades inte." };
  const { data, error } = await adm.storage.from("medlemsdokument").createSignedUrl(d.fil, 600);
  if (error || !data) return { ok: false, fel: error?.message ?? "Kunde inte skapa länken." };
  return { ok: true, url: data.signedUrl };
}

export async function granskaDokument(dokumentId: string, godkand: boolean, giltigTill: string | null, kommentar: string | null): Promise<{ ok: boolean; fel?: string }> {
  const admin = await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();

  const { data: d, error: felUppslag } = await adm.from("medlemsdokument")
    .select("id, typ, medlem_id, jaktmedlem(namn, epost)").eq("id", dokumentId).maybeSingle();
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!d) return { ok: false, fel: "Dokumentet hittades inte." };
  if (godkand && d.typ === "jaktkort" && !giltigTill) return { ok: false, fel: "Jaktkortet behöver ett giltighetsdatum." };
  if (!godkand && !kommentar?.trim()) return { ok: false, fel: "Skriv en kommentar så medlemmen vet vad som behöver kompletteras." };

  const { error } = await adm.from("medlemsdokument").update({
    status: godkand ? "godkand" : "underkand",
    giltig_till: godkand ? giltigTill : null,
    kommentar: godkand ? null : kommentar!.trim(),
    granskad_av: admin.id, granskad: new Date().toISOString(),
  }).eq("id", dokumentId);
  if (error) return { ok: false, fel: error.message };

  const medlem = d.jaktmedlem as unknown as { namn: string; epost: string } | null;
  if (medlem) {
    try {
      await mejlDokumentstatus({ epost: medlem.epost, namn: medlem.namn, dokument: DOKUMENTNAMN[d.typ] ?? d.typ, godkand, giltigTill, kommentar });
    } catch (e) { console.error("mejl misslyckades", e); }

    // När den tredje handlingen blir godkänd är medlemmen klar för säsongen.
    if (godkand) {
      const { count, error: felRakning } = await adm.from("medlemsdokument")
        .select("id", { count: "exact", head: true }).eq("medlem_id", d.medlem_id).eq("status", "godkand");
      if (felRakning) console.error("kunde inte räkna godkända dokument", felRakning.message);
      else if (count === 3) {
        try { await mejlDokumentKlar({ epost: medlem.epost, namn: medlem.namn }); } catch (e) { console.error("mejl misslyckades", e); }
      }
    }
  }

  uppdateraJaktklubb(d.medlem_id);
  revalidatePath("/jaktklubb/medlem/medlemskap");
  return { ok: true };
}

/* ---------- Från herrgården ---------- */

export async function sparaKlubbmeddelande(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const rubrik = s(fd.get("rubrik")), text = s(fd.get("text"));
  if (!rubrik || !text) return { ok: false, fel: "Fyll i både rubrik och text." };
  const rad = {
    rubrik, text,
    datum: s(fd.get("datum")) || new Date().toISOString().slice(0, 10),
    publicerad: !!fd.get("publicerad"),
  };
  const id = s(fd.get("id"));
  const { error } = id
    ? await db.from("klubbmeddelande").update(rad).eq("id", id)
    : await db.from("klubbmeddelande").insert(rad);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/jaktklubb"); revalidatePath("/jaktklubb/medlem");
  return { ok: true };
}

export async function taBortKlubbmeddelande(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { error } = await db.from("klubbmeddelande").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/jaktklubb"); revalidatePath("/jaktklubb/medlem");
  return { ok: true };
}
