import { supabaseAdmin } from "@/lib/supabase";

/** Hur länge ett jägarkonto utan aktivitet sparas: gäster, hundekipage, avslutade och avböjda. */
export const GALLRA_EFTER_AR = 2;

/**
 * Tar bort jägarkonton som inte använts på GALLRA_EFTER_AR år — med uppladdade handlingar,
 * hundar, vakdygn och inloggning. Skott i avskjutningen och fakturaunderlag ligger kvar
 * (utan koppling till personen). Medlemmar i jaktlaget rörs aldrig.
 */
export async function gallraJagarkonton(): Promise<{ borttagna: number; fel: string[] }> {
  const adm = supabaseAdmin();
  const { data, error } = await adm.rpc("inaktiva_jagarkonton", { ar: GALLRA_EFTER_AR });
  if (error) return { borttagna: 0, fel: [error.message] };
  const fel: string[] = [];
  let borttagna = 0;
  for (const k of (data ?? []) as { id: string; epost: string; anvandare_id: string | null }[]) {
    const { data: dok } = await adm.from("medlemsdokument").select("fil").eq("medlem_id", k.id);
    const filer = (dok ?? []).map((d) => d.fil).filter(Boolean) as string[];
    if (filer.length) {
      const { error: felFiler } = await adm.storage.from("medlemsdokument").remove(filer);
      if (felFiler) { fel.push(`${k.epost}: ${felFiler.message}`); continue; }
    }
    const { error: felRad } = await adm.from("jaktmedlem").delete().eq("id", k.id);
    if (felRad) { fel.push(`${k.epost}: ${felRad.message}`); continue; }
    if (k.anvandare_id) {
      const { data: arAdmin } = await adm.from("admin_anvandare").select("id").eq("id", k.anvandare_id).maybeSingle();
      if (!arAdmin) await adm.auth.admin.deleteUser(k.anvandare_id);
    }
    borttagna++;
  }
  return { borttagna, fel };
}
