"use server";

import { revalidatePath } from "next/cache";
import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { mejlFranAdmin } from "@/lib/epost";
import { fyllMall, valjMall, tjanstRad, SYFTE, type Mejlmall } from "@/lib/arendemejl";
import { ARENDESTATUS, ARENDETYP, type Arende, type Del } from "@/lib/arende";

/**
 * Intern bokningshantering. Allt kräver behörigheten värdskap (Boende & bokningar).
 * Ändringar och anteckningar skickar aldrig mejl. Mejl går bara ut när någon trycker
 * Skicka efter förhandsgranskning — eller när bokningen har mejlläget Automatiskt och
 * bekräftas (då står det i bekräftelsefrågan).
 */

type Svar = { ok: boolean; fel?: string; id?: string; konflikter?: string[]; mejlat?: boolean; foreslaMejl?: string };
const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const n = (v: FormDataEntryValue | null) => { const t = s(v); return t === "" ? null : Math.max(0, Math.round(Number(t))); };
const datumOk = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const dagFore = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };
const TYPER = ["boende", "konferens", "middag", "evenemang", "privat", "intern"];
const STATUSAR = ["forfragan", "preliminar", "bekraftad", "avbokad"];
const DELTYPER = ["konferens", "middag", "boende", "evenemang", "aktivitet", "intern"];
const reserverar = (status: string) => status === "preliminar" || status === "bekraftad";

/** Historik: en rad per ändring, med vem som gjorde den. */
async function logga(arendeId: string, text: string, vem?: string | null) {
  const { error } = await supabaseAdmin().from("arende_logg").insert({ arende_id: arendeId, text, vem: vem ?? null });
  if (error) console.error("kunde inte logga historik", error.message);
}
const vemAr = (a: { namn: string | null; epost: string }) => a.namn ?? a.epost;

/** Läsbar rad för en tjänst, med lokal- och boendenamn. */
async function tjanstText(d: Record<string, unknown>) {
  const db = supabaseAdmin();
  const [{ data: l }, { data: e }] = await Promise.all([db.from("lokal").select("id, namn"), db.from("enhet").select("id, namn")]);
  return tjanstRad(d as unknown as Del, (x) => l?.find((y) => y.id === x)?.namn ?? x, (x) => e?.find((y) => y.id === x)?.namn ?? x);
}

function uppdatera(id?: string) {
  revalidatePath("/admin/bokningar"); revalidatePath("/admin/kalender"); revalidatePath("/admin");
  if (id) revalidatePath(`/admin/bokningar/${id}`);
}

/** Fälten på själva bokningen (inte status). */
function arendeFalt(fd: FormData) {
  const typ = TYPER.includes(s(fd.get("typ"))) ? s(fd.get("typ")) : "privat";
  const svara = s(fd.get("svara_senast"));
  return {
    typ,
    rubrik: s(fd.get("rubrik")) || null,
    kund_namn: s(fd.get("kund_namn")) || null,
    kund_foretag: s(fd.get("kund_foretag")) || null,
    kund_epost: s(fd.get("kund_epost")).toLowerCase() || null,
    kund_telefon: s(fd.get("kund_telefon")) || null,
    antal_gaster: n(fd.get("antal_gaster")),
    svara_senast: datumOk(svara) ? svara : null,
    onskemal: s(fd.get("onskemal")) || null,
    anteckningar: s(fd.get("anteckningar")) || null,
  };
}

/** En del (tjänst) ur formuläret. Boende anges med ankomst/avresa och sparas som sista natt. */
function delFalt(fd: FormData): { fel: string } | { rad: Record<string, unknown> } {
  const typ = DELTYPER.includes(s(fd.get("del_typ"))) ? s(fd.get("del_typ")) : "konferens";
  const fran = s(fd.get("fran"));
  let till = s(fd.get("till")) || fran;
  if (!datumOk(fran)) return { fel: "Ange datum." };
  if (typ === "boende") {
    if (!datumOk(till) || till <= fran) return { fel: "Avresan måste vara efter ankomsten." };
    till = dagFore(till);
  } else if (!datumOk(till) || till < fran) return { fel: "Slutdatum kan inte vara före startdatum." };
  const tf = s(fd.get("tid_fran")), tt = s(fd.get("tid_till"));
  if (tf && tt && fran === till && tt <= tf) return { fel: "Sluttiden måste vara efter starttiden." };
  return {
    rad: {
      typ, fran, till, tid_fran: tf || null, tid_till: tt || null,
      enhet_ids: fd.getAll("enhet").map(String).filter(Boolean),
      lokal_ids: fd.getAll("lokal").map(String).filter(Boolean),
      antal: n(fd.get("antal")),
      beskrivning: s(fd.get("beskrivning")) || null,
      blockerar: fd.has("blockerar_finns") ? !!fd.get("blockerar") : true,
    },
  };
}

async function konflikter(arendeId: string | null, d: Record<string, unknown>): Promise<string[]> {
  const enheter = (d.enhet_ids as string[]) ?? [], lokaler = (d.lokal_ids as string[]) ?? [];
  if (!d.blockerar || (!enheter.length && !lokaler.length)) return [];
  const { data, error } = await supabaseAdmin().rpc("del_konflikter", {
    p_arende: arendeId, p_fran: d.fran, p_till: d.till, p_tid_fran: d.tid_fran, p_tid_till: d.tid_till, p_enheter: enheter, p_lokaler: lokaler,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as { beskrivning: string }[]).map((r) => r.beskrivning);
}

/** Ny bokning, förfrågan eller intern aktivitet — med en första del om datum är ifyllt. */
export async function skapaArende(fd: FormData): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  const db = supabaseAdmin();
  const falt = arendeFalt(fd);
  const status = falt.typ === "intern" ? "bekraftad" : STATUSAR.includes(s(fd.get("status"))) ? s(fd.get("status")) : "forfragan";
  if (falt.typ !== "intern" && !falt.kund_namn && !falt.kund_foretag) return { ok: false, fel: "Ange kundens namn eller företag." };
  if (falt.typ === "intern" && !falt.rubrik) return { ok: false, fel: "Ge aktiviteten en rubrik." };

  let del: Record<string, unknown> | null = null;
  if (s(fd.get("fran"))) {
    const d = delFalt(fd);
    if ("fel" in d) return { ok: false, fel: d.fel };
    del = d.rad;
    if (reserverar(status)) {
      const k = await konflikter(null, del);
      if (k.length) return { ok: false, fel: "Krockar med annan bokning — inget sparades.", konflikter: k };
    }
  }
  const { data, error } = await db.from("arende").insert({ ...falt, status, skapad_av: admin.id }).select("id").single();
  if (error || !data) return { ok: false, fel: error?.message ?? "Kunde inte spara." };
  await logga(data.id, falt.typ === "intern" ? "Aktiviteten lades in" : `Bokningen skapades som ${ARENDESTATUS[status].toLowerCase()}`, vemAr(admin));
  if (del) {
    const { error: felDel } = await db.from("arende_del").insert({ ...del, arende_id: data.id });
    if (felDel) return { ok: false, fel: `Bokningen sparades men inte tjänsten: ${felDel.message}`, id: data.id };
    await logga(data.id, `Tjänst tillagd: ${await tjanstText(del)}`, vemAr(admin));
  }
  uppdatera(data.id);
  return { ok: true, id: data.id };
}

/** Ändrar uppgifterna på en bokning (kund, antal, anteckningar …). Skickar inget till kunden. */
const FALTNAMN: Record<string, string> = {
  typ: "typ", rubrik: "rubrik", kund_namn: "kontaktperson", kund_foretag: "företag", kund_epost: "e-post", kund_telefon: "telefon",
  antal_gaster: "antal gäster", svara_senast: "sista svarsdatum", onskemal: "önskemål", anteckningar: "interna anteckningar",
};

export async function sparaArende(id: string, fd: FormData): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  const falt = arendeFalt(fd);
  const { data: fore } = await supabaseAdmin().from("arende").select("*").eq("id", id).maybeSingle();
  const { error } = await supabaseAdmin().from("arende").update(falt).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  if (fore) {
    const andrat = Object.entries(falt).filter(([k, v]) => (fore[k] ?? null) !== (v ?? null)).map(([k, v]) => {
      const kort = ["antal_gaster", "svara_senast", "typ"].includes(k);
      const visa = (x: unknown) => (k === "typ" ? ARENDETYP[String(x)] : x ?? "—");
      return kort ? `${FALTNAMN[k]} ${visa(fore[k])} → ${visa(v)}` : FALTNAMN[k];
    });
    if (andrat.length) await logga(id, `Ändrade ${andrat.join(", ")}`, vemAr(admin));
  }
  uppdatera(id);
  return { ok: true };
}

const FORFRAGANSTATUS: Record<string, string> = { forfragan: "pagar", preliminar: "pagar", bekraftad: "bokad", avbokad: "avslutad" };

/** Byter status. Innan en bokning blir preliminär eller bekräftad kontrolleras att inget krockar. */
export async function sattArendestatus(id: string, status: string): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  if (!STATUSAR.includes(status)) return { ok: false, fel: "Okänd status." };
  const db = supabaseAdmin();
  const { data: a } = await db.from("arende").select("id, status, forfragan_id").eq("id", id).maybeSingle();
  if (!a) return { ok: false, fel: "Bokningen hittades inte." };
  if (reserverar(status) && !reserverar(a.status)) {
    const { data: delar } = await db.from("arende_del").select("*").eq("arende_id", id);
    const alla: string[] = [];
    for (const d of delar ?? []) alla.push(...(await konflikter(id, d)));
    if (alla.length) return { ok: false, fel: "Kan inte reservera — det krockar med annan bokning.", konflikter: [...new Set(alla)] };
  }
  const { error } = await db.from("arende").update({ status }).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  // Den gamla förfrågningslistan hålls i takt så länge den finns kvar.
  if (a.forfragan_id) await db.from("forfragan").update({ status: FORFRAGANSTATUS[status] }).eq("id", a.forfragan_id);
  await logga(id, `Status: ${ARENDESTATUS[a.status]} → ${ARENDESTATUS[status]}`, vemAr(admin));
  uppdatera(id); revalidatePath("/admin/forfragningar");

  // Mejl: automatiskt bara vid bekräftelse och bara om bokningen har läget Automatiskt.
  const syfte = status === "bekraftad" ? "bekraftelse" : status === "preliminar" ? "preliminar" : status === "avbokad" ? "avbokning" : null;
  const { data: full } = await db.from("arende").select("*").eq("id", id).maybeSingle();
  if (!syfte || !full?.kund_epost || full.mejllage === "inget" || full.typ === "intern") return { ok: true };
  if (full.mejllage === "auto" && syfte === "bekraftelse") {
    const f = await mejlforslag(id, null, syfte);
    if (f) {
      const lyckat = await mejlFranAdmin(f);
      await db.from("arende_mejl").insert({ arende_id: id, syfte, till: f.till, amne: f.amne, text: f.text, ok: lyckat, auto: true, skickat_av: vemAr(admin) });
      await logga(id, `${lyckat ? "Mejl skickat automatiskt" : "Automatiskt mejl gick inte fram"}: ${f.amne} (till ${f.till})`, vemAr(admin));
      uppdatera(id);
      return { ok: true, mejlat: lyckat, fel: lyckat ? undefined : "Statusen är ändrad, men bekräftelsemejlet gick inte iväg." };
    }
  }
  return { ok: true, foreslaMejl: syfte };
}

/** Lägger till eller ändrar en del (tjänst). Krockkontroll om bokningen reserverar. */
export async function sparaDel(arendeId: string, fd: FormData): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  const db = supabaseAdmin();
  const d = delFalt(fd);
  if ("fel" in d) return { ok: false, fel: d.fel };
  const { data: a } = await db.from("arende").select("status").eq("id", arendeId).maybeSingle();
  if (!a) return { ok: false, fel: "Bokningen hittades inte." };
  if (reserverar(a.status)) {
    const k = await konflikter(arendeId, d.rad);
    if (k.length) return { ok: false, fel: "Krockar med annan bokning — inget sparades.", konflikter: k };
  }
  const delId = s(fd.get("del_id"));
  const { data: fore } = delId ? await db.from("arende_del").select("*").eq("id", delId).maybeSingle() : { data: null };
  const { error } = delId
    ? await db.from("arende_del").update(d.rad).eq("id", delId).eq("arende_id", arendeId)
    : await db.from("arende_del").insert({ ...d.rad, arende_id: arendeId });
  if (error) return { ok: false, fel: error.message };
  const ny = await tjanstText(d.rad);
  await logga(arendeId, fore ? `Tjänst ändrad: ${await tjanstText(fore)} → ${ny}` : `Tjänst tillagd: ${ny}`, vemAr(admin));
  uppdatera(arendeId);
  return { ok: true };
}

export async function taBortDel(arendeId: string, delId: string): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  const { data: fore } = await supabaseAdmin().from("arende_del").select("*").eq("id", delId).maybeSingle();
  const { error } = await supabaseAdmin().from("arende_del").delete().eq("id", delId).eq("arende_id", arendeId);
  if (error) return { ok: false, fel: error.message };
  if (fore) await logga(arendeId, `Tjänst borttagen: ${await tjanstText(fore)}`, vemAr(admin));
  uppdatera(arendeId);
  return { ok: true };
}

/** Tar bort en bokning helt. Den ursprungliga förfrågan från sajten finns kvar. */
export async function taBortArende(id: string): Promise<Svar> {
  await kravAdmin("vardskap");
  const { error } = await supabaseAdmin().from("arende").delete().eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdatera();
  return { ok: true };
}


/* ---------- Mejl till kunden ---------- */

/** Fyller i en mall (eller bästa mallen för syftet) med bokningens uppgifter. */
async function mejlforslag(arendeId: string, mallId: string | null, syfte?: string) {
  const db = supabaseAdmin();
  const [{ data: a }, { data: delar }, { data: lokaler }, { data: enheter }, { data: mallar }] = await Promise.all([
    db.from("arende").select("*").eq("id", arendeId).maybeSingle(),
    db.from("arende_del").select("*").eq("arende_id", arendeId).order("fran").order("tid_fran"),
    db.from("lokal").select("id, namn"),
    db.from("enhet").select("id, namn"),
    db.from("mejlmall").select("*").order("ordning"),
  ]);
  if (!a) return null;
  const M = (mallar ?? []) as Mejlmall[];
  const mall = mallId ? M.find((m) => m.id === mallId) : valjMall(M, syfte ?? "fritt", a.typ);
  if (!mall) return null;
  const ln = (x: string) => lokaler?.find((l) => l.id === x)?.namn ?? x;
  const en = (x: string) => enheter?.find((e) => e.id === x)?.namn ?? x;
  const fyll = (t: string) => fyllMall(t, a as Arende, (delar ?? []) as Del[], ln, en);
  return { mallId: mall.id, syfte: mall.syfte, till: a.kund_epost ?? "", amne: fyll(mall.amne), rubrik: fyll(mall.rubrik), text: fyll(mall.text) };
}

/** Förslag till mejl att granska och redigera innan det skickas. */
export async function forhandsgranskaMejl(arendeId: string, mallId: string | null, syfte?: string) {
  await kravAdmin("vardskap");
  return mejlforslag(arendeId, mallId, syfte);
}

/** Skickar ett granskat mejl till kunden och sparar det i bokningens logg. */
export async function skickaArendeMejl(arendeId: string, fd: FormData): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  const db = supabaseAdmin();
  const { data: a } = await db.from("arende").select("mejllage, typ").eq("id", arendeId).maybeSingle();
  if (!a) return { ok: false, fel: "Bokningen hittades inte." };
  if (a.mejllage === "inget") return { ok: false, fel: "Mejl är avstängt för den här bokningen. Ändra mejlläget först." };
  const till = s(fd.get("till")).toLowerCase(), amne = s(fd.get("amne")), rubrik = s(fd.get("rubrik")), text = s(fd.get("text"));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(till)) return { ok: false, fel: "Ange en giltig e-postadress." };
  if (!amne || !text) return { ok: false, fel: "Ämne och text behövs." };
  if (/\[(sista svarsdatum|inga tjänster inlagda)\]/.test(text)) return { ok: false, fel: "Texten innehåller fortfarande en markering inom [hakparenteser] — fyll i eller ta bort den först." };
  const syfte = s(fd.get("syfte")) || "fritt";
  const lyckat = await mejlFranAdmin({ till, amne, rubrik: rubrik || "Westsura Herrgård", text });
  await db.from("arende_mejl").insert({ arende_id: arendeId, syfte, till, amne, text, ok: lyckat, skickat_av: vemAr(admin) });
  await logga(arendeId, `${lyckat ? "Mejl skickat" : "Mejl gick inte fram"}: ${SYFTE[syfte] ?? syfte} — ${amne} (till ${till})`, vemAr(admin));
  uppdatera(arendeId);
  return lyckat ? { ok: true, mejlat: true } : { ok: false, fel: "Mejlet gick inte iväg. Det är sparat i loggen som misslyckat — försök igen om en stund." };
}

/** Automatiskt, manuellt (förhandsgranska) eller inga mejl för bokningen. */
export async function sattMejllage(arendeId: string, lage: string): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  if (!["auto", "manuell", "inget"].includes(lage)) return { ok: false, fel: "Okänt läge." };
  const { error } = await supabaseAdmin().from("arende").update({ mejllage: lage }).eq("id", arendeId);
  if (error) return { ok: false, fel: error.message };
  await logga(arendeId, `Mejlläge: ${{ auto: "automatiskt", manuell: "manuellt", inget: "inga mejl" }[lage]}`, vemAr(admin));
  uppdatera(arendeId);
  return { ok: true };
}

/** Ändrar en mejlmall. */
export async function sparaMejlmall(id: string, fd: FormData): Promise<Svar> {
  await kravAdmin("vardskap");
  const rad = { namn: s(fd.get("namn")), amne: s(fd.get("amne")), rubrik: s(fd.get("rubrik")), text: s(fd.get("text")), uppdaterad: new Date().toISOString() };
  if (!rad.namn || !rad.amne || !rad.rubrik || !rad.text) return { ok: false, fel: "Alla fält behöver fyllas i." };
  const { error } = await supabaseAdmin().from("mejlmall").update(rad).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  revalidatePath("/admin/bokningar/mallar");
  return { ok: true };
}

/* ---------- Uppgifter och påminnelser ---------- */

export async function skapaUppgift(fd: FormData): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  const text = s(fd.get("text")), forfallo = s(fd.get("forfallo")), arendeId = s(fd.get("arende_id")) || null;
  if (!text) return { ok: false, fel: "Skriv vad som ska göras." };
  const { error } = await supabaseAdmin().from("uppgift").insert({ text, forfallo: datumOk(forfallo) ? forfallo : null, arende_id: arendeId, skapad_av: admin.namn ?? admin.epost });
  if (error) return { ok: false, fel: error.message };
  if (arendeId) await logga(arendeId, `Uppgift tillagd: ${text}${datumOk(forfallo) ? ` (senast ${forfallo})` : ""}`, vemAr(admin));
  uppdatera(arendeId ?? undefined);
  return { ok: true };
}

export async function klarUppgift(id: string, klar: boolean): Promise<Svar> {
  const admin = await kravAdmin("vardskap");
  const { data, error } = await supabaseAdmin().from("uppgift").update({ klar, klar_tid: klar ? new Date().toISOString() : null }).eq("id", id).select("arende_id, text").maybeSingle();
  if (error) return { ok: false, fel: error.message };
  if (data?.arende_id) await logga(data.arende_id, `Uppgift ${klar ? "klar" : "öppnad igen"}: ${data.text}`, vemAr(admin));
  uppdatera(data?.arende_id ?? undefined);
  return { ok: true };
}

export async function taBortUppgift(id: string): Promise<Svar> {
  await kravAdmin("vardskap");
  const { data, error } = await supabaseAdmin().from("uppgift").delete().eq("id", id).select("arende_id").maybeSingle();
  if (error) return { ok: false, fel: error.message };
  uppdatera(data?.arende_id ?? undefined);
  return { ok: true };
}

/* ---------- Fakturering ---------- */

const FAKTURASTATUS: Record<string, string> = { ej: "ej fakturerad", fakturerad: "fakturerad", betald: "betald" };

export async function sattFakturastatus(arendeId: string, status: string): Promise<Svar> {
  const admin = await kravAdmin("vardskap", "ekonomi");
  if (!(status in FAKTURASTATUS)) return { ok: false, fel: "Okänd status." };
  const { error } = await supabaseAdmin().from("arende").update({ fakturastatus: status }).eq("id", arendeId);
  if (error) return { ok: false, fel: error.message };
  await logga(arendeId, `Fakturastatus: ${FAKTURASTATUS[status]}`, vemAr(admin));
  uppdatera(arendeId);
  return { ok: true };
}

/**
 * Skapar ett fakturaunderlag från bokningen: kunduppgifterna och en rad per tjänst.
 * Priserna fylls i under Fakturering (radernas pris är 0 tills dess).
 */
export async function skapaUnderlagFranArende(arendeId: string): Promise<Svar> {
  const admin = await kravAdmin("vardskap", "ekonomi");
  const db = supabaseAdmin();
  const { data: a } = await db.from("arende").select("*").eq("id", arendeId).maybeSingle();
  if (!a) return { ok: false, fel: "Bokningen hittades inte." };
  const { data: finns } = await db.from("fakturaunderlag").select("id").eq("arende_id", arendeId).limit(1).maybeSingle();
  if (finns) return { ok: true, id: finns.id };
  const { data: delar } = await db.from("arende_del").select("*").eq("arende_id", arendeId).order("fran").order("tid_fran");
  const { data: u, error } = await db.from("fakturaunderlag").insert({
    rubrik: `#${a.nummer} ${a.rubrik || ARENDETYP[a.typ]}${a.kund_foretag ? ", " + a.kund_foretag : ""}`,
    kund_namn: a.kund_namn || a.kund_foretag || "", kund_foretag: a.kund_foretag, kund_epost: a.kund_epost, kund_telefon: a.kund_telefon,
    arende_id: arendeId,
  }).select("id").single();
  if (error || !u) return { ok: false, fel: error?.message ?? "Kunde inte skapa underlaget." };
  // Moms: logi och mat 12 %, övrigt (lokalhyra, konferens, aktiviteter) 25 %. Kontrolleras i underlaget.
  const rader = await Promise.all(((delar ?? []) as Del[]).filter((d) => d.typ !== "intern").map(async (d, i) => ({
    underlag_id: u.id, ordning: i, beskrivning: await tjanstText(d as unknown as Record<string, unknown>),
    antal: d.antal || 1, enhet: d.typ === "boende" ? "natt" : "st", a_pris: 0, moms: d.typ === "boende" || d.typ === "middag" ? 12 : 25,
  })));
  if (rader.length) await db.from("fakturarad").insert(rader);
  await logga(arendeId, "Fakturaunderlag skapat", vemAr(admin));
  uppdatera(arendeId); revalidatePath("/admin/fakturering");
  return { ok: true, id: u.id };
}
