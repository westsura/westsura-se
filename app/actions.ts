"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabasePublik } from "@/lib/supabase";
import { mejlBokning, mejlForfragan, mejlAnmalan, mejlMedlemsansokan, mejlJagarkonto, mejlVakOnskad } from "@/lib/epost";
import { inloggningForNyttKonto } from "@/lib/konto";

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
  // Bokningen är redan skapad. Går de här stegen fel loggas det, men gästen får
  // inte se en genomförd bokning som ett misslyckande.
  if (faktura) {
    const { error: felFaktura } = await db.from("bokning").update({ faktura }).eq("id", rad.bokning_id);
    if (felFaktura) console.error("kunde inte spara fakturauppgifterna på bokningen", rad.nummer, felFaktura.message);
  }

  const { data: namnrader, error: felEnheter } = await db.from("enhet").select("id, namn").in("id", enheter);
  if (felEnheter) console.error("kunde inte hämta enhetsnamn till bokningsmejlet", felEnheter.message);
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

/* ---------- Medlemsansökan jaktklubben ---------- */
export async function skapaMedlemsansokan(fd: FormData): Promise<Svar> {
  const namn = s(fd.get("namn")), epost = s(fd.get("epost")).toLowerCase(), telefon = s(fd.get("telefon")), ort = s(fd.get("ort"));
  const jakterfarenhet = s(fd.get("jakterfarenhet")), hund = s(fd.get("hund")), meddelande = s(fd.get("meddelande"));
  if (!namn || !epost.includes("@")) return { ok: false, fel: "Fyll i namn och en giltig e-postadress." };
  if (!telefon) return { ok: false, fel: "Fyll i ett telefonnummer så vi kan ringa dig." };
  if (jakterfarenhet.length < 20) return { ok: false, fel: "Berätta lite mer om din jakterfarenhet — några meningar räcker." };

  const db = supabaseAdmin();
  const { data: sasong, error: felSasong } = await db.from("jaktsasong").select("id").eq("aktiv", true).maybeSingle();
  if (felSasong) return { ok: false, fel: felSasong.message };
  const { data: nivaer, error: felNivaer } = sasong
    ? await db.from("medlemsniva").select("id, namn").eq("sasong_id", sasong.id).order("ordning")
    : { data: null, error: null };
  if (felNivaer) return { ok: false, fel: felNivaer.message };
  if (!nivaer?.length) return { ok: false, fel: "Ansökan är stängd just nu. Ring oss så hjälper vi dig." };

  // Med en enda nivå i säsongen visar formuläret inget val — då är den nivån given.
  const vald = nivaer.length === 1 ? nivaer[0] : nivaer.find((n) => n.id === s(fd.get("onskad_niva")));
  if (!vald) return { ok: false, fel: "Välj vilken nivå du söker." };

  const { error } = await db.from("jaktmedlem").insert({
    namn, epost, telefon, ort: ort || null, jakterfarenhet, hund: hund || null,
    meddelande: meddelande || null, onskad_niva_id: vald.id,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, fel: "Det finns redan en ansökan med den adressen – ring oss om du vill ändra något." };
    return { ok: false, fel: error.message };
  }
  try {
    await mejlMedlemsansokan({ epost, namn, telefon, ort, jakterfarenhet, hund, meddelande, niva: vald.namn, flera: nivaer.length > 1 });
  } catch (e) { console.error("mejl misslyckades", e); }
  return { ok: true, data: undefined };
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
  // Anmälan är redan skapad — ett fel här får bara påverka mejlet.
  const { data: t, error: felTillfalle } = await db.from("tillfalle").select("titel, datum, typ").eq("id", tillfalle).single();
  if (felTillfalle) console.error("kunde inte hämta tillfället till anmälningsmejlet", felTillfalle.message);
  try {
    await mejlAnmalan({ epost, namn, titel: t?.titel ?? "", datum: t?.datum ?? "", status: rad.status, antal: Number(s(fd.get("antal")) || 1) });
  } catch (e) { console.error("mejl misslyckades", e); }

  // Jakt kräver jaktkort, ID och säkerhetskurs — så alla som anmäler sig till jakt får ett jägarkonto.
  if (t?.typ === "jakt") {
    const { data: konto, error: felKonto } = await db.rpc("jagarkonto_for", { p_namn: namn, p_epost: epost, p_telefon: s(fd.get("telefon")) || null });
    if (felKonto) console.error("kunde inte skapa jägarkonto", felKonto.message);
    const k = (konto as { id: string; status: string; ny: boolean }[] | null)?.[0];
    if (k) {
      await db.from("anmalan").update({ jagare_id: k.id }).eq("id", rad.anmalan_id);
      if (k.ny) {
        const losenord = await inloggningForNyttKonto(k.id, epost);
        try { await mejlJagarkonto({ epost, namn, titel: t?.titel ?? "", datum: t?.datum ?? "", losenord }); } catch (e) { console.error("mejl misslyckades", e); }
      }
    }
  }
  return { ok: true, data: { status: rad.status } };
}

/* ---------- Vak & pyrsch, utlagt dygn (publikt) ---------- */
/** Gäst bokar ett utlagt vak-/pyrschdygn. Skapar jägarkonto på samma sätt som anmälan till jaktdag. */
export async function bokaVakUtbud(fd: FormData): Promise<Svar<{ pris: number }>> {
  const utbudId = s(fd.get("utbud")), namn = s(fd.get("namn")), epost = s(fd.get("epost")).toLowerCase();
  if (!utbudId || !namn || !epost.includes("@")) return { ok: false, fel: "Fyll i namn och en giltig e-postadress." };
  const db = supabaseAdmin();
  const idag = new Date().toISOString().slice(0, 10);
  const { data: u, error: felU } = await db.from("vakutbud").select("id, datum, typ, pris, publicerad, synlighet").eq("id", utbudId).maybeSingle();
  if (felU) return { ok: false, fel: felU.message };
  if (!u || !u.publicerad || u.datum < idag || u.synlighet !== "alla") return { ok: false, fel: "Dygnet går inte att boka längre." };
  const { data: kvar } = await db.rpc("vakutbud_kvar", { u: utbudId });
  if (typeof kvar === "number" && kvar <= 0) return { ok: false, fel: "Dygnet är redan bokat." };

  const { data: konto, error: felKonto } = await db.rpc("jagarkonto_for", { p_namn: namn, p_epost: epost, p_telefon: s(fd.get("telefon")) || null });
  if (felKonto) return { ok: false, fel: felKonto.message };
  const k = (konto as { id: string; status: string; ny: boolean }[] | null)?.[0];
  if (!k) return { ok: false, fel: "Kunde inte skapa jägarkontot." };

  const { data: finns } = await db.from("vakbokning").select("id").eq("jagare_id", k.id).eq("datum", u.datum).in("status", ["onskad", "bekraftad"]).maybeSingle();
  if (finns) return { ok: false, fel: "Du har redan bokat det dygnet." };

  const typ = u.typ === "bada" ? (s(fd.get("typ")) === "pyrsch" ? "pyrsch" : "vak") : u.typ;
  const pris = k.status === "godkand" ? 0 : u.pris;
  const { data: sasong } = await db.from("jaktsasong").select("id").eq("aktiv", true).maybeSingle();
  const meddelande = s(fd.get("meddelande")) || null;
  const { error } = await db.from("vakbokning").insert({ jagare_id: k.id, utbud_id: utbudId, sasong_id: sasong?.id ?? null, datum: u.datum, typ, pris, meddelande });
  if (error) return { ok: false, fel: error.message };

  try {
    await mejlVakOnskad({ epost, namn, datum: u.datum, typ: typ === "vak" ? "Vak" : "Pyrsch", pris, meddelande, gast: k.status !== "godkand" });
    if (k.ny) {
      const losenord = await inloggningForNyttKonto(k.id, epost);
      await mejlJagarkonto({ epost, namn, titel: typ === "vak" ? "vak" : "pyrsch", datum: u.datum, losenord });
    }
  } catch (e) { console.error("mejl misslyckades", e); }
  revalidatePath("/jakt"); revalidatePath("/admin/jaktklubb/vak"); revalidatePath("/admin/jaktklubb");
  return { ok: true, data: { pris } };
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
