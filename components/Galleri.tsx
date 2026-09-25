"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type Galleritema = { rubrik: string; bilder: { src: string; alt: string }[] };

/**
 * Fyra bilder med rubrik. Ett klick öppnar temats bilder i en bildvisning
 * med pilar, så att bilderna faktiskt leder någonstans.
 */
export default function Galleri({ teman }: { teman: Galleritema[] }) {
  const [oppet, setOppet] = useState<{ tema: number; bild: number } | null>(null);
  const tema = oppet ? teman[oppet.tema] : null;
  const stang = useCallback(() => setOppet(null), []);
  const steg = useCallback((d: number) => setOppet((o) => {
    if (!o) return o;
    const n = teman[o.tema].bilder.length;
    return { ...o, bild: (o.bild + d + n) % n };
  }), [teman]);

  useEffect(() => {
    if (!oppet) return;
    const tangent = (e: KeyboardEvent) => {
      if (e.key === "Escape") stang();
      if (e.key === "ArrowRight") steg(1);
      if (e.key === "ArrowLeft") steg(-1);
    };
    document.addEventListener("keydown", tangent);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tangent); document.body.style.overflow = ""; };
  }, [oppet, stang, steg]);

  return (
    <>
      <div className="gallery">
        {teman.map((t, i) => (
          <button key={t.rubrik} type="button" className="gallery__knapp" onClick={() => setOppet({ tema: i, bild: 0 })}
            aria-label={`${t.rubrik} — visa ${t.bilder.length} bilder`}>
            <Image src={t.bilder[0].src} alt={t.bilder[0].alt} fill sizes="(max-width: 900px) 50vw, 25vw" />
            <span className="gallery__text">{t.rubrik}<span className="gallery__antal">{t.bilder.length} bilder</span></span>
          </button>
        ))}
      </div>

      {tema && oppet && (
        <div className="visning" role="dialog" aria-modal="true" aria-label={tema.rubrik} onClick={stang}>
          <div className="visning__inre" onClick={(e) => e.stopPropagation()}>
            <div className="visning__topp">
              <p className="label">{tema.rubrik} · {oppet.bild + 1} av {tema.bilder.length}</p>
              <button type="button" className="visning__stang" onClick={stang} aria-label="Stäng">×</button>
            </div>
            <div className="visning__bild">
              <Image key={tema.bilder[oppet.bild].src} src={tema.bilder[oppet.bild].src} alt={tema.bilder[oppet.bild].alt} fill sizes="90vw" priority />
            </div>
            {tema.bilder.length > 1 && (
              <div className="visning__pilar">
                <button type="button" onClick={() => steg(-1)} aria-label="Föregående bild">←</button>
                <button type="button" onClick={() => steg(1)} aria-label="Nästa bild">→</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
