"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";
import { site } from "@/lib/site";

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/* ---------- Inloggning ---------- */
export async function skickaInloggningslank(fd: FormData): Promise<{ ok: boolean; fel?: string }> {
  const epost = s(fd.get("epost")).toLowerCase();
  if (!epost.includes("@")) return { ok: false, fel: "Ange en e-postadress." };
  const admin = supabaseAdmin();
  const { data: inbjuden } = await admin.rpc("ar_inbjuden", { e: epost });
  if (!inbjuden) return { ok: false, fel: "Adressen har inte behörighet till admin. Be superadmin lägga till dig." };
  const db = await supabaseServer();
  const bas = process.env.NEXT_PUBLIC_SITE_URL || site.url;
  const { error } = await db.auth.signInWithOtp({ email: epost, options: { emailRedirectTo: `${bas}/admin/auth/callback`, shouldCreateUser: true } });
  if (error) return { ok: false, fel: error.message };
  return { ok: true };
}

export async function loggaUt() {
  const db = await supabaseServer();
  await db.auth.signOut();
}

/* ---------- Bokningar ---------- */
export async function sattBokningsstatus(id: string, status: "preliminar" | "bekraftad" | "avbokad") {
  const db = await supabaseServer();
  const { error } = await db.from("bokning").update({ status }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  if (status === "bekraftad") {
    const { data: b } = await db.from("bokningar_admin").select("*").eq("id", id).single();
    if (b && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EPOST_FRAN || "Westsura Herrgård <boka@westsura.se>", to: [b.gast_epost],
          subject: `Bokning ${b.nummer} bekräftad — Westsura Herrgård`,
          html: `<p>Hej ${b.gast_namn},</p><p>Din bokning <strong>${b.nummer}</strong> är nu bekräftad: ${b.enheter}, ${b.ankomst} till ${b.avresa}. Summa ${b.summa.toLocaleString("sv-SE")} kr, betalning senast 7 dagar före ankomst.</p><p>Incheckning från kl. 15.00. Varmt välkomna!</p><p>${site.name} · ${site.phone}</p>`,
        });
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
  await admin.from("bokning").update({ kalla: "admin", status: "bekraftad" }).eq("id", rad.bokning_id);
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
  await db.from("blockering").delete().eq("id", id);
  revalidatePath("/admin/kalender");
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
  const { data: b } = await db.from("bokningar_admin").select("*").eq("id", bokningId).single();
  if (!b) return { ok: false, fel: "Bokningen hittades inte." };
  if (b.underlag_id) return { ok: true, id: b.underlag_id };
  const { data: rader } = await db.from("bokningsrad").select("natter, pris_per_natt, belopp, enhet:enhet_id(namn)").eq("bokning_id", bokningId);
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
  await db.from("fakturarad").insert(fr.map((r, i) => ({ ...r, underlag_id: u.id, ordning: i })));
  revalidatePath("/admin/fakturering"); revalidatePath("/admin/bokningar");
  return { ok: true, id: u.id };
}

/** Underlag från en förfrågan (event, konferens, jakt): rubrik och kund fylls i, raderna skriver ni själva. */
export async function skapaUnderlagFranForfragan(forfraganId: string): Promise<{ ok: true; id: string } | { ok: false; fel: string }> {
  const db = await supabaseServer();
  const { data: f } = await db.from("forfragan").select("*").eq("id", forfraganId).single();
  if (!f) return { ok: false, fel: "Förfrågan hittades inte." };
  const { data: finns } = await db.from("fakturaunderlag").select("id").eq("forfragan_id", forfraganId).order("skapad", { ascending: false }).limit(1).maybeSingle();
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
  await db.from("fakturarad").delete().eq("underlag_id", id);
  const rena = rader.filter((r) => r.beskrivning.trim()).map((r, i) => ({ underlag_id: id, ordning: i, beskrivning: r.beskrivning.trim(), antal: Number(r.antal) || 0, enhet: r.enhet || "st", a_pris: Number(r.a_pris) || 0, moms: Number(r.moms) || 0 }));
  if (rena.length) { const { error: e2 } = await db.from("fakturarad").insert(rena); if (e2) return { ok: false, fel: e2.message }; }
  revalidatePath("/admin/fakturering"); revalidatePath(`/admin/fakturering/${id}`); revalidatePath("/admin/bokningar"); revalidatePath("/admin");
  return { ok: true };
}

export async function taBortUnderlag(id: string) {
  const db = await supabaseServer();
  await db.from("fakturaunderlag").delete().eq("id", id);
  revalidatePath("/admin/fakturering"); revalidatePath("/admin/bokningar");
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
  };
  const id = s(fd.get("id"));
  const { error } = id ? await db.from("tillfalle").update(rad).eq("id", id) : await db.from("tillfalle").insert(rad);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/tillfallen"); revalidatePath("/jakt");
  return { ok: true };
}
export async function sattAnmalanStatus(id: string, status: string) {
  const db = await supabaseServer();
  await db.from("anmalan").update({ status }).eq("id", id);
  revalidatePath("/admin/tillfallen");
}
