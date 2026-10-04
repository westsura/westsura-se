import { NextResponse } from "next/server";
import { gallraJagarkonton } from "@/lib/gallring";

export const dynamic = "force-dynamic";

/**
 * Körs varje vecka av Vercel Cron (se vercel.json) och tar bort jägarkonton som
 * inte använts på två år. Är CRON_SECRET satt krävs den — annars kan anropet ändå
 * bara göra exakt det här, och samma konton tas bort oavsett vem som anropar.
 */
export async function GET(req: Request) {
  const hemlighet = process.env.CRON_SECRET;
  if (hemlighet && req.headers.get("authorization") !== `Bearer ${hemlighet}`) {
    return NextResponse.json({ fel: "Obehörig" }, { status: 401 });
  }
  const r = await gallraJagarkonton();
  if (r.fel.length) console.error("Gallring: fel", r.fel);
  return NextResponse.json(r);
}
