import { supabaseAdmin } from "@/lib/supabase";
import type { Sat, Pass, Deltagare, Skott, Plats } from "@/lib/avskjutning";

export type Jaktdag = {
  tillfalle: { id: string; titel: string; datum: string; tid: string | null; samling: string | null; program: string | null; typ: string; jaktledare_id: string | null; publicerad: boolean };
  jaktledare: { id: string; namn: string; telefon: string | null } | null;
  deltagare: Deltagare[];
  satar: Sat[];
  skott: Skott[];
  platser: Plats[];
};

/** Allt jaktledarvyn behöver för en jaktdag. Läses med servicenyckeln — behörigheten prövas av den som anropar. */
export async function hamtaJaktdag(tillfalleId: string): Promise<Jaktdag | null> {
  const adm = supabaseAdmin();
  const { data: t } = await adm.from("tillfalle").select("id, titel, datum, tid, samling, program, typ, jaktledare_id, publicerad").eq("id", tillfalleId).maybeSingle();
  if (!t) return null;

  const [{ data: anmalningar }, { data: satar }, { data: pass }, { data: skott }, { data: platser }, { data: jaktledare }] = await Promise.all([
    adm.from("anmalan").select("id, namn, epost, telefon, antal, status, meddelande, jagare_id").eq("tillfalle_id", tillfalleId).neq("status", "avbokad").order("skapad"),
    adm.from("sat").select("*").eq("tillfalle_id", tillfalleId).order("ordning"),
    adm.from("pass").select("*, sat!inner(tillfalle_id)").eq("sat.tillfalle_id", tillfalleId).order("ordning").order("nummer"),
    adm.from("skott").select("*").eq("tillfalle_id", tillfalleId).order("tid").order("skapad"),
    adm.from("vakomrade").select("id, namn, typ").eq("aktiv", true).order("ordning"),
    t.jaktledare_id ? adm.from("jaktmedlem").select("id, namn, telefon").eq("id", t.jaktledare_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  // Dokument och kurs per jägarkonto — så jaktledaren ser vem som är klar.
  const jagareIds = ((anmalningar ?? []) as { jagare_id: string | null }[]).map((a) => a.jagare_id).filter(Boolean) as string[];
  const [{ data: dokument }, { data: jagare }] = jagareIds.length
    ? await Promise.all([
        adm.from("medlemsdokument").select("medlem_id").in("medlem_id", jagareIds).eq("status", "godkand"),
        adm.from("jaktmedlem").select("id, status, kurs_godkand").in("id", jagareIds),
      ])
    : [{ data: [] }, { data: [] }];
  const dokAntal: Record<string, number> = {};
  for (const d of (dokument ?? []) as { medlem_id: string }[]) dokAntal[d.medlem_id] = (dokAntal[d.medlem_id] ?? 0) + 1;
  const konto: Record<string, { status: string; kurs_godkand: string | null }> = {};
  for (const j of (jagare ?? []) as { id: string; status: string; kurs_godkand: string | null }[]) konto[j.id] = j;

  const deltagare: Deltagare[] = ((anmalningar ?? []) as Omit<Deltagare, "jagare_status" | "dokument_ok" | "kurs_ok">[]).map((a) => ({
    ...a,
    jagare_status: a.jagare_id ? konto[a.jagare_id]?.status ?? null : null,
    dokument_ok: !!a.jagare_id && (dokAntal[a.jagare_id] ?? 0) >= 3,
    kurs_ok: !!a.jagare_id && !!konto[a.jagare_id]?.kurs_godkand,
  }));

  const passLista = (pass ?? []) as (Pass & { sat?: unknown })[];
  const satLista: Sat[] = ((satar ?? []) as Omit<Sat, "pass">[]).map((s) => ({
    ...s,
    pass: passLista.filter((p) => p.sat_id === s.id).map(({ sat: _sat, ...p }) => p),
  }));

  return {
    tillfalle: t,
    jaktledare: jaktledare ?? null,
    deltagare,
    satar: satLista,
    skott: (skott ?? []) as Skott[],
    platser: (platser ?? []) as Plats[],
  };
}
