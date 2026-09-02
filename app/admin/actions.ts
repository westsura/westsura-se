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
