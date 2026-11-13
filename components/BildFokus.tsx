"use client";

import { useState } from "react";

/**
 * Välj vilken del av huvudbilden som ska synas när den beskärs — i bannern högst upp på sidan
 * och på korten. Klicka i bilden där det viktigaste finns; förhandsvisningarna visar resultatet.
 * Värdet sparas som CSS object-position ("50% 30%") i fältet `name`.
 */
export default function BildFokus({ src, name = "bild_fokus", standard }: { src: string | null; name?: string; standard?: string | null }) {
  const [fokus, setFokus] = useState(standard || "50% 50%");
  if (!src) return <input type="hidden" name={name} value={standard ?? ""} />;
  const [x, y] = fokus.split(" ").map((v) => parseFloat(v));

  return (
    <div className="bildfokus">
      <input type="hidden" name={name} value={fokus} />
      <div>
        <p className="hint" style={{ margin: "0 0 6px" }}>Klicka på det som ska synas i bannern.</p>
        <div className="bildfokus__hela" onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const nx = Math.round(((e.clientX - r.left) / r.width) * 100), ny = Math.round(((e.clientY - r.top) / r.height) * 100);
          setFokus(`${Math.min(100, Math.max(0, nx))}% ${Math.min(100, Math.max(0, ny))}%`);
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" />
          <span className="bildfokus__punkt" style={{ left: `${x}%`, top: `${y}%` }} />
        </div>
        <button type="button" className="linkbtn" style={{ marginTop: 6 }} onClick={() => setFokus("50% 50%")}>Mitten</button>
      </div>
      <div className="bildfokus__forhand">
        <p className="hint" style={{ margin: "0 0 6px" }}>Så blir bannern — dator och mobil</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="bildfokus__dator" style={{ objectPosition: fokus }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="bildfokus__mobil" style={{ objectPosition: fokus }} />
      </div>
    </div>
  );
}
