import { useId, type CSSProperties } from "react";
import traces from "./methodEyeTraces.json";

/* The Evoview method eye (site: src/components/MethodEye.tsx), reveal-only:
   pixel-traced strokes mask the original PNG in, then the full raster fades
   to fill the texture; phase 4 closes with the enclosing ring. */

const FINISH_FADE_S = 0.18;
const RING_DRAW_S = 0.6;

export default function HeroEye({ phase }: { phase: 1 | 2 | 3 | 4 }) {
  const maskId = `hero-eye-${useId().replace(/:/g, "")}`;
  const artwork = Math.min(phase + 1, 4) as 2 | 3 | 4;
  const strokes = traces[artwork];
  const ring = phase >= 4;
  const timing = ring ? 0.55 : 1;
  const end = Math.max(...strokes.map(({ delay, duration }) => delay + duration)) * timing;
  return (
    <svg
      viewBox="0 0 440 320"
      className="lib-eye"
      data-artwork={artwork}
      aria-hidden="true"
      focusable="false"
      style={{ "--eye-finish": `${end}s` } as CSSProperties}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="440" height="320">
          {strokes.map(({ d, width, delay, duration }, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="white"
              strokeWidth={width}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className="lib-eye__stroke"
              style={{ animationDelay: `${delay * timing}s`, animationDuration: `${duration * timing}s` }}
            />
          ))}
          <rect width="440" height="320" fill="white" className="lib-eye__finish" />
        </mask>
      </defs>
      <image href={`/library/hero/eye-${artwork}.png`} width="440" height="320" mask={`url(#${maskId})`} />
      {ring && (
        <circle
          cx="220"
          cy="160"
          r="184"
          fill="none"
          stroke="#f6effa"
          strokeWidth="5"
          strokeLinecap="round"
          opacity={245 / 255}
          pathLength={1}
          transform="rotate(-90 220 160)"
          className="lib-eye__stroke"
          style={{ animationDelay: `${end + FINISH_FADE_S}s`, animationDuration: `${RING_DRAW_S}s` }}
        />
      )}
    </svg>
  );
}
