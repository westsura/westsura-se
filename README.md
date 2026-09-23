# westsura.se

Nya webbplatsen för Westsura Herrgård. Next.js 15, React 19, TypeScript. Inga andra beroenden i etapp I.

## Köra lokalt

    npm install
    npm run dev

Öppna http://localhost:3000.

## Struktur

- `app/` — en mapp per sida. `page.tsx` är sidan, `layout.tsx` ramen med sidhuvud och sidfot.
- `components/` — sidhuvud, sidfot, hero, sökpanel, bokning, förfrågningsformulär, landningssida.
- `lib/site.ts` — kontaktuppgifter, meny, bildadresser och kungens citat på ett ställe.
- `app/globals.css` — hela designsystemet som CSS. Tokens överst.
- `public/bilder/` — fotografier och logotyper.

## Stilregler

Inga inline-stilar i sidorna — allt ligger som klasser i `globals.css`. De som används mest:

- Knappar: `btn` (52 px) och `btn--sm` (40 px). Varianter `btn--ghost`, `btn--block`. Inga andra storlekar.
- Kort: `card` (information), `card--accent` (formulär och val, guldkant), `card--plain`, `card--roomy`.
- Två spalter: `split`, med `split--start` (toppjusterat), `split--wide` (text | lista), `split--form` (text | formulär).
- Bild i ruta: `fig fig--43` / `fig--32` / `fig--34` / `fig--54`, med `<Image fill>` inuti.
- Sektioner: `section`, `section--tight`, `section--lead` (ingress före bokning), `section--after-head` (efter PageHead).
- Text: `lede`, `small` (16 px), `muted` (15 px dämpad), `hint` (14 px), `motto` (kursiv serif), `center`, `narrow`, `mb-0`.
- Formulär: `form`, `form--1` (en spalt), `field--full`, `ta--xs/s/m` (textarea-höjd), `notice`, `notice--fel`, `notice--lg`.

Undantag som får vara inline: `objectPosition` för en enskild bilds beskärning, och vapnets mask i `Vapen`.

## Bilder

Några bilder hämtas tills vidare från nuvarande westsura.se (se `lib/site.ts`, `img`). När fotografen varit här läggs de nya filerna i `public/bilder/` och adresserna byts.

## Publicering

Projektet deployas på Vercel som `westsura-se`. Koppla ett GitHub-repo så byggs varje push automatiskt:

    git init
    git add .
    git commit -m "Etapp I"
    git remote add origin git@github.com:westsura/westsura-se.git
    git push -u origin main

## Miljövariabler

Se `.env.example`. På Vercel: Settings → Environment Variables. `SUPABASE_SERVICE_ROLE_KEY` och `RESEND_API_KEY` är hemliga och får aldrig ligga i koden.

## Admin

`/admin` — inloggning med engångslänk per e-post. Behöriga adresser ligger i tabellen `admin_inbjudan` i Supabase (superadmin lägger till fler). Roller: superadmin, vardskap, kommunikation, jaktadmin, jaktledare.

## Jaktklubben (etapp IV)

- **Jägarkonto**: alla som anmäler sig till jakt (jaktdag eller vak-/pyrschdygn) får ett kostnadsfritt konto (`jaktmedlem.status = 'gast'`). Medlemskap ligger ovanpå (`godkand`). Portalen: `/jaktklubb/medlem`.
- **Säkerhetskurs online**: avsnitt och frågor i `kursavsnitt`/`kursfraga`, provet rättas på servern (`lamnaProv`). Giltighet styrs i `kursinstallning`. Mjuk spärr vid bokning.
- **Vak & pyrsch** (`lib/vak.ts`): områden i `vakomrade` (torn/vakplats/pyrschområde, SWEREF 99 TM för kartan). Alla dygn släpps av admin i `vakutbud` (så att vak/pyrsch inte stör drevjakterna) med `synlighet` 'medlem' eller 'alla'. Medlemmar önskar bland släppta dygn — pris enligt nivåns kvot (`medlemsniva.vakdygn_ingar`, tomt = obegränsat och ingår; `vakdygn_pris` därefter). Gäster bokar dygn med synlighet 'alla', till dygnets gästpris (publikt på `/jakt`). Admin (jaktledaren) tilldelar område och bekräftar under `/admin/jaktklubb/vak`; bekräftat dygn med pris får fakturaunderlag. En jägare per område och dygn (unikt index).

## Kommande etapper

- **II** ✔ Bokningskalender, prisregler, förfrågningsinkorg, tillfällen och admin.
- **III** Westsuras Vänner: register, nyhetsbrev, rabattkoder, kalendarium.
- **IV** Jaktklubben.
