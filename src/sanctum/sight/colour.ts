/* Colour helpers. The map's colours come from the state; the sight only lifts
   them so they read as light on near-black (OKLab lightness floor). */

type RGB = [number, number, number];

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function parseHex(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function toHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToOklab([r, g, b]: RGB): RGB {
  const lr = toLin(r), lg = toLin(g), lb = toLin(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function oklabToRgb([L, a, b]: RGB): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const liftCache = new Map<string, string>();
/** Raises lightness to a floor, keeping hue; chroma eases off near white. */
export function lift(hex: string, floor = 0.74): string {
  const key = `${hex}|${floor}`;
  const hit = liftCache.get(key);
  if (hit) return hit;
  const [L, a, b] = rgbToOklab(parseHex(hex));
  const L2 = Math.max(L, floor);
  const k = L2 > 0.9 ? 0.6 : 1;
  const out = toHex(oklabToRgb([L2, a * k * 1.05, b * k * 1.05]));
  liftCache.set(key, out);
  return out;
}

export function mix(h1: string, h2: string, t: number): string {
  const a = parseHex(h1), b = parseHex(h2);
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}

const rgbCache = new Map<string, string>();
/** "r,g,b" for building rgba() strings cheaply. */
export function rgbOf(hex: string): string {
  const hit = rgbCache.get(hex);
  if (hit) return hit;
  const [r, g, b] = parseHex(hex);
  const out = `${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)}`;
  rgbCache.set(hex, out);
  return out;
}

export const rgba = (hex: string, a: number) => `rgba(${rgbOf(hex)},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
