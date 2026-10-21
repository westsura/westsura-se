import type { Metadata } from "next";
import { kravMedlem } from "@/lib/jakt";
import { supabaseAdmin } from "@/lib/supabase";
import { OMRADETYP, type Omrade } from "@/lib/vak";
import { tillWgs84 } from "@/lib/sweref";
import JaktKarta, { type KartGrans, type KartPlats } from "@/components/JaktKarta";

export const metadata: Metadata = { title: "Karta" };
export const dynamic = "force-dynamic";

/** Kartans mittpunkt innan några platser eller gränser finns: Liarsbo, norr om Surahammar. */
const LIARSBO: [number, number] = [59.7633, 16.0871];

/** Jaktkartan: torn, pass, åtlar och samlingsplatser på Lantmäteriets karta, med "var är jag". */
export default async function Karta() {
  await kravMedlem(); // medlemmar, gästjägare och hundekipage
  const adm = supabaseAdmin();
  const [{ data: omraden }, { data: mark }] = await Promise.all([
    adm.from("vakomrade").select("id, namn, typ, beskrivning, vagbeskrivning, nord, ost").eq("aktiv", true).not("nord", "is", null).not("ost", "is", null).order("ordning"),
    adm.from("jaktmark").select("id, namn, geojson"),
  ]);
  const platser: KartPlats[] = ((omraden ?? []) as Omrade[]).map((o) => {
    const w = tillWgs84(Number(o.nord), Number(o.ost));
    return { id: o.id, namn: o.namn, typ: o.typ, typNamn: OMRADETYP[o.typ] ?? o.typ, lat: w.lat, lng: w.lng, beskrivning: o.beskrivning, vagbeskrivning: o.vagbeskrivning };
  });

  return (
    <>
      <header className="jk-valkommen">
        <div>
          <p className="jk-etikett">Karta</p>
          <h1 className="jk-h1">Hitta rätt i skogen.</h1>
          <p className="jk-lede">Torn, pass, åtlar och samlingsplatser på jaktmarken. Tryck på en plats för beskrivning, och på <b>Visa var jag är</b> för att se din position — telefonen frågar om lov första gången.</p>
        </div>
      </header>
      <JaktKarta platser={platser} granser={(mark ?? []) as KartGrans[]} harFlygfoto={process.env.KARTA_ORTO !== "av"} mitt={LIARSBO} />
      {!platser.length && <p className="jk-hjalp" style={{ marginTop: 12 }}>Inga platser är inlagda på kartan ännu.</p>}
    </>
  );
}
