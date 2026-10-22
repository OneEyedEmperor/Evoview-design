import { useId, useRef, type KeyboardEvent } from "react";

export type Swatch = { id: string; color: string; label: string };

export const CUSTOM_SWATCH = "custom";

const INK_DARK = "#101011";
const INK_LIGHT = "#fafafa";

let ctx: CanvasRenderingContext2D | null | undefined;

/* Any CSS colour (hex, oklch…) → sRGB through a 1px canvas, then the ink with the better WCAG contrast. */
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

type Props = {
  swatches: Swatch[];
  value: string;
  custom: string;
  caption: { strong: string; rest: string };
  customLabel: string;
  onChange: (id: string) => void;
  onCustom: (hex: string) => void;
  /** Swatches only; the caption becomes the group's accessible name. */
  compact?: boolean;
};

/* Radiogroup of accent swatches plus a native colour input. Roving
   tabindex; arrows/Home/End select and move focus. */
export default function AccentPalette({ swatches, value, custom, caption, customLabel, onChange, onCustom, compact = false }: Props) {
  const captionId = useId();
  const group = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const ids = [...swatches.map((s) => s.id), CUSTOM_SWATCH];

  const openPicker = () => {
    const input = picker.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.click();
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = Math.max(0, ids.indexOf(value));
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % ids.length
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + ids.length) % ids.length
      : e.key === "Home" ? 0
      : e.key === "End" ? ids.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(ids[next]);
    group.current?.querySelectorAll<HTMLElement>("[role=radio]")[next]?.focus();
  };

  return (
    <div className={compact ? "lib-palette lib-palette--compact" : "lib-palette"}>
      {!compact && (
        <p id={captionId} className="lib-palette__caption">
          <span>{caption.strong}</span> — {caption.rest}
        </p>
      )}
      <div
        ref={group}
        role="radiogroup"
        aria-labelledby={compact ? undefined : captionId}
        aria-label={compact ? caption.strong : undefined}
        className="lib-palette__row"
        onKeyDown={onKeyDown}
      >
        {swatches.map((s) => {
          const checked = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={s.label}
              title={s.label}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(s.id)}
              className="lib-palette__swatch"
            >
              <span style={{ background: s.color, color: inkFor(s.color) }}>
                <Check />
              </span>
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={value === CUSTOM_SWATCH}
          aria-label={customLabel}
          title={customLabel}
          tabIndex={value === CUSTOM_SWATCH ? 0 : -1}
          onClick={() => {
            onChange(CUSTOM_SWATCH);
            openPicker();
          }}
          className="lib-palette__swatch lib-palette__swatch--custom"
        >
          <span style={value === CUSTOM_SWATCH ? { background: custom, color: inkFor(custom) } : undefined}>
            <Check />
          </span>
        </button>
        <input
          ref={picker}
          type="color"
          value={custom}
          tabIndex={-1}
          aria-hidden="true"
          className="lib-palette__input"
          onInput={(e) => {
            onCustom(e.currentTarget.value);
            onChange(CUSTOM_SWATCH);
          }}
          onChange={(e) => onCustom(e.currentTarget.value)}
        />
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
