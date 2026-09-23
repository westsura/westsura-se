# Claude Code – Westsura fas 0 och 1: grund och jaktklubben

Du arbetar i repot `westsura/westsura-se` (Next.js 15, React 19, TypeScript, Supabase, Resend, deploy på Vercel). Läs `README.md` först – stilreglerna där gäller: inga inline-stilar, allt som klasser i `app/globals.css`, knappar `btn`/`btn--sm`, kort `card`, formulär `form`/`field`, admin-klasser `admin__*`, `pill`, `row`, `stat`. Svenska i kod, kommentarer, commit-meddelanden och UI. Följ mönstren som redan finns, hitta inte på nya.

## Så här jobbar vi

- Små commits, ett steg i taget, meddelande `Fas 0.2: roller butik och tomter` osv. Efter varje steg ska `npm run build` gå igenom.
- Stanna vid varje **ÖVERLÄMNING**. Visa skärmdumpar på det som byggts (kör `npm run dev` och ta skärmdumpar med Playwright eller be Björn titta), sammanfatta vad som gjorts och vänta på OK innan nästa steg. Fortsätt aldrig förbi en överlämning på egen hand.
- Databasändringar skrivs alltid som SQL-filer i `supabase/migrations/ÅÅÅÅMMDDHHMM_namn.sql` och läggs i repot innan de körs. Kör dem mot Supabase-projektet `jfliehivpfwwommrkgtj` via Supabase-MCP (`apply_migration`) om det finns, annars ber du Björn klistra in filen i SQL-editorn. Ändra aldrig produktionsdatabasen utan att filen finns i repot.
- Rör inte bokningsmotorn (`skapa_bokning`, `prisforslag`, `lediga_enheter`, prisregler) och inte befintliga adminsidor utöver det som står här.
- Inga nya hemligheter behövs i fas 0–1. Lagring av dokument sker med `SUPABASE_SERVICE_ROLE_KEY` som redan finns.
- Om något i den här beskrivningen krockar med hur koden faktiskt ser ut: fråga i stället för att gissa.

## Vad som redan finns (bygg vidare, bygg inte om)

- Admin på `/admin` med inloggning via engångslänk (`app/admin/login`, `app/admin/actions.ts` → `skickaInloggningslank`, `app/admin/auth/callback/route.ts`). Behöriga adresser i `admin_inbjudan`, användare i `admin_anvandare` med `roller roll[]`. Enum `roll` = `superadmin | vardskap | kommunikation | jaktadmin | jaktledare`. `kravAdmin(...roller)` och `harRoll` i `lib/admin.ts`; SQL-funktionerna `ar_admin()` och `har_roll(r roll)` används i RLS-policys. Triggern `koppla_admin_vid_inloggning` kopplar `auth.users` till `admin_anvandare` – läs den, samma mönster ska användas för medlemmar.
- Förfrågningsinkorg: tabell `forfragan` (status `ny|pagar|besvarad|bokad|avslutad`), sida `app/admin/(inloggad)/forfragningar`, kort `ForfraganKort.tsx`.
- Fakturering: `fakturaunderlag` + `fakturarad`, status `ej_fakturerad|fakturerad|betald|krediterad`, fält `fortnox_nummer` som skrivs in för hand. Sida `app/admin/(inloggad)/fakturering`. Det är den vägen jaktklubbens avgifter ska gå: underlag i admin, faktura skapas manuellt i Fortnox, numret förs in. Fortnox-API kommer i en senare fas.
- Tillfällen: `tillfalle` (typ `jakt|hundtraning|jaktkurs|evenemang`, `platser`, `pris`, `vanpris`, `publicerad`), `anmalan` (status `anmald|vantelista|bekraftad|avbokad`), RPC `skapa_anmalan(...)` med väntelista, `platser_kvar(t)`, vyn `tillfallen_publik`. Adminsida `tillfallen`.
- E-post: `lib/epost.ts` med `html(rubrik, rader, avslut)` och `skicka(...)` via Resend. `mejlMedlemsansokan` finns redan.
- Publik sida `app/jaktklubben/page.tsx` med formuläret `components/MedlemsansokanForm.tsx` som i dag sparar ansökan som en `forfragan` med typ "Medlemsansökan jaktklubben". Sidan beskriver tre hårdkodade medlemsnivåer (kärnmedlem 19 000 kr, jaktmedlem 9 500 kr, associerad 4 900 kr, 50 platser). **Den modellen gäller först från säsong 2027/2028** – se beslut nedan. Sidan ska bli datadriven.
- Vapnet finns som komponent `Vapen` i `components/Blocks.tsx` och logotyper i `public/bilder/`. Använd dem, ladda inte ner nya varianter från Figma.

## Beslut som styr fas 1 (från strukturdokumentet, 21 september 2026)

- Säsong 2026/2027 har **en medlemsnivå**: avgift **15 000 kr**, **cirka 20 platser**, väntelista när det är fullt. Säsongen följer jaktåret **1 juli 2026 – 30 juni 2027**.
- Från säsong 2027/2028 införs det **tredelade medlemskapet** (kärnmedlem, jaktmedlem, associerad – priser och platser bestäms då). Datamodellen ska därför klara **flera nivåer per säsong från början**; sidan, ansökan och admin visar de nivåer som finns i den aktiva säsongen. I år blir det en. Annonsera inte 2027/2028-nivåerna på sidan förrän Björn säger till.
- Ansökan innehåller personuppgifter (namn, e-post, telefon, ort), **jakterfarenhet** och **eventuell hund**.
- Medlemskap beviljas i admin. Vid godkännande: välkomstmejl med inloggningsinstruktion, avgiftsunderlag skapas direkt (faktura i Fortnox görs manuellt), uppmaning att ladda upp dokument.
- I medlemsdelen laddar medlemmen upp kopia på **giltigt inlöst statligt jaktkort**, **ID-handling** och **älgskyttemärke**. Jaktklubbens admin granskar och sätter godkänt/underkänt med kommentar; jaktkortet får ett giltighetsdatum.
- Dokumenten ska vara **godkända före första jaktdag**: anmälan till jaktdag spärras tills alla tre är godkända.
- Kopiorna ligger i en **privat** lagringsyta, syns bara för jaktklubbens admin via signerade länkar, och raderas när medlemskapet avslutas eller ansökan avböjs.
- Inloggning för medlemmar: engångslänk via e-post, samma mekanik som admin. Inga lösenord.
- Behörighet: bara Björn är superadmin nu. Områden i admin: herrgården = `vardskap`, jaktklubb = `jaktadmin`, butik och tomter = nya roller. `jaktledare` behålls (används senare för jaktdagar).
- URL:en ska vara **`/jaktklubb`**, inte `/jaktklubben`.

## Designen för medlemsdelen (Figma)

Medlemsdelen och inloggningen ska följa Figma-filen **"Westsura Jaktklubb — Medlemsklubben"**: `https://www.figma.com/design/ymuVbvn89d3gy05zxAn5Lj/`. Hämta varje vy med Figma-MCP:n (`get_design_context` med `fileKey` `ymuVbvn89d3gy05zxAn5Lj` och nodens id) innan du bygger den, och läs först ramen "Läs först · Design och överlämning" (`11:69`). Designen är byggd från samma designsystem som sajten (Cormorant Garamond, Karla, skogsgrönt, guld, crème), så det mesta finns redan som tokens och klasser i `globals.css`. Skriv nya klasser med prefixet `jk-` (`jk-header`, `jk-nav`, `jk-card--mork` osv.) i `globals.css`, inga inline-stilar, ingen Tailwind. Koden Figma-MCP:n returnerar är en visuell mall, inte något som klistras in.

| Vy | Dator | Mobil | Byggs i steg |
| --- | --- | --- | --- |
| Inloggning | `4:79` | `4:82` | 1.4 |
| E-postlänk skickad | `9:53` | `4:85` | 1.4 |
| Översikt | `4:80` | `4:83` | 1.5 |
| Boka jakt | `4:81` | `4:84` | 1.7 |

Det som är gemensamt i alla inloggade vyer: sidhuvud på grönt med skölden och ordmärket "WESTSURA / HERRGÅRDENS JAKTKLUBB", till höger "MEDLEMSKLUBBEN", "SÄSONG 2026 / 27" och "MIN PROFIL →"; en navigationsrad med **Översikt · Boka jakt · Mina bokningar · Marker & dokument · Mitt medlemskap**; sidfot "WESTSURA HERRGÅRD" och "Personlig hjälp · 0220-312 30". På mobil ersätts navigationsraden av "Meny" i sidhuvudet och en **fäst bottennavigation** med Hem · Boka jakt · Bokningar · Profil. Brytpunkt 768 px: en kolumn, fullbreddsknappar, bokningsdetaljen under datumlistan.

Designen visar inte dokumentuppladdningen och inte adminvyerna. De byggs efter samma mönster: kort med guldkant på crème, etiketter i versaler med spärrad Karla, rubriker i Cormorant. Statusar (bokad, kölista, godkänd, väntar) visas som den gröna punkten plus versal etikett, som "● BOKAD" i designen.

Sökvägar i medlemsdelen: `/jaktklubb/medlem` (Översikt), `/jaktklubb/medlem/boka`, `/jaktklubb/medlem/bokningar`, `/jaktklubb/medlem/dokument` (Marker & dokument), `/jaktklubb/medlem/medlemskap` (Mitt medlemskap, dit "MIN PROFIL →" och "Visa medlemskap →" leder). Inloggning på `/jaktklubb/login`, "länk skickad" på `/jaktklubb/login/skickat`.

---

## FAS 0 – Grund

### 0.1 Migrationsmapp
Skapa `supabase/migrations/` och en `supabase/README.md` som förklarar konventionen (filnamn, hur en migration körs, att produktionsdatabasen aldrig ändras utan fil). Lägg också in `supabase/0000_baseline.md`: en läsbar beskrivning av dagens schema – tabeller med kolumner, enum-typer, RPC:er (`skapa_bokning`, `prisforslag`, `lediga_enheter`, `skapa_anmalan`, `platser_kvar`, `ar_inbjuden`, `ar_admin`, `har_roll`), vyer (`bokningar_admin`, `enheter_publik`, `fakturaunderlag_admin`, `tillfallen_publik`) och triggrar. Hämta det via Supabase-MCP (`list_tables` verbose + SQL mot `pg_proc`/`pg_views`), skriv inte ur minnet. Commit.

### 0.2 Roller butik och tomter
Migration: `alter type roll add value 'butik'; alter type roll add value 'tomter';` (varje `add value` i egen transaktion – kör dem som två satser). Uppdatera `Roll` i `lib/admin.ts`.

Gör `AdminNav` rollstyrd: `app/admin/(inloggad)/layout.tsx` hämtar admin med `kravAdmin()` och skickar `roller` till `AdminNav` som prop. Menyposter får en lista med roller som får se dem; superadmin ser allt:

| Post | Roller |
| --- | --- |
| Översikt | alla |
| Kalender, Bokningar, Förfrågningar, Fakturering | vardskap |
| Tillfällen | vardskap, jaktadmin |
| Vänner | vardskap, kommunikation |
| Jaktklubb (ny, kommer i 1.3) | jaktadmin |

Sidorna själva ska redan kräva rätt roll via `kravAdmin(...)` – kontrollera att alla befintliga sidor gör det och lägg till där det saknas. Commit.

### 0.3 Adressen /jaktklubb
Flytta `app/jaktklubben/` till `app/jaktklubb/`. Lägg en permanent redirect `/jaktklubben` → `/jaktklubb` i `next.config.ts` (samma lista som WordPress-omdirigeringarna). Uppdatera länkarna i `app/jakt/page.tsx` och `alternates.canonical`. Commit.

### ÖVERLÄMNING 0
Visa: (a) admin-menyn inloggad som superadmin, (b) att `/jaktklubben` skickar vidare till `/jaktklubb`, (c) grön build. Vänta på OK.

---

## FAS 1 – Jaktklubben

### 1.1 Datamodell
En migration `..._jaktklubb.sql` med:

```sql
create type medlemsstatus as enum ('sokande','vantelista','godkand','avslutad','avbojd');
create type dokumenttyp as enum ('jaktkort','id','algskyttemarke');
create type dokumentstatus as enum ('inskickad','godkand','underkand');

create table jaktsasong (
  id uuid primary key default gen_random_uuid(),
  namn text not null,                 -- '2026/2027'
  fran date not null, till date not null,
  moms integer not null default 0,    -- moms på avgifterna, bekräftas med revisorn
  aktiv boolean not null default true -- exakt en aktiv säsong åt gången
);

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

insert into jaktsasong (id, namn, fran, till) values ('00000000-0000-0000-0000-000000002627', '2026/2027', '2026-07-01', '2027-06-30');
insert into medlemsniva (sasong_id, namn, beskrivning, avgift, platser, ordning)
  values ('00000000-0000-0000-0000-000000002627', 'Medlem', 'Säsongens jaktdagar på herrgårdens marker, klubbens sammankomster, kartor, regler och dokument.', 15000, 20, 0);

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

alter table tillfalle add column synlighet text not null default 'publik' check (synlighet in ('publik','medlem'));
alter table tillfalle add column samling text;     -- t.ex. 'Samling vid herrgården'
alter table tillfalle add column program text;     -- rader som '07.00  Samling vid herrgården', en per rad
```

Dessutom i samma migration:
- Uppdatera vyn `tillfallen_publik` så att den bara visar `synlighet = 'publik'` (läs nuvarande definition med `pg_get_viewdef` och lägg till villkoret – ändra inget annat i vyn).
- Trigger `satt_uppdaterad` på `jaktmedlem` (samma funktion som övriga tabeller använder).
- RLS på: `jaktsasong` och `medlemsniva` (select publikt; ALL för `har_roll('jaktadmin')`), `jaktmedlem` (ALL för `har_roll('jaktadmin')`; select på egen rad där `anvandare_id = auth.uid()`), `medlemsdokument` (ALL för `har_roll('jaktadmin')`; select på egna via `medlem_id in (select id from jaktmedlem where anvandare_id = auth.uid())`). Skrivningar från medlemmar går via server actions med servicenyckel.
- RPC `ar_jaktmedlem(e text) returns boolean` (security definer, som `ar_inbjuden`): true om det finns en `jaktmedlem` med `epost = lower(e)` och status `godkand`.
- Trigger på `auth.users` efter mönster från `koppla_admin_vid_inloggning`: när en användare skapas eller loggar in och e-posten matchar en `jaktmedlem`, sätt `anvandare_id`. Läs den befintliga funktionen och gör en motsvarande `koppla_medlem_vid_inloggning`. Om den befintliga triggern är den enda som får finnas på `auth.users`, utöka den i stället för att lägga till en andra.
- Storage: bucket `medlemsdokument`, **privat**, max 10 MB per fil, tillåtna typer `application/pdf`, `image/jpeg`, `image/png`. Inga policys för `anon`/`authenticated` – all åtkomst går via servicenyckeln i server actions, och admin får signerade länkar som gäller i 10 minuter.

Kör migrationen. Commit.

### 1.2 Publik sida /jaktklubb
Gör `app/jaktklubb/page.tsx` datadriven. Behåll emblemhuvudet, tonen och klasserna. Sidan hämtar den aktiva säsongen och dess nivåer (`medlemsniva`, sorterade på `ordning`) och visar ett kort per nivå med namn, avgift, platser kvar (platser minus godkända) och beskrivning – i år alltså ett enda kort. Rubrik och löptext anpassas efter antal nivåer: med en nivå "att vara medlem", med flera "tre sätt att höra till". Innehåll i övrigt: en sluten klubb på herrgårdens marker, säsongen följer jaktåret 1 juli–30 juni, medlemskap söks och beviljas av herrgården, väntelista när det är fullt. Ta bort den hårdkodade `nivaer`-listan. Nämn inte 2027/2028 på sidan. Sektionen "Redan medlem" ska nu vara aktiv och länka till `/jaktklubb/login`.

Gör om `components/MedlemsansokanForm.tsx`: fält `namn`, `epost`, `telefon` (krävs), `ort`, `jakterfarenhet` (textarea, krävs, placeholder: hur länge du jagat, vilken jakt, jägarexamen och vapenlicens), `hund` (text, valfritt: ras och vad hunden används till), `meddelande` (valfritt). Om den aktiva säsongen har fler än en nivå visas dessutom ett obligatoriskt val "Önskad nivå" (radioknappar); med en nivå döljs valet och `onskad_niva_id` sätts till den enda. Ny server action `skapaMedlemsansokan` i `app/actions.ts` sparar en rad i `jaktmedlem` med status `sokande` (avvisa dublett på e-post med ett vänligt fel: "Det finns redan en ansökan med den adressen – ring oss om du vill ändra något"). Skicka mejl som i dag (`mejlMedlemsansokan`, anpassa texten: vi hör av oss, antalet platser är begränsat). Sluta skriva ansökningar till `forfragan`.

Commit. **ÖVERLÄMNING 1a**: skärmdump av sidan på desktop och mobil, och en testansökan som syns i databasen.

### 1.3 Admin /admin/jaktklubb
Ny sida `app/admin/(inloggad)/jaktklubb/page.tsx`, `kravAdmin("jaktadmin")`, menypost enligt 0.2. Följ `forfragningar`-sidans uppbyggnad (server component som hämtar, klientkort för åtgärder).

Överst: aktiv säsong och en räknare per nivå, "Medlem: 17 av 20 platser" (antal `godkand` med den `niva_id`). I år en rad, nästa år tre.

Avsnitt **Ansökningar** (status `sokande` och `vantelista`, nyast först): kort med alla uppgifter ur ansökan inklusive önskad nivå, anteckning (sparas som `forfragan`-anteckningen), knappar **Godkänn**, **Väntelista**, **Avböj**.
- Godkänn: en nivåväljare förifylld med `onskad_niva_id` (med en nivå i säsongen visas ingen väljare). Sätter status `godkand`, `sasong_id` = aktiv säsong, `niva_id`, och skapar `fakturaunderlag` (rubrik "Medlemsavgift jaktklubben säsong 2026/2027", kund = medlemmen, en `fakturarad`: beskrivning "Medlemsavgift jaktklubben 2026/2027, {nivåns namn}", antal 1, enhet st, à-pris `medlemsniva.avgift`, moms `jaktsasong.moms`, förfallodatum 30 dagar fram) och sparar `underlag_id`. Mejl `mejlMedlemGodkand`: välkommen, avgiften faktureras separat, logga in på `/jaktklubb/login` med din e-postadress, ladda upp jaktkort, ID och älgskyttemärke före första jaktdag. Om nivåns platser är fulla: visa en varning i kortet men tillåt ändå (admin bestämmer).
- Väntelista: status `vantelista`, mejl `mejlMedlemVantelista` (kort).
- Avböj: status `avbojd`, mejl `mejlMedlemAvbojd` (kort, vänligt), radera eventuella dokument i bucketen.

Avsnitt **Medlemmar** (status `godkand`): rad per medlem med namn, telefon, e-post, nivå, avgiftsstatus (från `fakturaunderlag.status` via `underlag_id`: Att fakturera / Fakturerad / Betald), tre piller för dokumenten (saknas / inskickad / godkänd / underkänd) och kursstatus. Klick öppnar `app/admin/(inloggad)/jaktklubb/[id]/page.tsx` med medlemmens uppgifter, anteckning, kryssrutan **Säkerhets- och skyttekurs genomförd** (`kurs_genomford`), dokumentgranskning (1.6) och knappen **Avsluta medlemskap** (status `avslutad`, radera dokument i bucketen).

Commit. **ÖVERLÄMNING 1b**: skärmdumpar av listan, ett godkännande, det skapade underlaget under Fakturering, och välkomstmejlet (Resend-loggen eller en testadress).

### 1.4 Medlemsinloggning – Figma `4:79`, `4:82`, `9:53`, `4:85`
- `app/jaktklubb/login/page.tsx` enligt designen: på dator ett tvådelat uppslag – vänster grön panel med hela vapnet i guld, "EN PLATS ATT HÖRA TILL", citatet "Jakten för oss hit. Gemenskapen får oss att stanna." och nederst "WESTSURA HERRGÅRD · Marker. Tradition. Gemenskap."; höger crème med "← Till herrgårdens hemsida", etiketten "FÖR VÅRA MEDLEMMAR", rubriken "Välkommen tillbaka.", e-postfält, knappen "SKICKA INLOGGNINGSLÄNK", förklaringen om engångslänken, avdelare, "Ännu inte medlem? Läs om medlemskapet och ansök ↗" (länk till `/jaktklubb`) och "Behöver du hjälp? 0220-312 30". På mobil staplas panelen ovanför formuläret med det mindre vapnet. Texterna tas ur Figma.
- Server action `skickaMedlemslank` i `app/jaktklubb/actions.ts`: `ar_jaktmedlem(epost)` måste vara true, annars felet "Adressen är inte registrerad som medlem – ring oss." Sedan `signInWithOtp` med `emailRedirectTo` = `/jaktklubb/auth/callback`. Vid lyckat anrop skickas användaren till `/jaktklubb/login/skickat?e=<adress>`.
- `app/jaktklubb/login/skickat/page.tsx` enligt `9:53`/`4:85`: "SNART ÄR DU INNE", "Titta i din inkorg.", de två förklarande styckena, "Inget mejl? …", knappen "SKICKA LÄNKEN IGEN" (samma action igen) och "← Byt e-postadress".
- `app/jaktklubb/auth/callback/route.ts`: som adminens, men skickar vidare till `/jaktklubb/medlem`.
- `middleware.ts`: lägg till `/jaktklubb/medlem/:path*` i `matcher`. Utloggad på den sökvägen → `/jaktklubb/login`. Inloggad på `/jaktklubb/login` → `/jaktklubb/medlem`. Blanda inte ihop med admin-omdirigeringarna.
- `lib/jakt.ts` (ersätt den tomma filen): `kravMedlem()` som hämtar användaren, slår upp `jaktmedlem` på `anvandare_id` (eller e-post om `anvandare_id` ännu inte satts – sätt den då) och kräver status `godkand`; annars redirect till `/jaktklubb/login?fel=ingen-behorighet`. Samt `loggaUtMedlem()`.

Commit. **ÖVERLÄMNING 1c**: inloggningen och "länk skickad" på dator (1440) och mobil (390) sida vid sida med Figma-ramarna, plus en riktig inloggning med testadressen.

### 1.5 Medlemsdelen: layout, Översikt och Mitt medlemskap – Figma `4:80`, `4:83`
- `app/jaktklubb/medlem/layout.tsx` med sidhuvud, navigationsrad, sidfot och mobilens bottennavigation enligt designen. Aktiv flik markeras som i Figma (understruken). "SÄSONG 2026 / 27" hämtas från aktiva säsongen. "MIN PROFIL →" leder till `/jaktklubb/medlem/medlemskap`. Logga ut ligger under Mitt medlemskap.
- **Översikt** `app/jaktklubb/medlem/page.tsx` enligt `4:80`: etikett "DITT WESTSURA · {säsongsdel} {år}" (hösten/vintern/våren efter datum), rubriken "Välkommen tillbaka, {förnamn}.", underraden och knappen "BOKA EN JAKTDAG" → `/jaktklubb/medlem/boka`. Det gröna kortet **DIN NÄSTA JAKTDAG** visar medlemmens närmaste kommande anmälan (via `anmalan` på medlemmens e-post, joinat med `tillfalle`): stor dag och månad, titel, typ och samling, veckodag, datum och tid, status "● BOKAD" (bekraftad), "● ANMÄLD" (anmald) eller "● KÖLISTA" (vantelista), knappen "VISA MIN BOKNING" → `/jaktklubb/medlem/bokningar`. Utan kommande anmälan visar kortet "Ingen jaktdag bokad ännu" och knappen "BOKA EN JAKTDAG". Kortet **DITT MEDLEMSKAP**: nivåns namn, "Säsong 2026 / 27", "● Medlemskap aktivt", "Säkerhets- & skyttekurs / Genomförd för säsongen" eller "Inte genomförd ännu", "Visa medlemskap →". Under det "Nära till hands" med de tre korten Marker & pass, Regler & dokument, Boende & mat (de två första länkar till `/jaktklubb/medlem/dokument`, det tredje till `/boende`). Kortet "Från herrgården" byggs i 1.8 – lämna plats men visa det inte förrän det finns innehåll.
- **Mitt medlemskap** `app/jaktklubb/medlem/medlemskap/page.tsx`, efter samma kortmönster: (1) medlemskapet – namn, e-post, telefon, nivå, säsong, status, avgift (Att fakturera / Fakturerad, förfaller ÅÅÅÅ-MM-DD / Betald), kursstatus; (2) **Dina dokument** – tre rader: Statligt jaktkort, ID-handling, Älgskyttemärke, var och en med status (saknas / inskickad, väntar på granskning / godkänd t.o.m. datum / underkänd + kommentar) och ett uppladdningsfält; (3) logga ut. Server action `laddaUppDokument(typ, fil)`: validera typ och storlek, ladda upp till `medlemsdokument/<medlem_id>/<typ>.<ext>` med servicenyckeln (ersätt tidigare fil), upsert i `medlemsdokument` med status `inskickad`, kommentar null. Mejla jaktklubbens admin (`site.email`) att ett dokument väntar på granskning.
- **Marker & dokument** `app/jaktklubb/medlem/dokument/page.tsx`: i fas 1 en sida i samma stil med texten att kartor, passbeskrivningar och regler läggs upp inför säsongen, och en länk till herrgårdens telefon. Klubbens dokumentbibliotek byggs senare.

Commit. **ÖVERLÄMNING 1d**: Översikt och Mitt medlemskap på dator och mobil jämförda med `4:80`/`4:83`, en uppladdning av tre filer, och admin som ser dem.

### 1.6 Granskning i admin
På `admin/jaktklubb/[id]`: per dokument – knapp **Öppna** (signerad länk, ny flik), **Godkänn** (för jaktkort krävs `giltig_till`; förifyll 30 juni innevarande jaktår), **Underkänn** med obligatorisk kommentar. Sätter `status`, `granskad_av`, `granskad`. Mejl `mejlDokumentstatus` till medlemmen vid båda utfallen; när det tredje dokumentet blir godkänt, mejl `mejlDokumentKlar` ("Du är klar för säsongen – anmäl dig till jaktdagarna"). Commit.

### 1.7 Boka jakt och Mina bokningar – Figma `4:81`, `4:84`
- **Boka jakt** `app/jaktklubb/medlem/boka/page.tsx` enligt `4:81`: etikett "JAKTEN PÅ WESTSURA", rubrik "Hitta din nästa jaktdag.", ingress. Valet "GEMENSAM JAKT" / "VAK & PYRSCH": bara gemensam jakt är aktiv i fas 1; vak & pyrsch visas som inaktiv knapp med `title` "Kommer senare". Månadsväljare med pilar och "Alla datum · {n} jaktdagar". Lista över `tillfalle` med `typ = 'jakt'`, `synlighet = 'medlem'`, publicerade, datum ≥ i dag: dag och månad stort, titel, veckodag och tid, statusrad "{n} platser kvar" / "Du är bokad" / "Fullbokad · kölista" (via `platser_kvar` och medlemmens egna anmälningar). Vald jaktdag (första i listan som standard, klick byter) visas i detaljpanelen till höger (under listan på mobil): etikett med veckodag och datum, titel, beskrivning, programmet radvis ur `program`, avdelare, "{n} PLATSER KVAR", "Ingår enligt ditt medlemskap. Din plats bekräftas i nästa steg." och knappen "FORTSÄTT TILL BOKNING". Knappen anropar `skapa_anmalan` med medlemmens uppgifter och antal 1; vid fullt hamnar man på kölista och det står så. Är inte alla tre dokument `godkand` är knappen inaktiv och texten under lyder "Ladda upp och få dina dokument godkända innan du bokar" med länk till Mitt medlemskap. Rutan "INFÖR DIN BOKNING" nederst med texten om säkerhetskursen och att boende och mat bokas separat.
- **Mina bokningar** `app/jaktklubb/medlem/bokningar/page.tsx`: medlemmens anmälningar, kommande först, i samma listmönster som Boka jakt med status och en avbokningsknapp som sätter `anmalan.status = 'avbokad'` (bekräfta först).
- Uppdatera `sparaTillfalle` och `TillfalleForm` i admin med fälten synlighet (publik / bara medlemmar), samling och program.

Commit. **ÖVERLÄMNING 1e – hela flödet**: kör igenom med testadressen: ansökan på `/jaktklubb` → godkännande i admin → underlag under Fakturering → inloggningslänk → uppladdning av tre filer → granskning (ett underkänt, sedan godkänt) → bokning av en jaktdag med `synlighet = 'medlem'` → jaktdagen syns som "DIN NÄSTA JAKTDAG" på översikten → avbokning under Mina bokningar. Skärmdump av varje steg på dator och mobil, jämfört med Figma. Radera testdatan efteråt. Vänta på OK.

### 1.8 Om tid finns: "Från herrgården"
Tabell `klubbmeddelande` (rubrik, text, datum, publicerad) med ett enkelt formulär på `/admin/jaktklubb`; senaste publicerade visas på översikten i kortet "Från herrgården" enligt `4:80`. Hoppa över om 1.1–1.7 tagit längre tid än planerat.

## Utanför fas 1 (gör inte nu)
Fortnox-API, påminnelsemejl när jaktkortet går ut, vak- och pyrschbokning, avskjutningsrapport, jaktledarens vy, klubbens dokumentbibliotek (kartor, pass, regler), adminformulär för säsonger och nivåer (säsong 2027/2028 med tre nivåer läggs upp som migration eller i ett senare formulär), bokningsföreträde per nivå (`bokning_oppnar`), `gast` → `kontakt`, Stripe, boka@-ingången.

## Öppna punkter att fråga Björn om när de blir aktuella
- Moms på medlemsavgiften (fältet `jaktsasong.moms` finns; default 0 tills revisorn sagt sitt).
- Om ansökan ska stängas automatiskt när säsongen är full, eller alltid vara öppen med väntelista (byggt som: alltid öppen, admin väljer).
- Om och när 2027/2028-nivåerna ska synas på sidan (byggt som: inte alls i år).
- Om säkerhets- och skyttekursen ska spärra bokning på samma sätt som dokumenten (byggt som: visas som status, spärrar inte).
