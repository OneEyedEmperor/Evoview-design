export type ClassValue = string | false | null | undefined | 0;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/* "01 / 04" — `current` is 1-based. */
export const formatIndex = (current: number, total: number, width = 2) => `${pad(current, width)} / ${pad(total, width)}`;

const INK_DARK = "#101011";
const INK_LIGHT = "#fafafa";
let ctx: CanvasRenderingContext2D | null | undefined;

const byte = (v: number) => Math.round(Math.min(255, Math.max(0, v)));

/* Hex, rgb() and hsl() parsed in JS, so server and client agree (a render
   that calls inkFor hydrates without a mismatch). Alpha is ignored. */
function parseRgb(color: string): number[] | null {
  const c = color.trim().toLowerCase();
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.exec(c);
  if (hex) {
    const h = hex[1].length <= 4 ? [...hex[1]].map((x) => x + x).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const num = String.raw`([+-]?[\d.]+)`;
  const rgb = new RegExp(String.raw`^rgba?\(\s*${num}(%?)[\s,]+${num}(%?)[\s,]+${num}(%?)`).exec(c);
  if (rgb) return [1, 3, 5].map((i) => byte(rgb[i + 1] ? Number(rgb[i]) * 2.55 : Number(rgb[i])));
  const hsl = new RegExp(String.raw`^hsla?\(\s*${num}(?:deg)?[\s,]+${num}%[\s,]+${num}%`).exec(c);
  if (hsl) {
    const h = ((Number(hsl[1]) % 360) + 360) % 360;
    const s = Math.min(1, Math.max(0, Number(hsl[2]) / 100));
    const l = Math.min(1, Math.max(0, Number(hsl[3]) / 100));
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return [f(0), f(8), f(4)].map((v) => byte(v * 255));
  }
  return null;
}

/* Other syntaxes (named, oklch, color-mix…) go through a canvas: client only. */
function canvasRgb(color: string): number[] | null {
  if (typeof document === "undefined") return null;
  if (ctx === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!ctx) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
}

/* Any CSS colour → the ink (#101011 / #fafafa) with the better WCAG contrast
   on it. Use it to fill --primary-foreground when the host has none.
   Server-rendered: pass hex / rgb() / hsl() (other syntaxes give #101011 on
   the server). */
export function inkFor(color: string): string {
  const rgb = parseRgb(color) ?? canvasRgb(color);
  if (!rgb) return INK_DARK;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Relative luminance of #101011 ≈ 0.0052, of #fafafa ≈ 0.955.
  return (L + 0.05) / 0.0552 >= 1.005 / (L + 0.05) ? INK_DARK : INK_LIGHT;
}
