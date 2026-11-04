import { NextResponse } from "next/server";
import { kravAdmin } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase";
import { ARENDETYP, ARENDESTATUS, DELTYP, tid, type Arende, type Del } from "@/lib/arende";

export const dynamic = "force-dynamic";

/** Bokningar som CSV (öppnas i Excel/Numbers): en rad per tjänst. ?fran=&till= begränsar datumen. */
export async function GET(req: Request) {
  await kravAdmin("vardskap");
  const u = new URL(req.url);
  const datum = (k: string) => { const v = u.searchParams.get(k) ?? ""; return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; };
  const fran = datum("fran") ?? new Date().toISOString().slice(0, 10), till = datum("till");
  const db = await supabaseServer();
  const [{ data: arenden }, { data: delar }, { data: webb }, { data: lokaler }, { data: enheter }] = await Promise.all([
    db.from("arende").select("*"),
    db.from("arende_del").select("*").order("fran").order("tid_fran"),
    db.from("bokningar_admin").select("nummer, status, ankomst, avresa, gast_namn, gast_telefon, gast_epost, antal_personer, enheter, summa, fakturastatus").gte("avresa", fran),
    db.from("lokal").select("id, namn"),
    db.from("enhet").select("id, namn"),
  ]);
  const namn = (l: string[], e: string[]) => [...l.map((x) => lokaler?.find((y) => y.id === x)?.namn ?? x), ...e.map((x) => enheter?.find((y) => y.id === x)?.namn ?? x)].join(", ");
  const inom = (d: string) => d >= fran && (!till || d <= till);
  const FAKT: Record<string, string> = { ej: "Ej fakturerad", fakturerad: "Fakturerad", betald: "Betald", ej_fakturerad: "Ej fakturerad" };

  const rader: (string | number | null)[][] = [["Nummer", "Status", "Typ", "Kund / rubrik", "Företag", "Telefon", "E-post", "Gäster", "Datum", "Till och med", "Från kl.", "Till kl.", "Tjänst", "Beskrivning", "Lokal / boende", "Antal", "Önskemål", "Faktura", "Källa"]];
  for (const a of (arenden ?? []) as Arende[]) {
    if (a.status === "avbokad" && u.searchParams.get("avbokade") !== "1") continue;
    const mina = ((delar ?? []) as Del[]).filter((d) => d.arende_id === a.id && inom(d.fran));
    for (const d of mina) rader.push([a.nummer, ARENDESTATUS[a.status], ARENDETYP[a.typ], a.kund_namn || a.rubrik, a.kund_foretag, a.kund_telefon, a.kund_epost, a.antal_gaster,
      d.fran, d.typ === "boende" ? d.till : d.till !== d.fran ? d.till : "", tid(d.tid_fran), tid(d.tid_till), DELTYP[d.typ], d.beskrivning, namn(d.lokal_ids, d.enhet_ids), d.antal, a.onskemal, FAKT[a.fakturastatus], a.forfragan_id ? "Förfrågan via sajten" : "Admin"]);
  }
  for (const b of (webb ?? []) as { nummer: number; status: string; ankomst: string; avresa: string; gast_namn: string; gast_telefon: string | null; gast_epost: string; antal_personer: number; enheter: string | null; summa: number; fakturastatus: string | null }[]) {
    if (b.status === "avbokad" && u.searchParams.get("avbokade") !== "1") continue;
    if (!inom(b.ankomst)) continue;
    rader.push([b.nummer, ARENDESTATUS[b.status] ?? b.status, "Boende", b.gast_namn, "", b.gast_telefon, b.gast_epost, b.antal_personer, b.ankomst, b.avresa, "", "", "Boende", `${b.summa} kr`, b.enheter, b.antal_personer, "", b.fakturastatus ? FAKT[b.fakturastatus] ?? b.fakturastatus : "", "Bokat på sajten"]);
  }
  rader.splice(1, rader.length - 1, ...rader.slice(1).sort((x, y) => String(x[8]).localeCompare(String(y[8]))));
  const cell = (v: string | number | null) => { const t = v == null ? "" : String(v); return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const csv = "﻿" + rader.map((r) => r.map(cell).join(";")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="westsura-bokningar-${fran}${till ? "-" + till : ""}.csv"` } });
}
