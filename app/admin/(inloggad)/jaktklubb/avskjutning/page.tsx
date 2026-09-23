import Link from "next/link";
import { kravAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";
import { VILT, KON, ALDER, resultatKort, fallt, type Skott } from "@/lib/avskjutning";

export const dynamic = "force-dynamic";

type Rad = Skott & { tillfalle: { titel: string } | null; vakbokning: { typ: string } | null; jagare: { namn: string } | null };

/** Säsongens avskjutning: summering per viltslag och alla skott i ordning. */
export default async function Avskjutning({ searchParams }: { searchParams: Promise<{ sasong?: string }> }) {
  await kravAdmin("jaktadmin", "jaktledare");
  const adm = supabaseAdmin();
  const { sasong: valdId } = await searchParams;
  const { data: sasonger } = await adm.from("jaktsasong").select("id, namn, aktiv").order("fran", { ascending: false });
  const S = (sasonger ?? []) as { id: string; namn: string; aktiv: boolean }[];
  const sasong = S.find((s) => s.id === valdId) ?? S.find((s) => s.aktiv) ?? S[0];

  const { data } = sasong
    ? await adm.from("skott").select("*, tillfalle:tillfalle_id(titel), vakbokning:vakbokning_id(typ), jagare:jagare_id(namn)").eq("sasong_id", sasong.id).order("datum", { ascending: false }).order("tid", { ascending: false })
    : { data: [] };
  const skott = (data ?? []) as unknown as Rad[];

  // Summering: fällt / bom / påskjutet per viltslag, i den ordning VILT anger.
  const summa: Record<string, { fallt: number; bom: number; eftersok: number }> = {};
  for (const s of skott) {
    const rad = (summa[s.vilt] ??= { fallt: 0, bom: 0, eftersok: 0 });
    if (fallt(s)) rad.fallt += s.antal;
    else if (s.resultat === "bom") rad.bom += s.antal;
    else rad.eftersok += s.antal;
  }
  const viltslag = Object.keys(VILT).filter((v) => summa[v]);
  const totalFallt = viltslag.reduce((n, v) => n + summa[v].fallt, 0);

  return (
    <>
      <header className="admin__head">
        <div>
          <p className="label"><Link href="/admin/jaktklubb" style={{ textDecoration: "none" }}>Jaktklubben</Link> · Avskjutning</p>
          <h1 className="admin__h1">{sasong ? `säsong ${sasong.namn}` : "ingen säsong"}</h1>
        </div>
        <div className="admin__actions">
          {S.map((s) => <Link key={s.id} className={`btn btn--sm${s.id === sasong?.id ? "" : " btn--ghost"}`} href={`/admin/jaktklubb/avskjutning?sasong=${s.id}`}>{s.namn}</Link>)}
        </div>
      </header>

      <div className="admin__stats">
        <div className="stat"><b>{totalFallt}</b><span>Fällt vilt</span></div>
        <div className="stat"><b>{skott.reduce((n, s) => n + s.antal, 0)}</b><span>Skott</span></div>
        <div className="stat"><b>{skott.filter((s) => s.resultat === "paskjutet").length}</b><span>Pågående eftersök</span></div>
        <div className="stat"><b>{skott.filter((s) => s.resultat === "eftersok_ej_funnet").length}</b><span>Eftersök utan resultat</span></div>
      </div>

      <h2 className="admin__h2" style={{ marginTop: 32 }}>Per viltslag</h2>
      <div className="admin__panel">
        {!viltslag.length && <p className="empty">Inget registrerat den här säsongen.</p>}
        {!!viltslag.length && (
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Vilt</th><th className="num">Fällt</th><th className="num">Bom</th><th className="num">Påskjutet / eftersök</th></tr></thead>
              <tbody>
                {viltslag.map((v) => <tr key={v}><td><b>{VILT[v]}</b></td><td className="num">{summa[v].fallt}</td><td className="num">{summa[v].bom}</td><td className="num">{summa[v].eftersok}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="admin__h2" style={{ marginTop: 32 }}>Alla skott</h2>
      <p className="admin__meta" style={{ marginBottom: 12 }}>Ändra eller ta bort i jaktledarvyn för dagen, eller under Vak &amp; pyrsch för vakdygn.</p>
      <div className="admin__panel">
        {!skott.length && <p className="empty">Inga skott.</p>}
        {!!skott.length && (
          <div className="tablewrap">
            <table className="admin__table">
              <thead><tr><th>Datum</th><th>Jakt</th><th>Jägare</th><th>Vilt</th><th>Resultat</th><th>Anteckning</th><th>Registrerat av</th></tr></thead>
              <tbody>
                {skott.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.datum}</b>{s.tid && <div className="admin__meta">{s.tid}</div>}</td>
                    <td>{s.tillfalle ? <Link href={`/admin/tillfallen/${s.tillfalle_id}`}>{s.tillfalle.titel}</Link> : s.vakbokning ? <Link href="/admin/jaktklubb/vak">{s.vakbokning.typ === "vak" ? "Vak" : "Pyrsch"}</Link> : "—"}</td>
                    <td>{s.jagare?.namn ?? s.jagare_namn ?? "—"}</td>
                    <td><b>{VILT[s.vilt] ?? s.vilt}</b>{s.antal > 1 ? ` × ${s.antal}` : ""}<div className="admin__meta">{[s.kon !== "okant" && KON[s.kon], s.alder !== "okant" && ALDER[s.alder], s.vikt != null && `${s.vikt} kg`].filter(Boolean).join(" · ")}</div></td>
                    <td><span className={`pill pill--${fallt(s) ? "godkand" : s.resultat === "bom" ? "avbokad" : "inskickad"}`}>{resultatKort[s.resultat] ?? s.resultat}</span></td>
                    <td><small>{s.anteckning}</small></td>
                    <td><small>{s.registrerad_av}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
