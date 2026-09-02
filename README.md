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

## Kommande etapper

- **II** ✔ Bokningskalender, prisregler, förfrågningsinkorg, tillfällen och admin.
- **III** Westsuras Vänner: register, nyhetsbrev, rabattkoder, kalendarium.
- **IV** Jaktklubben.
