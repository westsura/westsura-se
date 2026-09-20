-- ar_jaktmedlem fick standardrättigheter i förra migrationen och kunde därmed
-- anropas av vem som helst via /rest/v1/rpc/ar_jaktmedlem. Då går det att fråga
-- om en godtycklig adress är medlem i klubben, en adress i taget.
--
-- ar_inbjuden och skapa_anmalan är sedan tidigare stängda på samma sätt: bara
-- postgres och service_role får köra dem. Därför anropas de från server actions
-- med SUPABASE_SERVICE_ROLE_KEY (supabaseAdmin()), aldrig från den publika klienten.
-- ar_jaktmedlem ska följa samma mönster.

revoke execute on function ar_jaktmedlem(text) from public, anon, authenticated;

-- Triggerfunktionen ska heller inte ligga öppen i API:et. Den går inte att anropa
-- som RPC, men den hör inte hemma i den publika ytan.
revoke execute on function koppla_medlem_vid_inloggning() from public, anon, authenticated;
