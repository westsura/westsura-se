"use client";

import { useCallback, useEffect, useState } from "react";

type Bild = { src: string; alt: string };

/** Rutnät med bilder; ett klick öppnar bildvisningen med pilar (samma utseende som galleriet på startsidan). */
export default function Bildgalleri({ bilder, rubrik, foto, max }: { bilder: Bild[]; rubrik: string; foto?: string; max?: number }) {
  const [oppen, setOppen] = useState<number | null>(null);
  const [alla, setAlla] = useState(false);
  const synliga = max && !alla ? bilder.slice(0, max) : bilder;
  const stang = useCallback(() => setOppen(null), []);
  const steg = useCallback((d: number) => setOppen((o) => (o == null ? o : (o + d + bilder.length) % bilder.length)), [bilder.length]);

  useEffect(() => {
    if (oppen == null) return;
    const tangent = (e: KeyboardEvent) => {
      if (e.key === "Escape") stang();
      if (e.key === "ArrowRight") steg(1);
      if (e.key === "ArrowLeft") steg(-1);
    };
    document.addEventListener("keydown", tangent);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", tangent); document.body.style.overflow = ""; };
  }, [oppen, stang, steg]);

  if (!bilder.length) return null;
  const b = oppen != null ? bilder[oppen] : null;

  return (
    <>
      <div className="bildrutnat">
        {synliga.map((x, i) => (
          <button key={x.src} type="button" className="bildrutnat__knapp" onClick={() => setOppen(i)} aria-label={`Visa bild ${i + 1} av ${bilder.length}: ${x.alt}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={x.src} alt={x.alt} loading="lazy" />
          </button>
        ))}
      </div>
      {synliga.length < bilder.length && (
        <p style={{ marginTop: 18 }}><button type="button" className="btn btn--ghost btn--sm" onClick={() => setAlla(true)}>Visa alla {bilder.length} bilder</button></p>
      )}
      {foto && <p className="muted small" style={{ marginTop: 10 }}>Foto: {foto}</p>}

      {b && oppen != null && (
        <div className="visning" role="dialog" aria-modal="true" aria-label={rubrik} onClick={stang}>
          <div className="visning__inre" onClick={(e) => e.stopPropagation()}>
            <div className="visning__topp">
              <p className="label">{rubrik} · {oppen + 1} av {bilder.length}</p>
              <button type="button" className="visning__stang" onClick={stang} aria-label="Stäng">×</button>
            </div>
            <div className="visning__bild">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={b.src} src={b.src} alt={b.alt} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            {bilder.length > 1 && (
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
