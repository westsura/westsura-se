# supabase

Databasen ligger i Supabase-projektet `jfliehivpfwwommrkgtj` (region eu-west-2, Postgres 17).
Den här mappen är repots bild av databasen: hur schemat ser ut i dag och varje ändring som gjorts sedan dess.

## Mappen

- `0000_baseline.md` — läsbar beskrivning av schemat som det såg ut 21 september 2026, innan fas 1 började. Utgångsläget, ingen migration.
- `migrations/` — en SQL-fil per ändring, i den ordning de körts.

## Konvention för migrationer

Filnamn: `ÅÅÅÅMMDDHHMM_namn.sql`, till exempel `202609211430_jaktklubb.sql`.
Tidsstämpeln är när filen skrevs, namnet är kort och på svenska med understreck.
Filerna körs i filnamnsordning och numret ändras aldrig i efterhand.

Varje fil:

- börjar med en kommentarsrad om vad ändringen gör och varför,
- innehåller bara den ändringen,
- går att köra en gång mot databasen. Skriv hellre `create table om inte finns`-varianter (`create table if not exists`, `create policy` efter `drop policy if exists`) än att lita på att filen aldrig körs två gånger,
- skriver svenska namn på tabeller, kolumner, funktioner och policys, precis som det befintliga schemat.

Det som inte går i en transaktion — `alter type ... add value` är det vanliga fallet — läggs som egna satser, en per `add value`, och körs var för sig.

## Så körs en migration

1. Skriv filen i `migrations/` och lägg den i repot **innan** den körs.
2. Kör den mot projektet via Supabase-MCP:ns `apply_migration` med samma namn som filen (utan tidsstämpel och `.sql`).
   Utan MCP: öppna Supabase → SQL Editor, klistra in hela filen och kör.
3. Kontrollera resultatet (`list_tables`, eller läs tillbaka det som ändrats).
4. Committa filen tillsammans med koden som behöver den.

Produktionsdatabasen ändras aldrig utan att filen finns i repot. Inga handpåläggningar i SQL-editorn som inte också står i en fil här — annars stämmer inte `0000_baseline.md` plus `migrations/` med verkligheten längre.

Supabase för egen logg över körda migrationer i tabellen `supabase_migrations.schema_migrations`. De sju rader som ligger där från etapp I–II kördes innan den här mappen fanns; de finns inte som filer, utan är sammanfattade i `0000_baseline.md`.

## Rör inte

Bokningsmotorn — `skapa_bokning`, `prisforslag`, `pris_for_natt`, `pris_for_period`, `enhet_ledig`, `krockande_enheter`, `lediga_enheter` och prisreglerna — ändras inte utan att det står uttryckligen i uppdraget.
