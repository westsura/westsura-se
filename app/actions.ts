"use server";

import { supabaseAdmin, supabasePublik } from "@/lib/supabase";
import { mejlBokning, mejlForfragan, mejlAnmalan } from "@/lib/epost";

export type Svar<T = undefined> = { ok: true; data: T } | { ok: false; fel: string };

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Frivilliga fakturauppgifter från formuläret, eller null om inget fyllts i. */
function fakturaFran(fd: FormData) {
  const f = { foretag: s(fd.get("faktura_foretag")), orgnr: s(fd.get("faktura_orgnr")), adress: s(fd.get("faktura_adress")), referens: s(fd.get("faktura_referens")), epost: s(fd.get("faktura_epost")) };
  return Object.values(f).some(Boolean) ? f : null;
}

/* ---------- Tillgänglighet och pris (publikt) ---------- */
export async function hamtaTillganglighet(ankomst: string, avresa: string): Promise<Svar<Record<string, boolean>>> {
  const db = supabasePublik();
  const { data, error } = await db.rpc("lediga_enheter", { fran: ankomst, till: avresa });
  if (error) return { ok: false, fel: error.message };
  const m: Record<string, boolean> = {};
  (data as { id: string; ledig: boolean }[]).forEach((r) => { m[r.id] = r.ledig; });
  return { ok: true, data: m };
}

export async function hamtaPris(enheter: string[], ankomst: string, avresa: string, frukost: boolean, personer: number, kod: string) {
  const db = supabasePublik();
  const { data, error } = await db.rpc("prisforslag", { enheter, fran: ankomst, till: avresa, frukost, personer, kod: kod || null });
  if (error) return { ok: false as const, fel: error.message };
  return { ok: true as const, data: data as { enhet_id: string; natter: number; pris_per_natt: number; belopp: number; frukost_belopp: number; rabatt: number; summa: number }[] };
}

/* ---------- Bokning ---------- */
export async function skapaBokning(fd: FormData): Promise<Svar<{ nummer: number; summa: number }>> {
  const enheter = s(fd.get("enheter")).split(",").filter(Boolean);
  const ankomst = s(fd.get("ankomst")), avresa = s(fd.get("avresa"));
  const namn = s(fd.get("namn")), epost = s(fd.get("epost")), telefon = s(fd.get("telefon"));
  if (!enheter.length) return { ok: false, fel: "Välj minst en enhet." };
  if (!namn || !epost.includes("@")) return { ok: false, fel: "Fyll i namn och en giltig e-postadress." };

  const db = supabaseAdmin();
  const { data, error } = await db.rpc("skapa_bokning", {
    p_enheter: enheter, p_ankomst: ankomst, p_avresa: avresa,
    p_namn: namn, p_epost: epost, p_telefon: telefon,
    p_personer: Number(s(fd.get("personer")) || 2), p_hundar: Number(s(fd.get("hundar")) || 0),
    p_frukost: s(fd.get("frukost")) === "1", p_kod: s(fd.get("kod")) || null, p_meddelande: s(fd.get("meddelande")) || null,
  });
  if (error) {
    const msg = /inte längre ledig/.test(error.message) ? "Någon hann före — en av enheterna är inte längre ledig för de valda datumen. Sök igen." : error.message;
    return { ok: false, fel: msg };
  }
  const rad = (data as { bokning_id: string; nummer: number; summa: number }[])[0];
  const faktura = fakturaFran(fd);
  if (faktura) await db.from("bokning").update({ faktura }).eq("id", rad.bokning_id);

  const { data: namnrader } = await db.from("enhet").select("id, namn").in("id", enheter);
  const namnlista = enheter.map((id) => namnrader?.find((r) => r.id === id)?.namn ?? id);
  try {
    await mejlBokning({ epost, namn, nummer: rad.nummer, ankomst, avresa, enheter: namnlista, summa: rad.summa, hundar: Number(s(fd.get("hundar")) || 0), frukost: s(fd.get("frukost")) === "1" });
  } catch (e) { console.error("mejl misslyckades", e); }
  return { ok: true, data: { nummer: rad.nummer, summa: rad.summa } };
}

/* ---------- Förfrågan ---------- */
export async function skapaForfragan(fd: FormData): Promise<Svar<{ nummer: number }>> {
  const namn = s(fd.get("namn")), epost = s(fd.get("epost")), typ = s(fd.get("typ"));
  if (!namn || !epost.includes("@") || !typ) return { ok: false, fel: "Fyll i typ, namn och en giltig e-postadress." };
  const db = supabaseAdmin();
  const { data, error } = await db.from("forfragan").insert({
    typ, onskat_datum: s(fd.get("datum")) || null, antal_gaster: s(fd.get("antal")) || null,
    hundar: !!fd.get("hund"), namn, telefon: s(fd.get("telefon")) || null, epost: epost.toLowerCase(),
    meddelande: s(fd.get("meddelande")) || null, faktura: fakturaFran(fd),
  }).select("nummer").single();
  if (error) return { ok: false, fel: error.message };
  try {
    await mejlForfragan({ epost, namn, typ, nummer: data.nummer, datum: s(fd.get("datum")), antal: s(fd.get("antal")), meddelande: s(fd.get("meddelande")), telefon: s(fd.get("telefon")) });
  } catch (e) { console.error("mejl misslyckades", e); }
  return { ok: true, data: { nummer: data.nummer } };
}

/* ---------- Anmälan till tillfälle ---------- */
export async function skapaAnmalan(fd: FormData): Promise<Svar<{ status: string }>> {
  const tillfalle = s(fd.get("tillfalle")), namn = s(fd.get("namn")), epost = s(fd.get("epost"));
  if (!tillfalle || !namn || !epost.includes("@")) return { ok: false, fel: "Fyll i namn och en giltig e-postadress." };
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("skapa_anmalan", {
    p_tillfalle: tillfalle, p_namn: namn, p_epost: epost, p_telefon: s(fd.get("telefon")) || null,
    p_antal: Number(s(fd.get("antal")) || 1), p_meddelande: s(fd.get("meddelande")) || null,
  });
  if (error) return { ok: false, fel: error.message };
  const rad = (data as { anmalan_id: string; status: string }[])[0];
  const { data: t } = await db.from("tillfalle").select("titel, datum").eq("id", tillfalle).single();
  try {
    await mejlAnmalan({ epost, namn, titel: t?.titel ?? "", datum: t?.datum ?? "", status: rad.status, antal: Number(s(fd.get("antal")) || 1) });
  } catch (e) { console.error("mejl misslyckades", e); }
  return { ok: true, data: { status: rad.status } };
}

/* ---------- Westsuras Vänner ---------- */
export async function anmalVan(fd: FormData): Promise<Svar> {
  const namn = s(fd.get("namn")), epost = s(fd.get("epost")).toLowerCase();
  if (!epost.includes("@")) return { ok: false, fel: "Ange en giltig e-postadress." };
  const db = supabaseAdmin();
  const { error } = await db.from("van").upsert({ namn: namn || null, epost, kalla: s(fd.get("kalla")) || "webb", avanmald_tid: null }, { onConflict: "epost" });
  if (error) return { ok: false, fel: error.message };
  return { ok: true, data: undefined };
}
