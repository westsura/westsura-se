import { Vapen } from "@/components/Blocks";

/** Klubbens ordmärke: skölden plus WESTSURA / HERRGÅRDENS JAKTKLUBB. */
export function Marke() {
  return (
    <div className="jk-marke">
      <Vapen variant="skold" size={30} className="jk-marke__skold" />
      <div>
        <p className="jk-marke__ord">WESTSURA</p>
        <p className="jk-marke__under">Herrgårdens jaktklubb</p>
      </div>
    </div>
  );
}

/**
 * Den gröna vänsterpanelen på inloggningen. Med `kompakt` krymper den till enbart
 * ordmärket på mobil — så ser vyn "länk skickad" ut i designen.
 */
export default function Panel({ kompakt = false }: { kompakt?: boolean }) {
  return (
    <div className={`jk-login__panel${kompakt ? " jk-login__panel--kompakt" : ""}`}>
      <Marke />
      <div className="jk-login__emblem">
        <Vapen size={224} className="jk-login__vapen" />
        <p className="jk-login__etikett">En plats att höra till</p>
        <p className="jk-login__motto">Jakten för oss hit.<br />Gemenskapen<br />får oss att stanna.</p>
        <p className="jk-login__ingress">Din plats på herrgården, även mellan jaktdagarna.<br />Välkommen in i Westsuras privata medlemsklubb.</p>
      </div>
      <div className="jk-login__luft" />
      <div className="jk-avdelare" />
      <p className="jk-login__fot"><b>Westsura Herrgård</b> <span>Marker. Tradition. Gemenskap.</span></p>
    </div>
  );
}
