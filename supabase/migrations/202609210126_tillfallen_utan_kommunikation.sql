-- Tillfällen hör till värdskapet och jaktklubben, inte till kommunikation.
-- Rollen kommunikation tas bort ur policyerna på tillfalle och anmalan så att
-- de stämmer med menyposten och med kravAdmin på /admin/tillfallen.
-- Kommunikation behåller Vänner.

drop policy if exists "tillfalle admin" on tillfalle;
create policy "tillfalle admin" on tillfalle
  for all using (har_roll('vardskap') or har_roll('jaktadmin'));

drop policy if exists "anmalan admin" on anmalan;
create policy "anmalan admin" on anmalan
  for all using (har_roll('vardskap') or har_roll('jaktadmin'));
