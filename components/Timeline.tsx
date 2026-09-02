"use client";

import { useEffect, useRef } from "react";

export type Epok = {
  ar: string;          // markör på linjen, t.ex. "1680"
  rubrik: string;      // "1600-talet"
  under: string;       // underrubrik
  stycken: string[];
  bild?: { src: string; alt: string; text?: string; portratt?: boolean };
};

/** Tidslinje med bilder, växelvis vänster och höger, som tonas in när man scrollar. */
export default function Timeline({ epoker }: { epoker: Epok[] }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".tl-item"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((i) => i.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, []);

  return (
    <ol className="tl" ref={ref}>
      {epoker.map((e, i) => (
        <li key={e.rubrik} className={`tl-item ${i % 2 ? "tl-item--right" : "tl-item--left"}`}>
          <div className="tl-mark" aria-hidden><span>{e.ar}</span></div>
          <div className="tl-card">
            {e.bild && (
              <figure className={`tl-fig${e.bild.portratt ? " tl-fig--portratt" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.bild.src} alt={e.bild.alt} loading="lazy" />
                {e.bild.text && <figcaption>{e.bild.text}</figcaption>}
              </figure>
            )}
            <div className="tl-text">
              <p className="label">{e.rubrik}</p>
              <h3>{e.under}</h3>
              {e.stycken.map((s, j) => <p key={j}>{s}</p>)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
