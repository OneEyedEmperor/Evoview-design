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

/* Any CSS colour → the ink (#101011 / #fafafa) with the better WCAG contrast
   on it. Use it to fill --primary-foreground when the host has none. */
export function inkFor(color: string): string {
  if (typeof document === "undefined") return INK_DARK;
  if (ctx === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!ctx) return INK_DARK;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3), (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Relative luminance of #101011 ≈ 0.0052, of #fafafa ≈ 0.955.
  return (L + 0.05) / 0.0552 >= 1.005 / (L + 0.05) ? INK_DARK : INK_LIGHT;
}
