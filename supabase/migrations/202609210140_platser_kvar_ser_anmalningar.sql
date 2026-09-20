-- platser_kvar körde med anroparens rättigheter. anmalan är RLS-skyddad och har
-- ingen publik läspolicy, så för en besökare som inte är inloggad var summan av
-- anmälningarna alltid noll. tillfallen_publik.kvar visade därför fullt antal
-- platser på /jakt även när tillfället var fullbokat.
--
-- Funktionen blir security definer, som platser_kvar_niva. Den lämnar bara ut
-- ett antal, aldrig någon uppgift om vem som är anmäld.
--
-- Kroppen är oförändrad.

create or replace function platser_kvar(t uuid) returns integer
  language sql stable security definer set search_path to 'public'
as $$
  select tf.platser - coalesce((select sum(antal) from anmalan a where a.tillfalle_id = t and a.status in ('anmald','bekraftad')), 0)
  from tillfalle tf where tf.id = t;
$$;
