"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { kravAdmin } from "@/lib/admin";
import { mejlMedlemGodkand, mejlMedlemVantelista, mejlMedlemAvbojd, mejlDokumentstatus, mejlDokumentKlar, mejlVakSvar } from "@/lib/epost";
import { Resend } from "resend";
import { site } from "@/lib/site";
import { FAKTURASTATUS } from "@/lib/faktura";
import { sattLosenord, kollaLosenord, slumpaLosenord, authIdFor } from "@/lib/konto";

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/* ---------- Inloggning ---------- */
/** E-post + lösenord. Adressen måste vara inbjuden till admin. */
export async function loggaInAdmin(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  const epost = s(fd.get("epost")).toLowerCase(), losenord = s(fd.get("losenord"));
  if (!epost.includes("@") || !losenord) return { ok: false, fel: "Ange e-post och lösenord." };
  const admin = supabaseAdmin();
  const { data: inbjuden, error: felUppslag } = await admin.rpc("ar_inbjuden", { e: epost });
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!inbjuden) return { ok: false, fel: "Adressen har inte behörighet till admin. Be superadmin lägga till dig." };
  const db = await supabaseServer();
  const { error } = await db.auth.signInWithPassword({ email: epost, password: losenord });
  if (error) return { ok: false, fel: error.message.includes("Invalid login") ? "Fel e-post eller lösenord." : error.message };
  return { ok: true };
}

/** Glömt lösenord: en länk per mejl som leder till sidan där ett nytt sätts. */
export async function skickaInloggningslank(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  const epost = s(fd.get("epost")).toLowerCase();
  if (!epost.includes("@")) return { ok: false, fel: "Ange en e-postadress." };
  const admin = supabaseAdmin();
  const { data: inbjuden, error: felUppslag } = await admin.rpc("ar_inbjuden", { e: epost });
  if (felUppslag) return { ok: false, fel: felUppslag.message };
  if (!inbjuden) return { ok: false, fel: "Adressen har inte behörighet till admin. Be superadmin lägga till dig." };
  const db = await supabaseServer();
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  const { error } = await db.auth.signInWithOtp({ email: epost, options: { emailRedirectTo: `${bas}/admin/auth/callback?next=/admin/losenord`, shouldCreateUser: true } });
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}

/** Inloggad admin byter sitt eget lösenord. */
export async function bytLosenordAdmin(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin();
  const losenord = s(fd.get("losenord"));
  const fel = kollaLosenord(losenord);
  if (fel) return { ok: false, fel };
  if (losenord !== s(fd.get("losenord2"))) return { ok: false, fel: "Lösenorden stämmer inte överens." };
  const db = await supabaseServer();
  const { error } = await db.auth.updateUser({ password: losenord });
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}

/** Superadmin sätter lösenord åt en annan admin (t.ex. första gången). */
export async function sattAdminLosenord(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("superadmin");
  const epost = s(fd.get("epost")).toLowerCase(), losenord = s(fd.get("losenord"));
  const { data: inbjuden } = await supabaseAdmin().rpc("ar_inbjuden", { e: epost });
  if (!inbjuden) return { ok: false, fel: "Adressen är inte inbjuden till admin." };
  const r = await sattLosenord(epost, losenord);
  if (!r.ok) return r;
  revalidatePath("/admin/anvandare");
  return { ok: true };
}

/** Jaktadmin sätter lösenord åt en medlem eller gästjägare, och kopplar kontot. */
export async function sattMedlemsLosenord(medlemId: string, losenord: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { data: m } = await adm.from("jaktmedlem").select("epost, status").eq("id", medlemId).maybeSingle();
  if (!m) return { ok: false, fel: "Medlemmen hittades inte." };
  if (m.status !== "godkand" && m.status !== "gast") return { ok: false, fel: "Bara medlemmar och gästjägare kan logga in." };
  const r = await sattLosenord(m.epost, losenord);
  if (!r.ok) return r;
  await adm.from("jaktmedlem").update({ anvandare_id: r.id }).eq("id", medlemId);
  uppdateraJaktklubb(medlemId);
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
const BRICKA_PRIS = 249;

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
  // Paketbokning: paketet som en rad (moms 25 som utgångsläge — justeras i underlaget om paketet
  // ska delas upp på boende och aktivitet), och bara de nätter som betalas utöver paketet.
  const fr: Fakturarad[] = [];
  if (b.paket_id) fr.push({ beskrivning: `${b.paket_namn ?? "Paket"}, ${datumKort(b.ankomst)}`, antal: b.paket_personer ?? b.antal_personer, enhet: "pers", a_pris: b.paket_pris ?? 0, moms: 25 });
  for (const r of rader ?? []) {
    if (b.paket_id && !r.belopp) continue;
    const e = r.enhet as unknown as { namn: string } | null;
    fr.push({ beskrivning: `${e?.namn ?? "Boende"}, ${b.paket_id ? "extra nätter" : period}`, antal: r.natter, enhet: "natt", a_pris: r.pris_per_natt, moms: 12 });
  }
  let delsumma = fr.reduce((a, r) => a + r.antal * r.a_pris, 0);
  if (b.frukost && b.paket_id) {
    // I paket gäller frukosttillvalet bara de extra nätterna.
    const n = (b.paket_personer ?? b.antal_personer) * ((rader ?? [])[0]?.natter ?? 0);
    if (n > 0) { fr.push({ beskrivning: "Frukostkorg, extra nätter", antal: n, enhet: "st", a_pris: FRUKOST_PRIS, moms: 12 }); delsumma += n * FRUKOST_PRIS; }
  }
  if (b.frukost && !b.paket_id) { const n = b.antal_personer * natter; fr.push({ beskrivning: "Frukostkorg", antal: n, enhet: "st", a_pris: FRUKOST_PRIS, moms: 12 }); delsumma += n * FRUKOST_PRIS; }
  if (b.valkomstbricka) { const n = Math.max(1, b.antal_personer); fr.push({ beskrivning: "Västmanländsk välkomstbricka", antal: n, enhet: "st", a_pris: BRICKA_PRIS, moms: 12 }); delsumma += n * BRICKA_PRIS; }
  const rabatt = delsumma - b.summa;
  if (rabatt > 0) fr.push({ beskrivning: `Rabatt${b.rabattkod ? " (" + b.rabattkod + ")" : ""}`, antal: 1, enhet: "st", a_pris: -rabatt, moms: 12 });

  const { data: u, error } = await db.from("fakturaunderlag").insert({
    bokning_id: bokningId, rubrik: `${b.paket_id ? (b.paket_namn ?? "Paket") : "Boende"} ${period}, bokning ${b.nummer}`,
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

/* ---------- Säsonger och nivåer ---------- */
function uppdateraSasonger() {
  revalidatePath("/admin/jaktklubb"); revalidatePath("/admin/jaktklubb/sasonger"); revalidatePath("/jaktklubb"); revalidatePath("/jaktklubb/medlem");
}

export async function sparaSasong(fd: FormData) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const rad = { namn: s(fd.get("namn")), fran: s(fd.get("fran")), till: s(fd.get("till")), moms: Number(s(fd.get("moms")) || 0) };
  if (!rad.namn || !rad.fran || !rad.till) return { ok: false, fel: "Namn, från och till behövs." };
  if (rad.till <= rad.fran) return { ok: false, fel: "Slutdatum måste vara efter startdatum." };
  const id = s(fd.get("id"));
  const { data, error } = id
    ? await db.from("jaktsasong").update(rad).eq("id", id).select("id").single()
    : await db.from("jaktsasong").insert({ ...rad, aktiv: false }).select("id").single();
  if (error) return { ok: false, fel: error.message };
  uppdateraSasonger();
  return { ok: true, id: data?.id as string };
}

/** Bara en säsong är aktiv: den som visas publikt, som nya medlemmar hamnar i och som kursen räknar mot. */
export async function aktiveraSasong(id: string) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { error: e1 } = await db.from("jaktsasong").update({ aktiv: false }).neq("id", id);
  if (e1) return { ok: false, fel: e1.message };
  const { error: e2 } = await db.from("jaktsasong").update({ aktiv: true }).eq("id", id);
  if (e2) return { ok: false, fel: e2.message };
  uppdateraSasonger();
  return { ok: true };
}

export async function taBortSasong(id: string) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { count } = await db.from("jaktmedlem").select("id", { count: "exact", head: true }).eq("sasong_id", id);
  if (count) return { ok: false, fel: `Säsongen har ${count} medlemmar eller sökande och kan inte tas bort.` };
  const { error } = await db.from("jaktsasong").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraSasonger();
  return { ok: true };
}

export async function sparaNiva(fd: FormData) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const rad = {
    sasong_id: s(fd.get("sasong_id")), namn: s(fd.get("namn")), beskrivning: s(fd.get("beskrivning")) || null,
    avgift: Number(s(fd.get("avgift")) || 0), platser: Number(s(fd.get("platser")) || 0),
    bokning_oppnar: s(fd.get("bokning_oppnar")) || null, ordning: Number(s(fd.get("ordning")) || 0),
    // Vak & pyrsch: tomt = obegränsat antal ingående dygn.
    vakdygn_ingar: s(fd.get("vakdygn_ingar")) === "" ? null : Math.max(0, Number(s(fd.get("vakdygn_ingar")))),
    vakdygn_pris: Math.max(0, Number(s(fd.get("vakdygn_pris")) || 0)),
  };
  if (!rad.sasong_id || !rad.namn) return { ok: false, fel: "Nivån behöver ett namn." };
  const id = s(fd.get("id"));
  const { error } = id ? await db.from("medlemsniva").update(rad).eq("id", id) : await db.from("medlemsniva").insert(rad);
  if (error) return { ok: false, fel: error.message };
  uppdateraSasonger();
  return { ok: true };
}

export async function taBortNiva(id: string) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { count } = await db.from("jaktmedlem").select("id", { count: "exact", head: true }).or(`niva_id.eq.${id},onskad_niva_id.eq.${id}`);
  if (count) return { ok: false, fel: `Nivån används av ${count} medlemmar eller sökande och kan inte tas bort.` };
  const { error } = await db.from("medlemsniva").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraSasonger();
  return { ok: true };
}

/** Kopierar en säsongs nivåer till en annan — snabbaste sättet att lägga upp nästa år. */
export async function kopieraNivaer(franId: string, tillId: string) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { data: nivaer, error } = await db.from("medlemsniva").select("namn, beskrivning, avgift, platser, ordning, vakdygn_ingar, vakdygn_pris").eq("sasong_id", franId);
  if (error) return { ok: false, fel: error.message };
  if (!nivaer?.length) return { ok: false, fel: "Inga nivåer att kopiera." };
  const { error: e2 } = await db.from("medlemsniva").insert(nivaer.map((n) => ({ ...n, sasong_id: tillId })));
  if (e2) return { ok: false, fel: e2.message };
  uppdateraSasonger();
  return { ok: true };
}

/* ---------- Vak & pyrsch ---------- */
function uppdateraVak() {
  revalidatePath("/admin/jaktklubb/vak"); revalidatePath("/admin/jaktklubb"); revalidatePath("/jaktklubb/medlem/vak"); revalidatePath("/jakt");
}

/**
 * Jaktledarens svar på ett önskat dygn: bekräfta med område, eller avböj.
 * Ett bekräftat dygn med pris får ett fakturaunderlag direkt.
 */
export async function svaraVak(id: string, fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const beslut = s(fd.get("beslut"));
  const omradeId = s(fd.get("omrade")) || null;
  const svar = s(fd.get("svar")) || null;
  const pris = Math.max(0, Number(s(fd.get("pris")) || 0));

  const { data: b, error: felB } = await adm.from("vakbokning").select("*, jagare:jagare_id(namn, epost, telefon)").eq("id", id).maybeSingle();
  if (felB) return { ok: false, fel: felB.message };
  if (!b) return { ok: false, fel: "Bokningen hittades inte." };
  const jagare = b.jagare as unknown as { namn: string; epost: string; telefon: string | null };
  const typ = b.typ === "vak" ? "Vak" : "Pyrsch";

  if (beslut === "avboj") {
    const { error } = await adm.from("vakbokning").update({ status: "avbojd", svar }).eq("id", id);
    if (error) return { ok: false, fel: error.message };
    try { await mejlVakSvar({ epost: jagare.epost, namn: jagare.namn, datum: b.datum, typ, bekraftad: false, svar, pris: 0 }); } catch (e) { console.error("mejl misslyckades", e); }
    uppdateraVak();
    return { ok: true };
  }

  if (!omradeId) return { ok: false, fel: "Välj ett område att tilldela." };
  const { data: omrade } = await adm.from("vakomrade").select("namn, vagbeskrivning").eq("id", omradeId).maybeSingle();
  const { error } = await adm.from("vakbokning").update({ status: "bekraftad", omrade_id: omradeId, svar, pris }).eq("id", id);
  if (error) return { ok: false, fel: error.code === "23505" ? "Området är redan tilldelat någon annan det dygnet." : error.message };

  // Fakturaunderlag för dygn med pris — ett per bokning.
  if (pris > 0 && !b.underlag_id) {
    const { data: sasong } = await adm.from("jaktsasong").select("moms").eq("aktiv", true).maybeSingle();
    const { data: u, error: felU } = await adm.from("fakturaunderlag").insert({
      rubrik: `${typ} ${b.datum}, ${jagare.namn}`,
      ...kundFalt(jagare.namn, jagare.epost, jagare.telefon, null),
      anteckning: `Vak-/pyrschdygn ${b.datum}${omrade ? `, ${omrade.namn}` : ""}`,
    }).select("id").single();
    if (felU || !u) console.error("kunde inte skapa underlag för vakdygn", felU?.message);
    else {
      await adm.from("fakturarad").insert({ underlag_id: u.id, ordning: 0, beskrivning: `${typ} ${b.datum}${omrade ? `, ${omrade.namn}` : ""}`, antal: 1, enhet: "dygn", a_pris: pris, moms: sasong?.moms || 25 });
      await adm.from("vakbokning").update({ underlag_id: u.id }).eq("id", id);
      revalidatePath("/admin/fakturering");
    }
  }

  try {
    await mejlVakSvar({ epost: jagare.epost, namn: jagare.namn, datum: b.datum, typ, bekraftad: true, omrade: omrade?.namn ?? null, vagbeskrivning: omrade?.vagbeskrivning ?? null, svar, pris });
  } catch (e) { console.error("mejl misslyckades", e); }
  uppdateraVak();
  return { ok: true };
}

export async function avbokaVakAdmin(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { error } = await adm.from("vakbokning").update({ status: "avbokad" }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraVak();
  return { ok: true };
}

/**
 * Släpper ett dygn för vak/pyrsch. Alla dygn läggs ut av admin så att de inte
 * krockar med drevjakterna. Bara medlemmar, eller även gäster (då med pris).
 */
export async function sparaVakutbud(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const rad = {
    datum: s(fd.get("datum")), typ: s(fd.get("typ")) || "vak", omrade_id: s(fd.get("omrade_id")) || null,
    synlighet: s(fd.get("synlighet")) === "alla" ? "alla" : "medlem",
    pris: Math.max(0, Number(s(fd.get("pris")) || 0)), platser: Math.max(1, Number(s(fd.get("platser")) || 1)),
    beskrivning: s(fd.get("beskrivning")) || null, publicerad: !!fd.get("publicerad"),
  };
  if (!rad.datum) return { ok: false, fel: "Välj ett datum." };
  const id = s(fd.get("id"));
  const { error } = id ? await adm.from("vakutbud").update(rad).eq("id", id) : await adm.from("vakutbud").insert(rad);
  if (error) return { ok: false, fel: error.message };
  uppdateraVak();
  return { ok: true };
}

export async function taBortVakutbud(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { count } = await adm.from("vakbokning").select("id", { count: "exact", head: true }).eq("utbud_id", id).in("status", ["onskad", "bekraftad"]);
  if (count) return { ok: false, fel: "Dygnet har bokningar — avboka dem först." };
  const { error } = await adm.from("vakutbud").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraVak();
  return { ok: true };
}

export async function sparaVakomrade(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const tal = (k: string) => { const v = s(fd.get(k)).replace(",", "."); return v ? Number(v) : null; };
  const rad = {
    namn: s(fd.get("namn")), typ: s(fd.get("typ")) || "torn", beskrivning: s(fd.get("beskrivning")) || null,
    vagbeskrivning: s(fd.get("vagbeskrivning")) || null, nord: tal("nord"), ost: tal("ost"),
    aktiv: !!fd.get("aktiv"), ordning: Number(s(fd.get("ordning")) || 0),
  };
  if (!rad.namn) return { ok: false, fel: "Området behöver ett namn." };
  const id = s(fd.get("id"));
  const { error } = id ? await adm.from("vakomrade").update(rad).eq("id", id) : await adm.from("vakomrade").insert(rad);
  if (error) return { ok: false, fel: error.message };
  uppdateraVak();
  return { ok: true };
}

export async function taBortVakomrade(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { error } = await adm.from("vakomrade").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraVak();
  return { ok: true };
}

/* ---------- Säkerhetskurs ---------- */
export async function sparaKursinstallning(fd: FormData) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { error } = await db.from("kursinstallning").update({
    antal_fragor: Math.max(1, Number(s(fd.get("antal_fragor")) || 15)),
    godkant_procent: Math.min(100, Math.max(0, Number(s(fd.get("godkant_procent")) || 80))),
    giltighet: s(fd.get("giltighet")) || "sasong",
    ingress: s(fd.get("ingress")) || null,
  }).eq("id", 1);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/sakerhetskurs"); revalidatePath("/jaktklubb/medlem/sakerhetskurs");
  return { ok: true };
}

export async function sparaKursavsnitt(fd: FormData) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const rad = { rubrik: s(fd.get("rubrik")), text: s(fd.get("text")), ordning: Number(s(fd.get("ordning")) || 0), publicerad: !!fd.get("publicerad"), uppdaterad: new Date().toISOString() };
  if (!rad.rubrik || !rad.text) return { ok: false, fel: "Rubrik och text behövs." };
  const id = s(fd.get("id"));
  const { error } = id ? await db.from("kursavsnitt").update(rad).eq("id", id) : await db.from("kursavsnitt").insert(rad);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/sakerhetskurs"); revalidatePath("/jaktklubb/medlem/sakerhetskurs");
  return { ok: true };
}
export async function taBortKursavsnitt(id: string) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { error } = await db.from("kursavsnitt").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/sakerhetskurs"); revalidatePath("/jaktklubb/medlem/sakerhetskurs");
  return { ok: true };
}

export async function sparaKursfraga(fd: FormData) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const alternativ = [0, 1, 2, 3].map((i) => s(fd.get(`alt${i}`))).filter(Boolean);
  const ratt = Number(s(fd.get("ratt")) || 0);
  if (!s(fd.get("fraga")) || alternativ.length < 2) return { ok: false, fel: "Fråga och minst två svarsalternativ behövs." };
  if (ratt < 0 || ratt >= alternativ.length) return { ok: false, fel: "Markera vilket alternativ som är rätt." };
  const rad = {
    fraga: s(fd.get("fraga")), alternativ, ratt, kritisk: !!fd.get("kritisk"), forklaring: s(fd.get("forklaring")) || null,
    avsnitt_id: s(fd.get("avsnitt_id")) || null, ordning: Number(s(fd.get("ordning")) || 0), publicerad: !!fd.get("publicerad"), uppdaterad: new Date().toISOString(),
  };
  const id = s(fd.get("id"));
  const { error } = id ? await db.from("kursfraga").update(rad).eq("id", id) : await db.from("kursfraga").insert(rad);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/sakerhetskurs");
  return { ok: true };
}
export async function taBortKursfraga(id: string) {
  await kravAdmin("jaktadmin");
  const db = await supabaseServer();
  const { error } = await db.from("kursfraga").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/sakerhetskurs");
  return { ok: true };
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

  // Inloggningskonto: nytt konto får ett engångslösenord som följer med välkomstmejlet.
  // Fanns adressen redan (t.ex. som gästjägare) behålls lösenordet.
  let losenord: string | null = null;
  if (!(await authIdFor(medlem.epost))) {
    losenord = slumpaLosenord();
    const k = await sattLosenord(medlem.epost, losenord);
    if (k.ok) await adm.from("jaktmedlem").update({ anvandare_id: k.id }).eq("id", id);
    else { console.error("kunde inte skapa inloggning", k.fel); losenord = null; }
  }
  try {
    if (sasong && niva) await mejlMedlemGodkand({ epost: medlem.epost, namn: medlem.namn, sasong: sasong.namn, niva: niva.namn, avgift: niva.avgift, losenord });
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

/** Ändra kontaktuppgifter och nivå för en medlem, sökande eller gästjägare. Byts e-posten flyttas även inloggningen. */
export async function sparaJaktmedlem(id: string, fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { data: m } = await adm.from("jaktmedlem").select("epost, anvandare_id").eq("id", id).maybeSingle();
  if (!m) return { ok: false, fel: "Hittades inte." };
  const epost = s(fd.get("epost")).toLowerCase();
  if (!s(fd.get("namn")) || !epost.includes("@")) return { ok: false, fel: "Namn och en giltig e-post behövs." };
  const rad: Record<string, unknown> = {
    namn: s(fd.get("namn")), epost, telefon: s(fd.get("telefon")) || null, ort: s(fd.get("ort")) || null, hund: s(fd.get("hund")) || null,
  };
  if (fd.has("niva_id")) rad.niva_id = s(fd.get("niva_id")) || null;
  if (epost !== m.epost && m.anvandare_id) {
    const { error: felAuth } = await adm.auth.admin.updateUserById(m.anvandare_id, { email: epost, email_confirm: true });
    if (felAuth) return { ok: false, fel: `Inloggningen kunde inte flyttas till den nya adressen: ${felAuth.message}` };
  }
  const { error } = await adm.from("jaktmedlem").update(rad).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraJaktklubb(id);
  return { ok: true };
}

/**
 * Tar bort en medlem, sökande eller gästjägare helt: dokumentkopior, kursförsök och vakbokningar.
 * Anmälningar och skott ligger kvar (utan koppling) för historiken. Inloggningen tas bort om den inte också är admin.
 */
export async function taBortJaktmedlem(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("jaktadmin");
  const adm = supabaseAdmin();
  const { data: m } = await adm.from("jaktmedlem").select("anvandare_id").eq("id", id).maybeSingle();
  if (!m) return { ok: false, fel: "Hittades inte." };
  const felDok = await raderaMedlemsdokument(id);
  if (felDok) return { ok: false, fel: `Dokumenten kunde inte raderas: ${felDok}` };
  const { error } = await adm.from("jaktmedlem").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  if (m.anvandare_id) {
    const { data: arAdmin } = await adm.from("admin_anvandare").select("id").eq("id", m.anvandare_id).maybeSingle();
    if (!arAdmin) await adm.auth.admin.deleteUser(m.anvandare_id);
  }
  revalidatePath("/admin/jaktklubb");
  return { ok: true };
}

/* ---------- Westsuras Vänner ---------- */
export async function sparaVan(id: string, fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("kommunikation", "vardskap");
  const epost = s(fd.get("epost")).toLowerCase();
  if (!epost.includes("@")) return { ok: false, fel: "Ange en giltig e-postadress." };
  const { error } = await supabaseAdmin().from("van").update({ namn: s(fd.get("namn")) || null, epost }).eq("id", id);
  if (error) return { ok: false, fel: error.code === "23505" ? "Adressen finns redan i listan." : error.message };
  revalidatePath("/admin/vanner");
  return { ok: true };
}

export async function taBortVan(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("kommunikation", "vardskap");
  const { error } = await supabaseAdmin().from("van").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/vanner"); revalidatePath("/admin");
  return { ok: true };
}

/* ---------- Priser ---------- */
function uppdateraPriser() { revalidatePath("/admin/priser"); revalidatePath("/boende"); revalidatePath("/paket"); }

export async function sparaGrundpris(id: string, pris: number): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("vardskap");
  if (!Number.isFinite(pris) || pris < 0) return { ok: false, fel: "Ange ett pris i kronor." };
  const { error } = await supabaseAdmin().from("enhet").update({ grundpris: Math.round(pris) }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraPriser();
  return { ok: true };
}

export async function sparaPrissasong(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("vardskap");
  const rad = { namn: s(fd.get("namn")), fran: s(fd.get("fran")), till: s(fd.get("till")) };
  if (!rad.namn || !rad.fran || !rad.till) return { ok: false, fel: "Namn, från och till behövs." };
  if (rad.till < rad.fran) return { ok: false, fel: "Slutdatum måste vara efter startdatum." };
  const id = s(fd.get("id"));
  const adm = supabaseAdmin();
  const { error } = id ? await adm.from("sasong").update(rad).eq("id", id) : await adm.from("sasong").insert(rad);
  if (error) return { ok: false, fel: error.message };
  uppdateraPriser();
  return { ok: true };
}

export async function taBortPrissasong(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("vardskap");
  const { error } = await supabaseAdmin().from("sasong").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraPriser();
  return { ok: true };
}

/** En prisregel: fast nattpris eller procentuell justering, för ett rum eller alla, en säsong, vissa veckodagar eller ett datum. */
export async function sparaPrisregel(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("vardskap");
  const veckodagar = fd.getAll("veckodag").map((v) => Number(v)).filter((n) => n >= 0 && n <= 6);
  const rad = {
    namn: s(fd.get("namn")) || "Prisregel",
    enhet_id: s(fd.get("enhet_id")) || null,
    sasong_id: s(fd.get("sasong_id")) || null,
    veckodagar: veckodagar.length ? veckodagar : null,
    datum: s(fd.get("datum")) || null,
    typ: s(fd.get("typ")) === "procent" ? "procent" : "pris",
    varde: Math.round(Number(s(fd.get("varde")) || 0)),
    prioritet: Math.round(Number(s(fd.get("prioritet")) || 0)),
    aktiv: !!fd.get("aktiv"),
  };
  if (!rad.enhet_id && !rad.sasong_id && !rad.veckodagar && !rad.datum) return { ok: false, fel: "Välj minst ett villkor: rum, säsong, veckodagar eller datum." };
  if (rad.typ === "pris" && rad.varde <= 0) return { ok: false, fel: "Ange nattpriset i kronor." };
  const id = s(fd.get("id"));
  const adm = supabaseAdmin();
  const { error } = id ? await adm.from("prisregel").update(rad).eq("id", id) : await adm.from("prisregel").insert(rad);
  if (error) return { ok: false, fel: error.message };
  uppdateraPriser();
  return { ok: true };
}

export async function taBortPrisregel(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("vardskap");
  const { error } = await supabaseAdmin().from("prisregel").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraPriser();
  return { ok: true };
}

export async function hamtaPrisexempel(fran: string): Promise<{ ok: true; data: { enhet_id: string; datum: string; pris: number }[] } | { ok: false; fel: string }> {
  await kravAdmin("vardskap");
  const { data, error } = await supabaseAdmin().rpc("prisexempel", { fran, dagar: 14 });
  if (error) return { ok: false, fel: error.message };
  return { ok: true, data: data as { enhet_id: string; datum: string; pris: number }[] };
}

/* ---------- Tillfällen: ta bort ---------- */
/** Tar bort tillfället med dess anmälningar och såtar. Registrerade skott ligger kvar i avskjutningen. */
export async function taBortTillfalle(id: string): Promise<{ ok: boolean; fel?: string }> {
  await kravAdmin("vardskap", "jaktadmin");
  const { error } = await supabaseAdmin().from("tillfalle").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/tillfallen"); revalidatePath("/jakt"); revalidatePath("/jaktklubb/medlem/boka");
  return { ok: true };
}

/* ---------- Användare: ta bort ---------- */
export async function taBortAdmin(epost: string): Promise<{ ok: boolean; fel?: string }> {
  const jag = await kravAdmin("superadmin");
  const e = epost.toLowerCase();
  if (e === jag.epost.toLowerCase()) return { ok: false, fel: "Du kan inte ta bort dig själv." };
  const adm = supabaseAdmin();
  const { data: anv } = await adm.from("admin_anvandare").select("id").eq("epost", e).maybeSingle();
  if (anv) {
    await adm.from("medlemsdokument").update({ granskad_av: null }).eq("granskad_av", anv.id);
    const { error } = await adm.from("admin_anvandare").delete().eq("id", anv.id);
    if (error) return { ok: false, fel: error.message };
  }
  const { error } = await adm.from("admin_inbjudan").delete().eq("epost", e);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/anvandare");
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
  // Manuell markering — undantag. Sätter samma fält som ett godkänt prov, så att giltigheten räknas lika.
  const { data: inst } = await db.from("kursinstallning").select("version").eq("id", 1).maybeSingle();
  const { error } = await db.from("jaktmedlem").update(genomford
    ? { kurs_genomford: true, kurs_godkand: new Date().toISOString(), kurs_version: inst?.version ?? null }
    : { kurs_genomford: false, kurs_godkand: null, kurs_version: null }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdateraJaktklubb(id); revalidatePath("/admin/sakerhetskurs");
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
