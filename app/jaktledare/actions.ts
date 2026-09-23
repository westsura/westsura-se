"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { kravJaktledare } from "@/lib/jakt";
import { kravAdmin } from "@/lib/admin";
import { VILT, RESULTAT, KON, ALDER } from "@/lib/avskjutning";

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
type Svar = { ok: boolean; fel?: string };

function uppdatera(tillfalleId: string) {
  revalidatePath(`/admin/tillfallen/${tillfalleId}`); revalidatePath(`/jaktklubb/medlem/jaktledare/${tillfalleId}`);
  revalidatePath("/admin/tillfallen"); revalidatePath("/admin/jaktklubb/avskjutning"); revalidatePath("/jaktklubb/medlem");
}

/** Vilken jaktdag en såt hör till — för behörighetsprövningen. */
async function tillfalleForSat(satId: string) {
  const { data } = await supabaseAdmin().from("sat").select("tillfalle_id").eq("id", satId).maybeSingle();
  return data?.tillfalle_id as string | undefined;
}

/* ---------- Jaktledare (bara admin) ---------- */
export async function sattJaktledare(tillfalleId: string, medlemId: string): Promise<Svar> {
  await kravAdmin("jaktadmin");
  const { error } = await supabaseAdmin().from("tillfalle").update({ jaktledare_id: medlemId || null }).eq("id", tillfalleId);
  if (error) return { ok: false, fel: error.message };
  uppdatera(tillfalleId);
  return { ok: true };
}

/* ---------- Såtar ---------- */
export async function sparaSat(fd: FormData): Promise<Svar> {
  const tillfalleId = s(fd.get("tillfalle_id"));
  try { await kravJaktledare(tillfalleId); } catch (e) { return { ok: false, fel: (e as Error).message }; }
  const rad = { tillfalle_id: tillfalleId, namn: s(fd.get("namn")), beskrivning: s(fd.get("beskrivning")) || null, ordning: Number(s(fd.get("ordning")) || 0) };
  if (!rad.namn) return { ok: false, fel: "Såten behöver ett namn." };
  const id = s(fd.get("id"));
  const adm = supabaseAdmin();
  const { error } = id ? await adm.from("sat").update(rad).eq("id", id) : await adm.from("sat").insert(rad);
  if (error) return { ok: false, fel: error.message };
  uppdatera(tillfalleId);
  return { ok: true };
}

export async function taBortSat(id: string): Promise<Svar> {
  const tillfalleId = await tillfalleForSat(id);
  if (!tillfalleId) return { ok: false, fel: "Såten hittades inte." };
  try { await kravJaktledare(tillfalleId); } catch (e) { return { ok: false, fel: (e as Error).message }; }
  const { error } = await supabaseAdmin().from("sat").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdatera(tillfalleId);
  return { ok: true };
}

/* ---------- Pass ---------- */
export async function sparaPass(fd: FormData): Promise<Svar> {
  const satId = s(fd.get("sat_id"));
  const tillfalleId = await tillfalleForSat(satId);
  if (!tillfalleId) return { ok: false, fel: "Såten hittades inte." };
  try { await kravJaktledare(tillfalleId); } catch (e) { return { ok: false, fel: (e as Error).message }; }
  const rad = {
    sat_id: satId, nummer: s(fd.get("nummer")), plats_id: s(fd.get("plats_id")) || null,
    anmalan_id: s(fd.get("anmalan_id")) || null, anteckning: s(fd.get("anteckning")) || null, ordning: Number(s(fd.get("ordning")) || 0),
  };
  if (!rad.nummer) return { ok: false, fel: "Passet behöver ett nummer." };
  const id = s(fd.get("id"));
  const adm = supabaseAdmin();
  const { error } = id ? await adm.from("pass").update(rad).eq("id", id) : await adm.from("pass").insert(rad);
  if (error) return { ok: false, fel: error.code === "23505" ? "Det finns redan ett pass med det numret i såten." : error.message };
  uppdatera(tillfalleId);
  return { ok: true };
}

/** Snabbtilldelning: byt jägare på ett pass direkt i tabellen. */
export async function tilldelaPass(passId: string, anmalanId: string | null): Promise<Svar> {
  const adm = supabaseAdmin();
  const { data: p } = await adm.from("pass").select("sat_id").eq("id", passId).maybeSingle();
  const tillfalleId = p ? await tillfalleForSat(p.sat_id) : undefined;
  if (!tillfalleId) return { ok: false, fel: "Passet hittades inte." };
  try { await kravJaktledare(tillfalleId); } catch (e) { return { ok: false, fel: (e as Error).message }; }
  const { error } = await adm.from("pass").update({ anmalan_id: anmalanId || null }).eq("id", passId);
  if (error) return { ok: false, fel: error.message };
  uppdatera(tillfalleId);
  return { ok: true };
}

export async function taBortPass(id: string): Promise<Svar> {
  const adm = supabaseAdmin();
  const { data: p } = await adm.from("pass").select("sat_id").eq("id", id).maybeSingle();
  const tillfalleId = p ? await tillfalleForSat(p.sat_id) : undefined;
  if (!tillfalleId) return { ok: false, fel: "Passet hittades inte." };
  try { await kravJaktledare(tillfalleId); } catch (e) { return { ok: false, fel: (e as Error).message }; }
  const { error } = await adm.from("pass").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdatera(tillfalleId);
  return { ok: true };
}

/* ---------- Avskjutning ---------- */

/**
 * Registrerar ett skott. Från en drevjakt (tillfalle_id, ev. såt/pass) av jaktledaren,
 * eller från ett vak-/pyrschdygn (vakbokning_id) av admin, efter jägarens rapport.
 */
export async function sparaSkott(fd: FormData): Promise<Svar> {
  const tillfalleId = s(fd.get("tillfalle_id")) || null;
  const vakbokningId = s(fd.get("vakbokning_id")) || null;
  let registreradAv = "";
  if (tillfalleId) {
    try { registreradAv = (await kravJaktledare(tillfalleId)).namn; } catch (e) { return { ok: false, fel: (e as Error).message }; }
  } else if (vakbokningId) {
    const a = await kravAdmin("jaktadmin");
    registreradAv = a.namn ?? a.epost;
  } else return { ok: false, fel: "Skottet måste höra till en jaktdag eller ett vakdygn." };

  const vilt = s(fd.get("vilt")), resultat = s(fd.get("resultat")), kon = s(fd.get("kon")) || "okant", alder = s(fd.get("alder")) || "okant";
  if (!VILT[vilt]) return { ok: false, fel: "Välj viltslag." };
  if (!RESULTAT[resultat]) return { ok: false, fel: "Välj resultat." };
  if (!KON[kon] || !ALDER[alder]) return { ok: false, fel: "Ogiltigt kön eller ålder." };
  const datum = s(fd.get("datum"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return { ok: false, fel: "Ange datum." };

  const adm = supabaseAdmin();
  const { data: sasong } = await adm.from("jaktsasong").select("id, fran, till").lte("fran", datum).gte("till", datum).order("fran", { ascending: false }).limit(1).maybeSingle();
  const vikt = s(fd.get("vikt")).replace(",", ".");
  const rad = {
    sasong_id: sasong?.id ?? null, tillfalle_id: tillfalleId, vakbokning_id: vakbokningId,
    sat_id: s(fd.get("sat_id")) || null, pass_id: s(fd.get("pass_id")) || null,
    jagare_id: s(fd.get("jagare_id")) || null, jagare_namn: s(fd.get("jagare_namn")) || null,
    datum, tid: s(fd.get("tid")) || null, vilt, antal: Math.max(1, Number(s(fd.get("antal")) || 1)), kon, alder, resultat,
    vikt: vikt ? Number(vikt) : null, anteckning: s(fd.get("anteckning")) || null, registrerad_av: registreradAv,
  };
  const id = s(fd.get("id"));
  const { error } = id ? await adm.from("skott").update(rad).eq("id", id) : await adm.from("skott").insert(rad);
  if (error) return { ok: false, fel: error.message };
  if (tillfalleId) uppdatera(tillfalleId);
  revalidatePath("/admin/jaktklubb/vak"); revalidatePath("/admin/jaktklubb/avskjutning");
  return { ok: true };
}

export async function taBortSkott(id: string): Promise<Svar> {
  const adm = supabaseAdmin();
  const { data: sk } = await adm.from("skott").select("tillfalle_id").eq("id", id).maybeSingle();
  if (!sk) return { ok: false, fel: "Skottet hittades inte." };
  if (sk.tillfalle_id) {
    try { await kravJaktledare(sk.tillfalle_id); } catch (e) { return { ok: false, fel: (e as Error).message }; }
  } else await kravAdmin("jaktadmin");
  const { error } = await adm.from("skott").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  if (sk.tillfalle_id) uppdatera(sk.tillfalle_id);
  revalidatePath("/admin/jaktklubb/vak"); revalidatePath("/admin/jaktklubb/avskjutning");
  return { ok: true };
}
