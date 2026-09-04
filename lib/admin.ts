import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

export type Roll = "superadmin" | "vardskap" | "kommunikation" | "jaktadmin" | "jaktledare";
export type Admin = { id: string; epost: string; namn: string | null; roller: Roll[] };

/** Hämtar inloggad admin, eller skickar till inloggningen. */
export async function kravAdmin(...roller: Roll[]): Promise<Admin> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data } = await db.from("admin_anvandare").select("id, epost, namn, roller").eq("id", user.id).maybeSingle();
  if (!data) redirect("/admin/login?fel=ingen-behorighet");
  const a = data as Admin;
  if (roller.length && !a.roller.includes("superadmin") && !roller.some((r) => a.roller.includes(r))) redirect("/admin?fel=roll");
  return a;
}

export const harRoll = (a: Admin, r: Roll) => a.roller.includes("superadmin") || a.roller.includes(r);

export const datum = (d: string | Date) => new Date(d).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
export const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

export const FAKTURASTATUS: Record<string, string> = { ej_fakturerad: "Att fakturera", fakturerad: "Fakturerad", betald: "Betald", krediterad: "Krediterad" };
