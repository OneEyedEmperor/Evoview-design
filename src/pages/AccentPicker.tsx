import { useRef, type KeyboardEvent } from "react";
import "./accent-picker.css";

export type Swatch = { id: string; color: string; label: string };

const INK_DARK = "#101011";
const INK_LIGHT = "#fafafa";

let ctx: CanvasRenderingContext2D | null | undefined;

/* Any CSS colour (hex, oklch…) → sRGB through a 1px canvas, then the ink with the better WCAG contrast. */
export function inkFor(color: string): string {
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

const CUSTOM = "custom";

type Props = {
  swatches: Swatch[];
  value: string;
  custom: string;
  caption: { strong: string; rest: string };
  customLabel: string;
  onChange: (id: string) => void;
  onCustom: (hex: string) => void;
};

export default function AccentPicker({ swatches, value, custom, caption, customLabel, onChange, onCustom }: Props) {
  const group = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const ids = [...swatches.map((s) => s.id), CUSTOM];

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
    const i = ids.indexOf(value);
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
    <div className="accent-picker">
      <p id="accent-picker-caption" className="accent-picker__caption">
        <span>{caption.strong}</span> — {caption.rest}
      </p>
      <div ref={group} role="radiogroup" aria-labelledby="accent-picker-caption" className="accent-picker__row" onKeyDown={onKeyDown}>
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
              className="accent-picker__swatch"
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
          aria-checked={value === CUSTOM}
          aria-label={customLabel}
          title={customLabel}
          tabIndex={value === CUSTOM ? 0 : -1}
          onClick={() => {
            onChange(CUSTOM);
            openPicker();
          }}
          className="accent-picker__swatch accent-picker__swatch--custom"
        >
          <span style={value === CUSTOM ? { background: custom, color: inkFor(custom) } : undefined}>
            <Check />
          </span>
        </button>
        <input
          ref={picker}
          type="color"
          value={custom}
          tabIndex={-1}
          aria-hidden="true"
          className="accent-picker__input"
          onInput={(e) => {
            onCustom(e.currentTarget.value);
            onChange(CUSTOM);
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
