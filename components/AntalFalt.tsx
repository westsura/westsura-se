"use client";

import { useState } from "react";

const kr = (n: number) => n.toLocaleString("sv-SE") + " kr";

/**
 * Antal personer i en anmälan. Med barnpris: Vuxna + Barn upp till X år, och totalen räknas ut.
 * Skickar alltid `antal` (alla, för platserna) och `antal_barn`.
 */
export default function AntalFalt({ pris, barnpris, barnAlder = 12, standard = 2 }: { pris: number | null; barnpris?: number | null; barnAlder?: number; standard?: number }) {
  const [vuxna, setVuxna] = useState(standard);
  const [barn, setBarn] = useState(0);
  const medBarn = barnpris != null;

  if (!medBarn) {
    return <div className="field"><label htmlFor="af-antal">Antal personer</label><input id="af-antal" name="antal" type="number" min={1} max={20} defaultValue={standard} required /></div>;
  }

  const total = pris != null ? vuxna * pris + barn * (barnpris ?? 0) : null;
  return (
    <>
      <div className="field"><label htmlFor="af-vuxna">Vuxna</label>
        <input id="af-vuxna" type="number" min={0} max={20} value={vuxna} onChange={(e) => setVuxna(Math.max(0, Number(e.target.value) || 0))} required /></div>
      <div className="field"><label htmlFor="af-barn">Barn upp till {barnAlder} år</label>
        <input id="af-barn" type="number" min={0} max={20} value={barn} onChange={(e) => setBarn(Math.max(0, Number(e.target.value) || 0))} /></div>
      <input type="hidden" name="antal" value={vuxna + barn} />
      <input type="hidden" name="antal_barn" value={barn} />
      {total != null && vuxna + barn > 0 && (
        <p className="hint field--full" style={{ margin: 0 }}>
          {vuxna ? `${vuxna} × ${kr(pris!)}` : ""}{vuxna && barn ? " + " : ""}{barn ? `${barn} × ${kr(barnpris!)}` : ""} = <b>{kr(total)}</b>
        </p>
      )}
      {vuxna + barn === 0 && <p className="hint field--full" style={{ margin: 0 }}>Ange minst en person.</p>}
    </>
  );
}
