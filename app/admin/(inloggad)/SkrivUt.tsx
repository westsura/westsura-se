"use client";

/** Knapp som öppnar webbläsarens utskrift (eller "spara som PDF"). Syns inte på papperet. */
export default function SkrivUt({ etikett = "Skriv ut" }: { etikett?: string }) {
  return <button type="button" className="btn btn--sm print-hide" onClick={() => window.print()}>{etikett}</button>;
}
