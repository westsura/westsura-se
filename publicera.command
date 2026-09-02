#!/bin/bash
# Dubbelklicka på den här filen för att skicka senaste ändringarna till GitHub.
# Vercel bygger sedan sajten automatiskt inom ett par minuter.
cd "$(dirname "$0")"

if [ ! -d .git ]; then
  echo "Första gången: kopplar mappen till GitHub…"
  git init -b main
  git remote add origin git@github.com:westsura/westsura-se.git
fi

git add -A
git commit -m "Uppdatering $(date '+%Y-%m-%d %H:%M')" || echo "Inget nytt att skicka."
git push -u origin main
echo
echo "Klart. Vercel bygger nu — stäng fönstret."
read -n 1 -s -r -p "Tryck valfri tangent för att stänga."
