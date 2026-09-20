-- Jaktklubbens datamodell: säsonger med en eller flera medlemsnivåer, medlemmar,
-- och de tre dokument varje medlem ska ha godkända före första jaktdag.
--
-- Säsong 2026/2027 har en enda nivå (Medlem, 15 000 kr, 20 platser). Från 2027/2028
-- införs det tredelade medlemskapet, därför ligger nivåerna i en egen tabell från början.
--
-- Tillfällen får en synlighet så att jaktklubbens egna jaktdagar kan ligga i samma
-- tabell som de publika utan att synas på sajten.

create type medlemsstatus as enum ('sokande','vantelista','godkand','avslutad','avbojd');
create type dokumenttyp as enum ('jaktkort','id','algskyttemarke');
create type dokumentstatus as enum ('inskickad','godkand','underkand');

/* ---------- Säsonger och nivåer ---------- */

create table jaktsasong (
  id uuid primary key default gen_random_uuid(),
  namn text not null,                 -- '2026/2027'
  fran date not null, till date not null,
  moms integer not null default 0,    -- moms på avgifterna, bekräftas med revisorn
  aktiv boolean not null default true -- exakt en aktiv säsong åt gången
);

-- Håller regeln ovan. Byte av säsong görs genom att först ta ner den gamla.
create unique index jaktsasong_en_aktiv on jaktsasong (aktiv) where aktiv;

-- En säsong har en eller flera medlemsnivåer. 2026/2027 har en; från 2027/2028 tre.
create table medlemsniva (
  id uuid primary key default gen_random_uuid(),
  sasong_id uuid not null references jaktsasong(id) on delete cascade,
  namn text not null,                 -- 'Medlem' i år; 'Kärnmedlem' / 'Jaktmedlem' / 'Associerad' nästa år
  beskrivning text,
  avgift integer not null,            -- inkl. ev. moms, som alla priser på sajten
  platser integer not null,
  bokning_oppnar date,                -- när nivån får boka jaktdagar (används från 2027/2028)
  ordning integer not null default 0
);

create index medlemsniva_sasong_idx on medlemsniva (sasong_id, ordning);

insert into jaktsasong (id, namn, fran, till) values ('00000000-0000-0000-0000-000000002627', '2026/2027', '2026-07-01', '2027-06-30');
insert into medlemsniva (sasong_id, namn, beskrivning, avgift, platser, ordning)
  values ('00000000-0000-0000-0000-000000002627', 'Medlem', 'Säsongens jaktdagar på herrgårdens marker, klubbens sammankomster, kartor, regler och dokument.', 15000, 20, 0);

/* ---------- Medlemmar ---------- */

create table jaktmedlem (
  id uuid primary key default gen_random_uuid(),
  anvandare_id uuid references auth.users(id),
  namn text not null, epost text not null unique, telefon text not null, ort text,
  jakterfarenhet text not null, hund text,
  status medlemsstatus not null default 'sokande',
  sasong_id uuid references jaktsasong(id),
  niva_id uuid references medlemsniva(id),   -- sätts vid godkännande; önskad nivå från ansökan om säsongen har flera
  onskad_niva_id uuid references medlemsniva(id),
  underlag_id uuid references fakturaunderlag(id),
  kurs_genomford boolean not null default false,  -- säkerhets- och skyttekursen för säsongen, sätts av admin
  anteckning text,
  skapad timestamptz not null default now(), uppdaterad timestamptz not null default now()
);

create index jaktmedlem_status_idx on jaktmedlem (status);
create index jaktmedlem_anvandare_idx on jaktmedlem (anvandare_id);

create trigger jaktmedlem_uppdaterad before update on jaktmedlem
  for each row execute function satt_uppdaterad();

create table medlemsdokument (
  id uuid primary key default gen_random_uuid(),
  medlem_id uuid not null references jaktmedlem(id) on delete cascade,
  typ dokumenttyp not null,
  fil text not null,                  -- sökväg i bucket medlemsdokument: <medlem_id>/<typ>.<ext>
  giltig_till date,                   -- krävs för jaktkort vid godkännande
  status dokumentstatus not null default 'inskickad',
  kommentar text,
  granskad_av uuid references admin_anvandare(id), granskad timestamptz,
  skapad timestamptz not null default now(),
  unique (medlem_id, typ)             -- ett aktuellt dokument per typ; ny uppladdning ersätter
);

/* ---------- Tillfällen: medlemmarnas egna jaktdagar ---------- */

alter table tillfalle add column synlighet text not null default 'publik' check (synlighet in ('publik','medlem'));
alter table tillfalle add column samling text;     -- t.ex. 'Samling vid herrgården'
alter table tillfalle add column program text;     -- rader som '07.00  Samling vid herrgården', en per rad

-- Samma vy som förut, med synlighet = 'publik' tillagt. Inget annat ändrat.
create or replace view tillfallen_publik with (security_invoker = true) as
  select id, typ, titel, beskrivning, datum, tid, pris, vanpris, platser, platser_kvar(id) as kvar
  from tillfalle
  where publicerad and synlighet = 'publik' and datum >= current_date
  order by datum;

/* ---------- Behörighet ---------- */

-- Som ar_inbjuden, fast för medlemsinloggningen på /jaktklubb/login.
create or replace function ar_jaktmedlem(e text) returns boolean
  language sql stable security definer set search_path to 'public'
as $$
  select exists (select 1 from jaktmedlem where lower(epost) = lower(e) and status = 'godkand');
$$;

-- Samma mönster som koppla_admin_vid_inloggning: när användaren skapas vid sin
-- första engångslänk knyts auth.users till raden i jaktmedlem.
create or replace function koppla_medlem_vid_inloggning() returns trigger
  language plpgsql security definer set search_path to 'public'
as $$
begin
  update jaktmedlem set anvandare_id = new.id
  where lower(epost) = lower(new.email) and anvandare_id is null;
  return new;
end $$;

create trigger auth_user_medlem after insert on auth.users
  for each row execute function koppla_medlem_vid_inloggning();

/* ---------- RLS ---------- */
-- Medlemmarnas egna skrivningar går via server actions med servicenyckeln.

alter table jaktsasong enable row level security;
create policy "jaktsasong publik" on jaktsasong for select using (true);
create policy "jaktadmin jaktsasong" on jaktsasong for all using (har_roll('jaktadmin'));

alter table medlemsniva enable row level security;
create policy "medlemsniva publik" on medlemsniva for select using (true);
create policy "jaktadmin medlemsniva" on medlemsniva for all using (har_roll('jaktadmin'));

alter table jaktmedlem enable row level security;
create policy "jaktadmin jaktmedlem" on jaktmedlem for all using (har_roll('jaktadmin'));
create policy "medlem ser sig själv" on jaktmedlem for select using (anvandare_id = auth.uid());

alter table medlemsdokument enable row level security;
create policy "jaktadmin medlemsdokument" on medlemsdokument for all using (har_roll('jaktadmin'));
create policy "medlem ser sina dokument" on medlemsdokument for select
  using (medlem_id in (select id from jaktmedlem where anvandare_id = auth.uid()));

/* ---------- Lagring ---------- */
-- Privat bucket. Inga policys för anon eller authenticated: all åtkomst går via
-- servicenyckeln i server actions, och admin får signerade länkar som gäller i 10 minuter.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medlemsdokument', 'medlemsdokument', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
