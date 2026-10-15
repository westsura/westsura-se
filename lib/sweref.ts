/**
 * SWEREF 99 TM (EPSG:3006) ⇄ WGS 84 (lat/lng), med Lantmäteriets formler för
 * Gauss–Krügers projektion. Noggrannhet långt under en meter — gott nog för torn och pass.
 * Delas av server och klient.
 */

const a = 6378137.0, f = 1 / 298.257222101;          // GRS 80
const lng0 = 15.0, k0 = 0.9996, FN = 0.0, FE = 500000.0;  // SWEREF 99 TM

const e2 = f * (2 - f), n = f / (2 - f);
const aRoof = (a / (1 + n)) * (1 + (n * n) / 4 + (n ** 4) / 64);
const rad = Math.PI / 180;

export function tillWgs84(nord: number, ost: number): { lat: number; lng: number } {
  const d1 = n / 2 - (2 / 3) * n ** 2 + (37 / 96) * n ** 3 - (1 / 360) * n ** 4;
  const d2 = (1 / 48) * n ** 2 + (1 / 15) * n ** 3 - (437 / 1440) * n ** 4;
  const d3 = (17 / 480) * n ** 3 - (37 / 840) * n ** 4;
  const d4 = (4397 / 161280) * n ** 4;
  const As = e2 + e2 ** 2 + e2 ** 3 + e2 ** 4;
  const Bs = -(7 * e2 ** 2 + 17 * e2 ** 3 + 30 * e2 ** 4) / 6;
  const Cs = (224 * e2 ** 3 + 889 * e2 ** 4) / 120;
  const Ds = -(4279 * e2 ** 4) / 1260;

  const xi = (nord - FN) / (k0 * aRoof), eta = (ost - FE) / (k0 * aRoof);
  const xiP = xi - d1 * Math.sin(2 * xi) * Math.cosh(2 * eta) - d2 * Math.sin(4 * xi) * Math.cosh(4 * eta)
    - d3 * Math.sin(6 * xi) * Math.cosh(6 * eta) - d4 * Math.sin(8 * xi) * Math.cosh(8 * eta);
  const etaP = eta - d1 * Math.cos(2 * xi) * Math.sinh(2 * eta) - d2 * Math.cos(4 * xi) * Math.sinh(4 * eta)
    - d3 * Math.cos(6 * xi) * Math.sinh(6 * eta) - d4 * Math.cos(8 * xi) * Math.sinh(8 * eta);
  const phiStar = Math.asin(Math.sin(xiP) / Math.cosh(etaP));
  const dLng = Math.atan(Math.sinh(etaP) / Math.cos(xiP));
  const s = Math.sin(phiStar);
  const lat = phiStar + s * Math.cos(phiStar) * (As + Bs * s ** 2 + Cs * s ** 4 + Ds * s ** 6);
  return { lat: lat / rad, lng: lng0 + dLng / rad };
}

export function tillSweref(lat: number, lng: number): { nord: number; ost: number } {
  const A = e2, B = (1 / 6) * (5 * e2 ** 2 - e2 ** 3), C = (1 / 120) * (104 * e2 ** 3 - 45 * e2 ** 4), D = (1 / 1260) * (1237 * e2 ** 4);
  const b1 = n / 2 - (2 / 3) * n ** 2 + (5 / 16) * n ** 3 + (41 / 180) * n ** 4;
  const b2 = (13 / 48) * n ** 2 - (3 / 5) * n ** 3 + (557 / 1440) * n ** 4;
  const b3 = (61 / 240) * n ** 3 - (103 / 140) * n ** 4;
  const b4 = (49561 / 161280) * n ** 4;
  const phi = lat * rad, lambda = lng * rad, lambda0 = lng0 * rad;
  const s = Math.sin(phi);
  const phiStar = phi - s * Math.cos(phi) * (A + B * s ** 2 + C * s ** 4 + D * s ** 6);
  const dl = lambda - lambda0;
  const xiP = Math.atan(Math.tan(phiStar) / Math.cos(dl));
  const etaP = Math.atanh(Math.cos(phiStar) * Math.sin(dl));
  const x = k0 * aRoof * (xiP + b1 * Math.sin(2 * xiP) * Math.cosh(2 * etaP) + b2 * Math.sin(4 * xiP) * Math.cosh(4 * etaP)
    + b3 * Math.sin(6 * xiP) * Math.cosh(6 * etaP) + b4 * Math.sin(8 * xiP) * Math.cosh(8 * etaP)) + FN;
  const y = k0 * aRoof * (etaP + b1 * Math.cos(2 * xiP) * Math.sinh(2 * etaP) + b2 * Math.cos(4 * xiP) * Math.sinh(4 * etaP)
    + b3 * Math.cos(6 * xiP) * Math.sinh(6 * etaP) + b4 * Math.cos(8 * xiP) * Math.sinh(8 * etaP)) + FE;
  return { nord: Math.round(x * 10) / 10, ost: Math.round(y * 10) / 10 };
}

/**
 * Tolkar en inskriven koordinat: "59.7633, 16.0871" (WGS 84, decimalgrader) eller
 * "6627412, 560890" / "N 6627412 E 560890" (SWEREF 99 TM). Ger SWEREF 99 TM eller null.
 */
export function tolkaKoordinat(text: string): { nord: number; ost: number } | null {
  const tal = (text.replace(/(\d),(\d)/g, "$1.$2").match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (tal.length < 2) return null;
  const [p, q] = tal;
  if (p > 50 && p < 70 && q > 5 && q < 30) return tillSweref(p, q);       // lat, lng
  if (q > 50 && q < 70 && p > 5 && p < 30) return tillSweref(q, p);       // lng, lat
  if (p > 6_000_000 && p < 7_800_000 && q > 200_000 && q < 1_000_000) return { nord: p, ost: q };
  if (q > 6_000_000 && q < 7_800_000 && p > 200_000 && p < 1_000_000) return { nord: q, ost: p };
  return null;
}
