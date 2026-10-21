"use client";

import { useEffect, useRef, useState } from "react";

/** En plats på kartan, redan omräknad till WGS 84. */
export type KartPlats = { id: string; namn: string; typ: string; typNamn: string; lat: number; lng: number; beskrivning: string | null; vagbeskrivning: string | null };
/** Jaktmarkens gränser som GeoJSON (WGS 84). */
export type KartGrans = { id: string; namn: string; geojson: unknown };

/* Leaflet laddas från cdnjs när kartan visas — inget extra paket i bygget. */
const LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any;
function laddaLeaflet(): Promise<L> {
  const w = window as unknown as { L?: L };
  if (w.L) return Promise.resolve(w.L);
  return new Promise((res, rej) => {
    if (!document.querySelector(`link[href^="${LEAFLET}"]`)) {
      const css = document.createElement("link"); css.rel = "stylesheet"; css.href = `${LEAFLET}/leaflet.min.css`; document.head.appendChild(css);
    }
    const s = document.createElement("script"); s.src = `${LEAFLET}/leaflet.min.js`; s.async = true;
    s.onload = () => res(w.L); s.onerror = () => rej(new Error("Kartan kunde inte laddas"));
    document.head.appendChild(s);
  });
}

/** Färg och tecken per typ av plats. */
const STIL: Record<string, { farg: string; tecken: string }> = {
  torn: { farg: "#7d6530", tecken: "T" }, vakplats: { farg: "#937839", tecken: "V" }, pyrschomrade: { farg: "#3f6b55", tecken: "P" },
  pass: { farg: "#a33b2b", tecken: "•" }, samling: { farg: "#1e3d33", tecken: "S" }, atel: { farg: "#6b4a2b", tecken: "Å" }, parkering: { farg: "#335c8a", tecken: "P" },
};

export default function JaktKarta({ platser, granser, harFlygfoto, mitt }: { platser: KartPlats[]; granser: KartGrans[]; harFlygfoto: boolean; mitt: [number, number] }) {
  const ruta = useRef<HTMLDivElement>(null);
  const karta = useRef<L>(null);
  const position = useRef<{ punkt?: L; cirkel?: L; watch?: number }>({});
  const [lager, setLager] = useState<"topo" | "orto">("topo");
  const [fel, setFel] = useState<string | null>(null);
  const [foljer, setFoljer] = useState(false);
  const [gps, setGps] = useState<string | null>(null);
  const lagerRef = useRef<Record<string, L>>({});

  useEffect(() => {
    let avbruten = false;
    laddaLeaflet().then((L) => {
      if (avbruten || !ruta.current || karta.current) return;
      const m = L.map(ruta.current, { zoomControl: true, attributionControl: true }).setView(mitt, 14);
      karta.current = m;
      lagerRef.current.topo = L.tileLayer("/api/karta/topo/{z}/{x}/{y}", { maxNativeZoom: 15, maxZoom: 19, attribution: "© Lantmäteriet (CC BY 4.0)" }).addTo(m);
      // Flygfotot finns bara över jaktmarken (z 12–18) och läggs ovanpå terrängkartan, som syns runt omkring.
      if (harFlygfoto) lagerRef.current.orto = L.tileLayer("/api/karta/orto/{z}/{x}/{y}", {
        minNativeZoom: 12, maxNativeZoom: 18, maxZoom: 19, zIndex: 2,
        bounds: [[59.7120, 16.0729], [59.7717, 16.2008]], attribution: "Flygfoto © Lantmäteriet",
      });

      const avgransning: L[] = [];
      for (const g of granser) {
        const yta = L.geoJSON(g.geojson, { style: { color: "#d7ae62", weight: 3, fillColor: "#d7ae62", fillOpacity: 0.08, dashArray: "6 4" } })
          .bindTooltip(g.namn, { sticky: true }).addTo(m);
        avgransning.push(yta);
      }
      const punkter: L[] = [];
      for (const p of platser) {
        const st = STIL[p.typ] ?? STIL.torn;
        const ikon = L.divIcon({
          className: "jk-kartikon",
          html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${st.farg};color:#fff;font:700 13px/1 sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)">${st.tecken}</span>`,
          iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -14],
        });
        const text = `<b>${esc(p.namn)}</b><br><small>${esc(p.typNamn)}</small>${p.beskrivning ? `<br>${esc(p.beskrivning)}` : ""}${p.vagbeskrivning ? `<br><i>${esc(p.vagbeskrivning)}</i>` : ""}`
          + `<br><a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener">Vägbeskrivning hit →</a>`;
        punkter.push(L.marker([p.lat, p.lng], { icon: ikon, title: p.namn }).bindPopup(text).bindTooltip(p.namn, { direction: "top", offset: [0, -12] }).addTo(m));
      }
      const allt = L.featureGroup([...avgransning, ...punkter]);
      if (allt.getLayers().length) m.fitBounds(allt.getBounds().pad(0.15), { maxZoom: 15 });
    }).catch((e) => setFel(e.message));
    return () => {
      avbruten = true;
      if (position.current.watch != null) navigator.geolocation.clearWatch(position.current.watch);
      karta.current?.remove(); karta.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bytLager(nytt: "topo" | "orto") {
    const m = karta.current; if (!m) return;
    // Terrängkartan ligger alltid kvar underst; flygfotot läggs på eller tas bort ovanpå.
    if (nytt === "orto") lagerRef.current.orto?.addTo(m);
    else if (lagerRef.current.orto) m.removeLayer(lagerRef.current.orto);
    setLager(nytt);
  }

  function visaMig() {
    const m = karta.current; if (!m) return;
    const L = (window as unknown as { L: L }).L;
    if (foljer) {
      if (position.current.watch != null) navigator.geolocation.clearWatch(position.current.watch);
      position.current.punkt?.remove(); position.current.cirkel?.remove(); position.current = {};
      setFoljer(false); setGps(null); return;
    }
    if (!("geolocation" in navigator)) { setGps("Din webbläsare kan inte visa position."); return; }
    setGps("Söker position…"); setFoljer(true);
    let forsta = true;
    position.current.watch = navigator.geolocation.watchPosition((pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if (!position.current.punkt) {
        position.current.cirkel = L.circle(ll, { radius: pos.coords.accuracy, color: "#2b6cb0", weight: 1, fillOpacity: 0.12 }).addTo(m);
        position.current.punkt = L.circleMarker(ll, { radius: 8, color: "#fff", weight: 3, fillColor: "#2b6cb0", fillOpacity: 1 }).addTo(m);
      } else { position.current.punkt.setLatLng(ll); position.current.cirkel.setLatLng(ll).setRadius(pos.coords.accuracy); }
      if (forsta) { m.setView(ll, Math.max(m.getZoom(), 15)); forsta = false; }
      setGps(`Noggrannhet ±${Math.round(pos.coords.accuracy)} m`);
    }, (e) => { setGps(e.code === 1 ? "Du behöver tillåta platsåtkomst för sajten i telefonens inställningar." : "Positionen kunde inte hämtas."); setFoljer(false); },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  }

  return (
    <div className="jk-karta">
      <div className="jk-karta__verktyg">
        {harFlygfoto && (
          <div className="jk-karta__vaxel" role="group" aria-label="Bakgrund">
            <button type="button" className={`btn btn--sm${lager === "topo" ? "" : " btn--ghost"}`} aria-pressed={lager === "topo"} onClick={() => bytLager("topo")}>Karta</button>
            <button type="button" className={`btn btn--sm${lager === "orto" ? "" : " btn--ghost"}`} aria-pressed={lager === "orto"} onClick={() => bytLager("orto")}>Flygfoto</button>
          </div>
        )}
        <button type="button" className={`btn btn--sm${foljer ? "" : " btn--ghost"}`} onClick={visaMig}>{foljer ? "Sluta visa min position" : "Visa var jag är"}</button>
        {gps && <span className="jk-hjalp" role="status">{gps}</span>}
      </div>
      {fel && <p className="notice notice--fel">{fel}</p>}
      <div ref={ruta} className="jk-karta__yta" style={{ height: "70vh", minHeight: 420, width: "100%", background: "#e8e4d6" }} />
      <div className="jk-karta__forklaring">
        {Object.entries(STIL).filter(([k]) => platser.some((p) => p.typ === k)).map(([k, st]) => (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: st.farg, color: "#fff", fontSize: 10, fontWeight: 700 }}>{st.tecken}</span>
            {platser.find((p) => p.typ === k)?.typNamn}
          </span>
        ))}
        {granser.length > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, borderTop: "3px dashed #d7ae62" }} />Jaktmarkens gräns</span>}
      </div>
    </div>
  );
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
