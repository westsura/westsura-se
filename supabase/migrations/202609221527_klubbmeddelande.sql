-- Klubbens egna meddelanden: information, inbjudningar och hälsningar från
-- herrgården. Det senaste publicerade visas i kortet "Från herrgården" på
-- medlemmarnas översikt.
--
-- Ingen publik läspolicy. Meddelandena är klubbinterna och läses på servern med
-- servicenyckeln, på samma sätt som resten av medlemsdelen.

create table klubbmeddelande (
  id uuid primary key default gen_random_uuid(),
  rubrik text not null,
  text text not null,
  datum date not null default current_date,
  publicerad boolean not null default true,
  skapad timestamptz not null default now()
);

create index klubbmeddelande_datum_idx on klubbmeddelande (publicerad, datum desc);

alter table klubbmeddelande enable row level security;
create policy "jaktadmin klubbmeddelande" on klubbmeddelande for all using (har_roll('jaktadmin'));
