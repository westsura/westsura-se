"use server";

import { revalidatePath } from "next/cache";
import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Intern bokningshantering. Allt kräver behörigheten värdskap (Boende & bokningar).
 * Inga av dessa åtgärder skickar mejl till kunden.
 */

type Svar = { ok: boolean; fel?: string; id?: string; konflikter?: string[] };
const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const n = (v: FormDataEntryValue | null) => { const t = s(v); return t === "" ? null : Math.max(0, Math.round(Number(t))); };
const datumOk = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const dagFore = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };
const TYPER = ["boende", "konferens", "middag", "evenemang", "privat", "intern"];
const STATUSAR = ["forfragan", "preliminar", "bekraftad", "avbokad"];
const DELTYPER = ["konferens", "middag", "boende", "evenemang", "aktivitet", "intern"];
const reserverar = (status: string) => status === "preliminar" || status === "bekraftad";

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
  if (del) {
    const { error: felDel } = await db.from("arende_del").insert({ ...del, arende_id: data.id });
    if (felDel) return { ok: false, fel: `Bokningen sparades men inte tjänsten: ${felDel.message}`, id: data.id };
  }
  uppdatera(data.id);
  return { ok: true, id: data.id };
}

/** Ändrar uppgifterna på en bokning (kund, antal, anteckningar …). Skickar inget till kunden. */
export async function sparaArende(id: string, fd: FormData): Promise<Svar> {
  await kravAdmin("vardskap");
  const falt = arendeFalt(fd);
  const { error } = await supabaseAdmin().from("arende").update(falt).eq("id", id);
  if (error) return { ok: false, fel: error.message };
  uppdatera(id);
  return { ok: true };
}

const FORFRAGANSTATUS: Record<string, string> = { forfragan: "pagar", preliminar: "pagar", bekraftad: "bokad", avbokad: "avslutad" };

/** Byter status. Innan en bokning blir preliminär eller bekräftad kontrolleras att inget krockar. */
export async function sattArendestatus(id: string, status: string): Promise<Svar> {
  await kravAdmin("vardskap");
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
  uppdatera(id); revalidatePath("/admin/forfragningar");
  return { ok: true };
}

/** Lägger till eller ändrar en del (tjänst). Krockkontroll om bokningen reserverar. */
export async function sparaDel(arendeId: string, fd: FormData): Promise<Svar> {
  await kravAdmin("vardskap");
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
  const { error } = delId
    ? await db.from("arende_del").update(d.rad).eq("id", delId).eq("arende_id", arendeId)
    : await db.from("arende_del").insert({ ...d.rad, arende_id: arendeId });
  if (error) return { ok: false, fel: error.message };
  await db.from("arende").update({ uppdaterad: new Date().toISOString() }).eq("id", arendeId);
  uppdatera(arendeId);
  return { ok: true };
}

export async function taBortDel(arendeId: string, delId: string): Promise<Svar> {
  await kravAdmin("vardskap");
  const { error } = await supabaseAdmin().from("arende_del").delete().eq("id", delId).eq("arende_id", arendeId);
  if (error) return { ok: false, fel: error.message };
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
