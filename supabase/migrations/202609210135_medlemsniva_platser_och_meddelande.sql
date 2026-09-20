-- Två tillägg som publika /jaktklubb behöver.
--
-- 1) platser_kvar_niva: hur många platser som är kvar på en medlemsnivå.
--    Måste vara security definer. jaktmedlem är RLS-skyddad, och en besökare
--    som inte är inloggad ser inga rader alls — en funktion med anroparens
--    rättigheter hade därför alltid svarat "alla platser lediga".
--    Funktionen lämnar bara ut ett antal, aldrig någon uppgift om en medlem.
--
-- 2) jaktmedlem.meddelande: ansökningsformuläret har ett frivilligt
--    meddelandefält, men tabellen saknade plats för det. Det får inte ligga i
--    anteckning — den kolumnen är jaktklubbsadmins egna noteringar om den
--    sökande, på samma sätt som forfragan.anteckningar.

create or replace function platser_kvar_niva(niva uuid) returns integer
  language sql stable security definer set search_path to 'public'
as $$
  select (mn.platser - (select count(*) from jaktmedlem m where m.niva_id = mn.id and m.status = 'godkand'))::int
  from medlemsniva mn where mn.id = niva;
$$;

alter table jaktmedlem add column meddelande text;
