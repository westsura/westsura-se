-- Godkännandet flyttas in i databasen så att det sker i en transaktion.
--
-- Tidigare låg det i server actionen: läs medlemmen, kontrollera status, skapa
-- underlag, skapa rad, uppdatera medlemmen. Mellan läsningen och uppdateringen
-- fanns ett glapp. Två samtidiga godkännanden av samma medlem — dubbelklick,
-- omladdning mitt i, två flikar — kunde båda läsa status 'sokande' och båda
-- skapa var sitt avgiftsunderlag. Misslyckades något steg efter att underlaget
-- skapats blev underlaget dessutom kvar utan medlem.
--
-- select ... for update låser medlemsraden. Det andra anropet får vänta, ser
-- sedan status 'godkand' och avbryter innan något underlag hinner skapas.
-- Allt eller inget: går någon del fel rullas hela godkännandet tillbaka.

create or replace function godkann_medlem(p_medlem uuid, p_niva uuid)
  returns table(underlag_id uuid, underlag_nummer integer)
  language plpgsql security definer set search_path to 'public'
as $$
declare m jaktmedlem; s jaktsasong; n medlemsniva; u_id uuid; u_nr integer;
begin
  select * into m from jaktmedlem where id = p_medlem for update;
  if not found then raise exception 'Medlemmen hittades inte'; end if;
  if m.status = 'godkand' then raise exception '% är redan godkänd', m.namn; end if;
  if m.underlag_id is not null then raise exception '% har redan ett avgiftsunderlag', m.namn; end if;

  select * into s from jaktsasong where aktiv;
  if not found then raise exception 'Ingen aktiv säsong'; end if;

  select * into n from medlemsniva where id = p_niva and sasong_id = s.id;
  if not found then raise exception 'Nivån hör inte till den aktiva säsongen'; end if;

  -- Fakturan görs för hand i Fortnox, numret förs in under Fakturering.
  insert into fakturaunderlag (rubrik, kund_namn, kund_epost, kund_telefon, forfallodatum)
  values ('Medlemsavgift jaktklubben säsong ' || s.namn, m.namn, m.epost, m.telefon, current_date + 30)
  returning id, nummer into u_id, u_nr;

  insert into fakturarad (underlag_id, ordning, beskrivning, antal, enhet, a_pris, moms)
  values (u_id, 0, 'Medlemsavgift jaktklubben ' || s.namn || ', ' || n.namn, 1, 'st', n.avgift, s.moms);

  update jaktmedlem set status = 'godkand', sasong_id = s.id, niva_id = n.id, underlag_id = u_id
  where id = p_medlem;

  return query select u_id, u_nr;
end $$;

-- Som skapa_anmalan och ar_jaktmedlem: bara servicenyckeln får anropa den.
revoke execute on function godkann_medlem(uuid, uuid) from public, anon, authenticated;
