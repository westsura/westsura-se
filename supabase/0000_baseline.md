# Utgångsläge 21 september 2026

Schemat i Supabase-projektet `jfliehivpfwwommrkgtj` (Postgres 17.6, region eu-west-2) som det ser ut
innan fas 1 börjar. Avläst ur databasen, inte skrivet ur minnet. Allt ligger i schemat `public`.

Det här är inte en migration och körs inte. Den beskriver startpunkten; allt som händer efter den
ligger som filer i `migrations/`.

## Migrationer som redan körts

Sju migrationer ligger i `supabase_migrations.schema_migrations` från etapp I och II, körda innan
den här mappen fanns. De finns inte som filer i repot.

| Version | Namn |
| --- | --- |
| 20260902214338 | grund_bokning_och_admin |
| 20260902214418 | grunddata_enheter_priser_tillfallen |
| 20260902214455 | skapa_bokning_funktion |
| 20260902215012 | admin_inbjudan_och_bootstrap |
| 20260902215024 | vyer_security_invoker |
| 20260903211327 | fakturering |
| 20260903211349 | bokningar_admin_med_faktura |

## Enum-typer

| Typ | Värden |
| --- | --- |
| `roll` | `superadmin`, `vardskap`, `kommunikation`, `jaktadmin`, `jaktledare` |
| `bokningsstatus` | `preliminar`, `bekraftad`, `avbokad` |
| `forfragansstatus` | `ny`, `pagar`, `besvarad`, `bokad`, `avslutad` |
| `fakturastatus` | `ej_fakturerad`, `fakturerad`, `betald`, `krediterad` |
| `tillfalletyp` | `jakt`, `hundtraning`, `jaktkurs`, `evenemang` |
| `anmalanstatus` | `anmald`, `vantelista`, `bekraftad`, `avbokad` |

## Tabeller

RLS är påslagen på samtliga sexton tabeller. Radantalen är ungefärliga och från avläsningstillfället.

### Behörighet

**`admin_anvandare`** (1 rad) — en rad per inloggad administratör. `id` är samma uuid som i `auth.users`.

| Kolumn | Typ | Not |
| --- | --- | --- |
| `id` | uuid | primärnyckel, `references auth.users(id) on delete cascade` |
| `epost` | text | krävs, unik |
| `namn` | text | |
| `roller` | `roll[]` | krävs, standard `'{}'` |
| `skapad` | timestamptz | krävs, standard `now()` |

**`admin_inbjudan`** (2 rader) — adresser som får logga in i admin. Primärnyckel `epost`.

| Kolumn | Typ | Not |
| --- | --- | --- |
| `epost` | text | primärnyckel |
| `namn` | text | |
| `roller` | `roll[]` | krävs, standard `'{vardskap}'` |
| `skapad` | timestamptz | krävs, standard `now()` |

### Boende och bokning

**`enhet`** (9 rader) — rum, flyglar och hela boendet. `id` är text, inte uuid.

| Kolumn | Typ | Not |
| --- | --- | --- |
| `id` | text | primärnyckel |
| `namn` | text | krävs |
| `ordning` | integer | krävs, standard `0` |
| `ingar_i` | text | `references enhet(id)` — hierarkin |
| `ar_hela_boendet` | boolean | krävs, standard `false` |
| `baddar` | integer | krävs |
| `grundpris` | integer | krävs |
| `egenskaper` | text[] | krävs, standard `'{}'` |
| `beskrivning`, `notering`, `bild` | text | |
| `aktiv`, `bokningsbar` | boolean | krävs, standard `true` |

**`sasong`** (0 rader) — säsonger för **boendets prisregler**. Inte att blanda ihop med den
jaktsäsong som kommer i fas 1. Kolumner: `id` uuid pk, `namn` text, `fran` date, `till` date.
Villkor `till >= fran`.

**`prisregel`** (0 rader) — prissättning per enhet, säsong, veckodag eller datum.

| Kolumn | Typ | Not |
| --- | --- | --- |
| `id` | uuid | primärnyckel, `gen_random_uuid()` |
| `namn` | text | krävs |
| `enhet_id` | text | `references enhet(id)` |
| `sasong_id` | uuid | `references sasong(id) on delete cascade` |
| `veckodagar` | integer[] | 0–6, som `extract(dow ...)` |
| `datum` | date | |
| `typ` | text | krävs, `'pris'` eller `'procent'` |
| `varde` | integer | krävs |
| `prioritet` | integer | krävs, standard `0` |
| `aktiv` | boolean | krävs, standard `true` |

**`rabattkod`** (2 rader) — primärnyckel `kod`. `typ` är `'procent'` eller `'kronor'`,
`galler` är `'boende'`, `'hela'`, `'evenemang'` eller `'allt'` (standard `'boende'`).
Övrigt: `beskrivning`, `varde` integer krävs, `giltig_fran`, `giltig_till`, `max_antal`,
`antal_anvanda` (standard `0`), `minsta_belopp`, `aktiv` (standard `true`).

**`gast`** (0 rader) — `id` uuid pk, `namn` krävs, `epost` krävs, `telefon`, `skapad`.
Index `gast_lower_idx` på `lower(epost)`.

**`bokning`** (0 rader)

| Kolumn | Typ | Not |
| --- | --- | --- |
| `id` | uuid | primärnyckel, `gen_random_uuid()` |
| `nummer` | integer | krävs, `nextval('bokning_nummer_seq')` |
| `gast_id` | uuid | `references gast(id)` |
| `ankomst`, `avresa` | date | krävs, villkor `avresa > ankomst` |
| `antal_personer` | integer | krävs, standard `2` |
| `antal_hundar` | integer | krävs, standard `0` |
| `frukost` | boolean | krävs, standard `false` |
| `rabattkod` | text | `references rabattkod(kod)` |
| `status` | `bokningsstatus` | krävs, standard `preliminar` |
| `meddelande` | text | |
| `summa` | integer | krävs, standard `0` |
| `kalla` | text | krävs, standard `'webb'` |
| `skapad`, `uppdaterad` | timestamptz | krävs, standard `now()` |
| `faktura` | jsonb | frivilliga fakturauppgifter från formuläret |

**`bokningsrad`** (0 rader) — `id` uuid pk, `bokning_id` (`on delete cascade`), `enhet_id`,
`natter`, `pris_per_natt`, `belopp`, alla integer och krävs. Index på `enhet_id`.

**`blockering`** (0 rader) — `id` uuid pk, `enhet_id` `references enhet(id)`, `fran`, `till` date
med villkor `till > fran`, `orsak` text, `skapad`.

### Förfrågningar

**`forfragan`** (0 rader) — inkorgen för webbformulären.

| Kolumn | Typ | Not |
| --- | --- | --- |
| `id` | uuid | primärnyckel |
| `nummer` | integer | krävs, `nextval('forfragan_nummer_seq')` |
| `typ` | text | krävs — fritext, t.ex. "Medlemsansökan jaktklubben" |
| `onskat_datum`, `antal_gaster` | text | |
| `hundar` | boolean | krävs, standard `false` |
| `namn`, `epost` | text | krävs |
| `telefon`, `meddelande`, `anteckningar` | text | |
| `status` | `forfragansstatus` | krävs, standard `ny` |
| `skapad`, `uppdaterad` | timestamptz | krävs, standard `now()` |
| `faktura` | jsonb | |

### Tillfällen

**`tillfalle`** (8 rader) — jaktdagar, hundträning, kurser och evenemang.

| Kolumn | Typ | Not |
| --- | --- | --- |
| `id` | uuid | primärnyckel |
| `typ` | `tillfalletyp` | krävs |
| `titel` | text | krävs |
| `beskrivning` | text | |
| `datum` | date | krävs |
| `tid` | text | fritext, t.ex. "07.00–15.00" |
| `platser` | integer | krävs |
| `pris`, `vanpris` | integer | |
| `publicerad` | boolean | krävs, standard `true` |
| `skapad` | timestamptz | krävs, standard `now()` |

Ingen `uppdaterad`-kolumn och ingen uppdateringstrigger.

**`anmalan`** (0 rader) — `id` uuid pk, `tillfalle_id` `references tillfalle(id) on delete cascade`,
`namn` och `epost` krävs, `telefon`, `antal` integer krävs standard `1`, `meddelande`,
`status` `anmalanstatus` standard `anmald`, `skapad`. Ingen koppling till `auth.users` eller medlem —
kopplingen till en person är e-postadressen.

### Fakturering

**`fakturaunderlag`** (0 rader) — underlag som faktureras för hand i Fortnox.

| Kolumn | Typ | Not |
| --- | --- | --- |
| `id` | uuid | primärnyckel |
| `nummer` | integer | krävs, `nextval('fakturaunderlag_nummer_seq')` |
| `bokning_id` | uuid | `references bokning(id) on delete set null` |
| `forfragan_id` | uuid | `references forfragan(id) on delete set null` |
| `rubrik`, `kund_namn` | text | krävs |
| `kund_foretag`, `kund_orgnr`, `kund_adress`, `kund_referens`, `kund_epost`, `kund_telefon` | text | |
| `status` | `fakturastatus` | krävs, standard `ej_fakturerad` |
| `fortnox_nummer` | text | skrivs in för hand |
| `fakturerad`, `forfallodatum`, `betald` | date | |
| `anteckning` | text | |
| `skapad`, `uppdaterad` | timestamptz | krävs, standard `now()` |

Index på `bokning_id`, `forfragan_id` och `status`.

**`fakturarad`** (0 rader) — `id` uuid pk, `underlag_id` (`on delete cascade`, index),
`ordning` integer standard `0`, `beskrivning` text krävs, `antal` numeric(10,2) standard `1`,
`enhet` text standard `'st'`, `a_pris` numeric(12,2) standard `0`, `moms` integer standard `12`.

### Vänner

**`van`** (0 rader) — `id` uuid pk, `namn`, `epost` krävs och unik, `samtycke_tid` timestamptz
standard `now()`, `kalla` text standard `'webb'`, `avanmald_tid` timestamptz.

## Vyer

Alla fyra är `security_invoker = true`, alltså läses de med den anropande användarens behörighet
och RLS på underliggande tabeller gäller.

- **`enheter_publik`** — `enhet` där `aktiv and bokningsbar`, sorterad på `ordning`. Visar
  `id, namn, ordning, ingar_i, ar_hela_boendet, baddar, grundpris, egenskaper, beskrivning, notering, bild`.
- **`tillfallen_publik`** — `tillfalle` där `publicerad and datum >= current_date`, sorterad på datum.
  Visar `id, typ, titel, beskrivning, datum, tid, pris, vanpris, platser` och `platser_kvar(id) as kvar`.
  *(Får i fas 1.1 också villkoret `synlighet = 'publik'`.)*
- **`bokningar_admin`** — `bokning` med gästens namn, e-post och telefon, enheternas namn som
  sammanslagen sträng (`enheter`), enheternas id som array (`enhet_ids`), `faktura`, samt senaste
  fakturaunderlagets `underlag_id` och `fakturastatus`.
- **`fakturaunderlag_admin`** — `fakturaunderlag` med uträknad `summa` och `moms_belopp` ur
  `fakturarad`, plus `bokning_nummer` och `forfragan_nummer`.

## Funktioner och RPC:er

Utöver dessa finns funktionerna från tillägget `btree_gist` — de hör till tillägget, inte till sajten.

### Behörighet

- **`ar_admin() returns boolean`** — sql, stable, security definer, `search_path = public`.
  Sant om `auth.uid()` finns i `admin_anvandare`.
- **`har_roll(r roll) returns boolean`** — sql, stable, security definer.
  Sant om den inloggade har rollen `r` **eller** `superadmin`. Används i nästan alla RLS-policys.
- **`ar_inbjuden(e text) returns boolean`** — sql, stable, security definer.
  Sant om adressen finns i `admin_inbjudan` eller `admin_anvandare`, skiftlägesokänsligt.
  *(Mönstret som `ar_jaktmedlem` i fas 1.1 ska följa.)*

### Bokningsmotorn — rör inte

- **`krockande_enheter(e text) returns setof text`** — rekursivt uppåt och nedåt i `enhet.ingar_i`,
  plus hela boendet. Vilka enheter som blockeras när `e` bokas.
- **`enhet_ledig(e text, fran date, till date) returns boolean`** — ingen bokningsrad och ingen
  blockering som överlappar på någon krockande enhet.
- **`lediga_enheter(fran date, till date) returns table(id text, ledig boolean)`** — alla aktiva enheter.
- **`pris_for_natt(e text, d date) returns integer`** — bästa träffande prisregel, annars `grundpris`.
  Sorteringen är datum före veckodag före säsong, därefter `prioritet`.
- **`pris_for_period(e text, fran date, till date) returns integer`** — summan av nätterna.
- **`prisforslag(enheter text[], fran date, till date, frukost boolean, personer integer, kod text)`**
  — plpgsql, stable. Rad per enhet med `natter, pris_per_natt, belopp, frukost_belopp, rabatt, summa`.
  Frukost är 95 kr per person och natt.
- **`skapa_bokning(p_enheter text[], p_ankomst date, p_avresa date, p_namn text, p_epost text, p_telefon text, p_personer integer, p_hundar integer, p_frukost boolean, p_kod text, p_meddelande text)`**
  — plpgsql, security definer. Tar `pg_advisory_xact_lock`, kontrollerar ledighet, skapar `gast`,
  `bokning` och `bokningsrad`, räknar rabatt och returnerar `bokning_id, nummer, summa`.

### Tillfällen

- **`platser_kvar(t uuid) returns integer`** — `tillfalle.platser` minus summan av `antal` på
  anmälningar med status `anmald` eller `bekraftad`.
- **`skapa_anmalan(p_tillfalle uuid, p_namn text, p_epost text, p_telefon text, p_antal integer, p_meddelande text) returns table(anmalan_id uuid, status anmalanstatus)`**
  — plpgsql, security definer. Låser, jämför med `platser_kvar` och sätter `anmald` eller
  `vantelista`. E-posten sparas i gemener och trimmad.

### Triggerfunktioner

- **`satt_uppdaterad()`** — sätter `new.uppdaterad = now()`.
- **`koppla_admin_vid_inloggning()`** — security definer. Slår upp `admin_inbjudan` på användarens
  e-post och skapar eller uppdaterar `admin_anvandare`.
- **`koppla_admin_vid_inbjudan()`** — security definer. Motsatt håll: när en inbjudan läggs till
  eller ändras och adressen redan finns i `auth.users`, skapas eller uppdateras `admin_anvandare`.

## Triggrar

| Tabell | Trigger | När | Funktion |
| --- | --- | --- | --- |
| `auth.users` | `auth_user_admin` | after insert | `koppla_admin_vid_inloggning()` |
| `admin_inbjudan` | `inbjudan_koppla` | after insert or update | `koppla_admin_vid_inbjudan()` |
| `bokning` | `bokning_uppdaterad` | before update | `satt_uppdaterad()` |
| `forfragan` | `forfragan_uppdaterad` | before update | `satt_uppdaterad()` |
| `fakturaunderlag` | `fakturaunderlag_uppdaterad` | before update | `satt_uppdaterad()` |

`auth_user_admin` går bara på **insert**, trots funktionens namn — kopplingen sker alltså när
användaren skapas första gången, inte vid varje inloggning. Med engångslänk skapas användaren vid
första inloggningen, så i praktiken blir det samma sak. Värt att veta när motsvarande trigger för
medlemmar byggs i fas 1.1: det finns i dag bara en egen trigger på `auth.users`.

## RLS-policys

Varje tabell har RLS påslagen. Ingen tabell har en publik insert-policy — publika skrivningar går
antingen genom security definer-RPC:erna (`skapa_bokning`, `skapa_anmalan`) eller genom server
actions som använder `SUPABASE_SERVICE_ROLE_KEY` (`supabaseAdmin()` i `lib/supabase.ts`), och
servicenyckeln går förbi RLS.

| Tabell | Policy | Kommando | Villkor |
| --- | --- | --- | --- |
| `admin_anvandare` | admin ser sig själv | select | `id = auth.uid() or har_roll('superadmin')` |
| `admin_anvandare` | superadmin hanterar admin | all | `har_roll('superadmin')` |
| `admin_inbjudan` | superadmin hanterar inbjudningar | all | `har_roll('superadmin')` |
| `enhet` | enhet publik | select | `true` |
| `enhet` | vardskap enhet | all | `har_roll('vardskap')` |
| `sasong` | sasong publik | select | `true` |
| `sasong` | vardskap sasong | all | `har_roll('vardskap')` |
| `prisregel` | prisregel publik | select | `true` |
| `prisregel` | vardskap prisregel | all | `har_roll('vardskap')` |
| `rabattkod` | vardskap rabattkod | all | `har_roll('vardskap') or har_roll('kommunikation')` |
| `gast` | vardskap gast | all | `har_roll('vardskap')` |
| `bokning` | vardskap bokning | all | `har_roll('vardskap')` |
| `bokningsrad` | vardskap bokningsrad | all | `har_roll('vardskap')` |
| `blockering` | vardskap blockering | all | `har_roll('vardskap')` |
| `forfragan` | vardskap forfragan | all | `har_roll('vardskap')` |
| `tillfalle` | tillfalle publik | select | `publicerad = true or ar_admin()` |
| `tillfalle` | tillfalle admin | all | `har_roll('vardskap') or har_roll('jaktadmin') or har_roll('kommunikation')` |
| `anmalan` | anmalan admin | all | `har_roll('vardskap') or har_roll('jaktadmin') or har_roll('kommunikation')` |
| `fakturaunderlag` | vardskap fakturaunderlag | all | `har_roll('vardskap')`, även `with check` |
| `fakturarad` | vardskap fakturarad | all | `har_roll('vardskap')`, även `with check` |
| `van` | van admin | all | `har_roll('kommunikation') or har_roll('vardskap')` |

## Index och sekvenser

Utöver primärnycklarna och unikvillkoren (`admin_anvandare.epost`, `van.epost`):

`bokningsrad_enhet_id_idx`, `fakturarad_underlag_idx`, `fakturaunderlag_bokning_idx`,
`fakturaunderlag_forfragan_idx`, `fakturaunderlag_status_idx`, `gast_lower_idx` (på `lower(epost)`).

Sekvenser: `bokning_nummer_seq`, `forfragan_nummer_seq`, `fakturaunderlag_nummer_seq`.

## Storage

Inga buckets. Den första blir `medlemsdokument` i fas 1.1.

## Tillägg

`plpgsql`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault` och `btree_gist`
(det sista i schemat `public`).
