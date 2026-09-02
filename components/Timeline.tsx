"use client";

import { useEffect, useRef } from "react";

export type Epok = {
  ar: string;          // markör på linjen, t.ex. "1680"
  rubrik: string;      // "1600-talet"
  under: string;       // underrubrik
  stycken: string[];
  bild?: { src: string; alt: string; text?: string; portratt?: boolean };
};

/** Tidslinje med bilder, växelvis vänster och höger, som tonas in när man scrollar.
 *  Utan JavaScript, eller om något går fel, visas allt direkt. */
export default function Timeline({ epoker }: { epoker: Epok[] }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".tl-item"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return; // allt synligt från start

    el.classList.add("tl--js"); // först nu döljs det som inte scrollats fram

    const visa = (i: HTMLElement) => i.classList.add("is-in");
    const kolla = () => {
      const h = window.innerHeight;
      items.forEach((i) => { if (i.getBoundingClientRect().top < h * 0.88) visa(i); });
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { visa(e.target as HTMLElement); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    items.forEach((i) => io.observe(i));

    kolla();
    window.addEventListener("scroll", kolla, { passive: true });
    window.addEventListener("resize", kolla);
    const t = window.setTimeout(() => items.forEach(visa), 6000); // sista skyddsnät

    return () => { io.disconnect(); window.removeEventListener("scroll", kolla); window.removeEventListener("resize", kolla); window.clearTimeout(t); };
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
