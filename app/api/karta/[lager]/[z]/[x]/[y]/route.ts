import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Kartplattor till jaktkartan, hämtade via servern så att inloggningsuppgifter till
 * Lantmäteriet aldrig når webbläsaren. Bara för inloggade (medlemmar, gäster, ekipage, admin).
 *
 *  topo — Lantmäteriets Topografisk webbkarta Visning, översiktlig (öppen data, CC BY).
 *  orto — flygfoto över jaktmarken (Lantmäteriets Ortofoto Nedladdning, våren 2026), färdigskurna
 *         plattor i mappen karta-orto/{z}/{x}/{y}.webp. Utanför marken finns inga plattor — då syns
 *         terrängkartan under. KARTA_ORTO_URL kan peka på en annan källa i stället.
 *
 * Kräver tjänsten inloggning läggs Geotorget-uppgifterna i LM_ANVANDARE och LM_LOSENORD.
 * Svarar Lantmäteriet inte används OpenStreetMap som reserv för terrängkartan.
 */
const MALLAR: Record<string, string | undefined> = {
  topo: process.env.KARTA_TOPO_URL || "https://maps.lantmateriet.se/open/topowebb-ccby/v1/wmts/1.0.0/topowebb/default/3857/{z}/{y}/{x}.png",
  orto: process.env.KARTA_ORTO_URL,
};
const RESERV = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const fyll = (mall: string, z: string, x: string, y: string) => mall.replace("{z}", z).replace("{x}", x).replace("{y}", y);

export async function GET(_req: Request, { params }: { params: Promise<{ lager: string; z: string; x: string; y: string }> }) {
  const { lager, z, x, y } = await params;
  if (![z, x, y].every((v) => /^\d+$/.test(v)) || Number(z) > 19) return new NextResponse("Ogiltig platta", { status: 400 });
  if (lager !== "topo" && lager !== "orto") return new NextResponse("Okänt lager", { status: 404 });

  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return new NextResponse("Logga in", { status: 401 });

  // Eget flygfoto: läses direkt från plattorna som följer med sajten.
  if (lager === "orto" && !MALLAR.orto) {
    try {
      const fil = await readFile(join(process.cwd(), "karta-orto", z, x, `${y}.webp`));
      return new NextResponse(new Uint8Array(fil), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=2592000" } });
    } catch {
      return new NextResponse(null, { status: 404, headers: { "Cache-Control": "private, max-age=86400" } });
    }
  }

  const mall = MALLAR[lager]!;
  const huvud: Record<string, string> = { "User-Agent": "westsura.se jaktkarta" };
  if (process.env.LM_ANVANDARE && process.env.LM_LOSENORD && mall.includes("lantmateriet")) {
    huvud.Authorization = "Basic " + Buffer.from(`${process.env.LM_ANVANDARE}:${process.env.LM_LOSENORD}`).toString("base64");
  }

  let svar = await fetch(fyll(mall, z, x, y), { headers: huvud, next: { revalidate: 60 * 60 * 24 * 30 } }).catch(() => null);
  let kalla = lager;
  if ((!svar || !svar.ok) && lager === "topo") {
    svar = await fetch(fyll(RESERV, z, x, y), { headers: huvud, next: { revalidate: 60 * 60 * 24 * 7 } }).catch(() => null);
    kalla = "osm";
  }
  if (!svar || !svar.ok) return new NextResponse("Plattan kunde inte hämtas", { status: 502 });

  return new NextResponse(await svar.arrayBuffer(), {
    headers: {
      "Content-Type": svar.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=2592000",
      "X-Kartkalla": kalla,
    },
  });
}
