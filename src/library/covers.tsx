import { useId, useState, type ReactNode } from "react";

/* Abstract structure previews for each library entry, drawn as inline SVG
   in neutral greys (the navbar card renders them monochrome anyway). One
   thin accent signal per cover, via --cover-signal. Fallback for entries
   without a screenshot crop (see PHOTO below).

   `banner` = navbar tray card (900×216). `card` = library index well (16:10). */

export type CoverVariant = "banner" | "card";

const SIZE: Record<CoverVariant, [number, number]> = { banner: [900, 216], card: [800, 500] };

const SURFACE = "#18181b";
const RAISED = "#232327";
const BAR = "#34343a";
const STRONG = "#55555d";
const LIGHT = "#8d8d95";
const PAPER = "#d4d4d7";
const PAPER_INK = "#8a8a90";
const LINE = "rgba(255,255,255,0.1)";
const SIGNAL = { fill: "var(--cover-signal, #818cf8)" };
const SIGNAL_STROKE = { stroke: "var(--cover-signal, #818cf8)" };

type Draw = (w: number, h: number, uid: string) => ReactNode;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/* Section shell: a dark chapter hard-cut into a paper one, display heading
   over a .72/1.28 heading/copy split. */
const chapter: Draw = (w, h) => {
  const p = h * 0.13;
  const cut = w * 0.6;
  const head = h * 0.1;
  return (
    <>
      <rect width={cut} height={h} fill="#111113" />
      <rect x={cut} width={w - cut} height={h} fill={PAPER} />
      <rect x={p} y={p} width={h * 0.09} height={3} style={SIGNAL} />
      <rect x={p} y={p + h * 0.1} width={cut * 0.62} height={head} rx={2} fill={LIGHT} />
      <rect x={p} y={p + h * 0.1 + head * 1.3} width={cut * 0.4} height={head} rx={2} fill={LIGHT} />
      {range(3).map((i) => (
        <rect key={i} x={p + cut * 0.36} y={h * 0.62 + i * h * 0.075} width={cut * (0.4 - i * 0.07)} height={h * 0.028} rx={2} fill={BAR} />
      ))}
      <rect x={p} y={h * 0.62} width={cut * 0.22} height={h * 0.028} rx={2} fill={STRONG} />
      <rect x={cut + p} y={p} width={h * 0.12} height={h * 0.03} rx={1} fill={PAPER_INK} />
      <rect x={cut + p} y={p + h * 0.1} width={(w - cut) * 0.55} height={head * 0.8} rx={2} fill="#2a2a2e" />
      <rect x={cut + p} y={h * 0.5} width={w - cut - 2 * p} height={h * 0.5 - p} rx={h * 0.06} fill="#b6b6ba" />
    </>
  );
};

/* Media cards on a track that starts on the rail and bleeds right; the
   focused card leads, a thin progress line under the track. */
const cardTrack: Draw = (w, h) => {
  const ch = h * 0.66;
  const cw = ch * 0.78;
  const gap = h * 0.055;
  const x0 = w * 0.07;
  const y = h * 0.12;
  const count = Math.ceil((w - x0) / (cw + gap)) + 1;
  const railY = y + ch + h * 0.1;
  return (
    <>
      {range(count).map((i) => {
        const x = x0 + i * (cw + gap) + (i > 0 ? gap * 0.6 : 0);
        const lead = i === 0;
        return (
          <g key={i}>
            <rect x={x} y={y} width={cw} height={ch} rx={h * 0.05} fill={lead ? RAISED : SURFACE} stroke={lead ? "rgba(255,255,255,0.35)" : LINE} />
            <rect x={x + 6} y={y + 6} width={cw - 12} height={ch * 0.66} rx={h * 0.035} fill={lead ? STRONG : BAR} />
            <rect x={x + 10} y={y + ch * 0.78} width={cw * 0.55} height={h * 0.03} rx={2} fill={lead ? LIGHT : BAR} />
          </g>
        );
      })}
      <rect x={x0} y={railY} width={w * 0.86} height={2} fill={LINE} />
      <rect x={x0} y={railY} width={w * 0.2} height={2} style={SIGNAL} />
    </>
  );
};

/* A 2×2 board of steps, the active one framed; an indexed progress strip
   on the left. */
const processSequence: Draw = (w, h) => {
  const p = h * 0.13;
  const bx = w * 0.38;
  const g = h * 0.06;
  const tw = (w - bx - p - g) / 2;
  const th = (h - 2 * p - g) / 2;
  const segW = (w * 0.26 - 3 * 6) / 4;
  return (
    <>
      <rect x={p} y={p} width={w * 0.06} height={h * 0.035} rx={1} fill={LIGHT} />
      <rect x={p} y={p + h * 0.12} width={w * 0.2} height={h * 0.09} rx={2} fill={STRONG} />
      <rect x={p} y={p + h * 0.26} width={w * 0.14} height={h * 0.09} rx={2} fill={STRONG} />
      {range(4).map((i) => (
        <rect key={i} x={p + i * (segW + 6)} y={h - p - 4} width={segW} height={4} rx={2} fill={i === 0 ? undefined : RAISED} style={i === 0 ? SIGNAL : undefined} />
      ))}
      {range(4).map((i) => {
        const x = bx + (i % 2) * (tw + g);
        const y = p + Math.floor(i / 2) * (th + g);
        const active = i === 0;
        return (
          <g key={i}>
            <rect x={x} y={y} width={tw} height={th} rx={h * 0.05} fill={active ? RAISED : SURFACE} stroke={active ? "rgba(255,255,255,0.55)" : LINE} />
            <rect x={x + th * 0.14} y={y + th * 0.18} width={th * 0.16} height={th * 0.16} rx={2} fill={active ? LIGHT : BAR} />
            <rect x={x + tw * 0.42} y={y + th * 0.14} width={tw * 0.5} height={th * 0.72} rx={h * 0.03} fill={active ? STRONG : BAR} />
          </g>
        );
      })}
    </>
  );
};

/* Intro split, indexed rows, a 7/5 ↔ 5/7 proof grid, a paper payoff band. */
const storyBlocks: Draw = (w, h) => {
  const p = h * 0.12;
  const band = h * 0.2;
  const top = h - band;
  const ax = p;
  const bx = w * 0.3;
  const cx = w * 0.58;
  const rowH = (top - 2 * p) / 4;
  const gx = (w - p - cx - 8) / 12;
  const gh = (top - 2 * p - 8) / 2;
  return (
    <>
      <rect x={ax} y={p} width={w * 0.2} height={h * 0.08} rx={2} fill={LIGHT} />
      <rect x={ax} y={p + h * 0.11} width={w * 0.13} height={h * 0.08} rx={2} fill={LIGHT} />
      <rect x={ax} y={p + h * 0.27} width={w * 0.17} height={h * 0.025} rx={2} fill={BAR} />
      <rect x={ax} y={p + h * 0.32} width={w * 0.12} height={h * 0.025} rx={2} fill={BAR} />
      {range(4).map((i) => (
        <g key={i}>
          <rect x={bx} y={p + i * rowH + rowH * 0.3} width={rowH * 0.4} height={rowH * 0.4} rx={2} fill={i === 0 ? undefined : STRONG} style={i === 0 ? SIGNAL : undefined} />
          <rect x={bx + rowH * 0.8} y={p + i * rowH + rowH * 0.4} width={w * (0.18 - i * 0.02)} height={rowH * 0.2} rx={2} fill={BAR} />
          {i > 0 && <rect x={bx} y={p + i * rowH} width={w * 0.24} height={1} fill={LINE} />}
        </g>
      ))}
      <rect x={cx} y={p} width={gx * 7} height={gh} rx={h * 0.04} fill={STRONG} />
      <rect x={cx + gx * 7 + 8} y={p} width={gx * 5} height={gh} rx={h * 0.04} fill={RAISED} />
      <rect x={cx} y={p + gh + 8} width={gx * 5} height={gh} rx={h * 0.04} fill={RAISED} />
      <rect x={cx + gx * 5 + 8} y={p + gh + 8} width={gx * 7} height={gh} rx={h * 0.04} fill={BAR} />
      <rect y={top} width={w} height={band} fill={PAPER} />
      <rect x={ax} y={top + band * 0.38} width={w * 0.34} height={band * 0.24} rx={2} fill="#2a2a2e" />
      <rect x={w - p - w * 0.13} y={top + band * 0.22} width={w * 0.13} height={band * 0.56} rx={band * 0.14} fill="#151517" />
    </>
  );
};

/* Booking chassis: progress edge, month grid with one chosen day, slot
   chips and the summary plate with its white command. */
const reservation: Draw = (w, h) => {
  const p = h * 0.1;
  const sw = w * 0.56;
  const sh = h - 2 * p;
  const ip = sh * 0.12;
  const cols = 7;
  const rows = 4;
  const gridY = p + ip + sh * 0.14;
  const cell = Math.min((sw - 2 * ip) / cols, (sh - (gridY - p) - ip) / rows);
  const gridW = cell * cols;
  const rx = w * 0.64;
  const chipW = (w - p - rx - 16) / 3;
  const chipH = h * 0.11;
  return (
    <>
      <rect x={p} y={p} width={sw} height={sh} rx={h * 0.08} fill={SURFACE} stroke={LINE} />
      <rect x={p + ip} y={p + ip * 0.7} width={sw - 2 * ip} height={2} fill={LINE} />
      <rect x={p + ip} y={p + ip * 0.7} width={(sw - 2 * ip) * 0.4} height={2} style={SIGNAL} />
      {range(cols * rows).map((i) => {
        const cx = p + ip + (i % cols) * cell + (sw - 2 * ip - gridW) / 2;
        const cy = gridY + Math.floor(i / cols) * cell;
        const chosen = i === 10;
        return (
          <rect
            key={i}
            x={cx + cell * 0.14}
            y={cy + cell * 0.14}
            width={cell * 0.72}
            height={cell * 0.72}
            rx={cell * 0.2}
            fill={chosen ? "#e6e6e9" : i % 6 === 5 ? SURFACE : RAISED}
          />
        );
      })}
      {range(6).map((i) => (
        <rect key={i} x={rx + (i % 3) * (chipW + 8)} y={p + Math.floor(i / 3) * (chipH + 8)} width={chipW} height={chipH} rx={chipH / 2} fill={i === 1 ? "rgba(255,255,255,0.14)" : RAISED} stroke={i === 1 ? undefined : LINE} style={i === 1 ? SIGNAL_STROKE : undefined} />
      ))}
      <rect x={rx} y={h - p - h * 0.42} width={w - p - rx} height={h * 0.42} rx={h * 0.06} fill={SURFACE} stroke={LINE} />
      <rect x={rx + 12} y={h - p - h * 0.32} width={(w - p - rx) * 0.5} height={h * 0.04} rx={2} fill={BAR} />
      <rect x={rx + 12} y={h - p - h * 0.16} width={(w - p - rx) - 24} height={h * 0.1} rx={h * 0.03} fill="#e6e6e9" />
    </>
  );
};

/* Portal modal over a dimmed page: chapter strip, a 5/12 selection board
   and the 7/12 stage. */
const dossier: Draw = (w, h) => {
  const mx = w * 0.1;
  const my = h * 0.1;
  const mw = w - 2 * mx;
  const mh = h - 2 * my;
  const ip = mh * 0.1;
  const stripY = my + ip;
  const bodyY = stripY + mh * 0.12;
  const bodyH = my + mh - ip - bodyY;
  const left = (mw - 2 * ip) * (5 / 12);
  const segW = (mw - 2 * ip - 4 * 6) / 5;
  const cellW = (left - 8) / 2;
  const cellH = (bodyH - 16) / 3;
  return (
    <>
      {range(5).map((i) => (
        <rect key={i} x={w * 0.02} y={h * (0.08 + i * 0.2)} width={w * (0.3 + (i % 3) * 0.08)} height={h * 0.05} rx={2} fill={SURFACE} />
      ))}
      <rect width={w} height={h} fill="rgba(0,0,0,0.45)" />
      <rect x={mx} y={my} width={mw} height={mh} rx={h * 0.08} fill="#141416" stroke="rgba(255,255,255,0.14)" />
      {range(5).map((i) => (
        <rect key={i} x={mx + ip + i * (segW + 6)} y={stripY} width={segW} height={3} rx={1.5} fill={i < 2 ? LIGHT : i === 2 ? undefined : RAISED} style={i === 2 ? SIGNAL : undefined} />
      ))}
      {range(6).map((i) => {
        const x = mx + ip + (i % 2) * (cellW + 8);
        const y = bodyY + Math.floor(i / 2) * (cellH + 8);
        const sel = i === 2;
        return <rect key={i} x={x} y={y} width={cellW} height={cellH} rx={h * 0.03} fill={sel ? "#2b2b30" : RAISED} stroke={sel ? "rgba(255,255,255,0.7)" : undefined} />;
      })}
      <rect x={mx + ip + left + 12} y={bodyY} width={mw - 2 * ip - left - 12} height={bodyH} rx={h * 0.05} fill={STRONG} />
      <rect x={mx + ip + left + 12 + 14} y={bodyY + bodyH - 14 - h * 0.04} width={(mw - 2 * ip - left) * 0.35} height={h * 0.04} rx={2} fill={LIGHT} />
    </>
  );
};

/* .7/1.3: joined selector rows (active bar 22 vs 7) beside a 4:3 stage
   split by a before/after handle. */
const selectorStage: Draw = (w, h, uid) => {
  const p = h * 0.12;
  const total = w - 2 * p - 16;
  const lw = total * (0.7 / 2);
  const sx = p + lw + 16;
  const sw = total - lw;
  const rowH = (h - 2 * p) / 4;
  const split = sx + sw * 0.46;
  return (
    <>
      {range(4).map((i) => {
        const y = p + i * rowH;
        const active = i === 1;
        return (
          <g key={i}>
            <rect x={p} y={y} width={lw} height={rowH} fill={active ? RAISED : SURFACE} />
            {i > 0 && <rect x={p} y={y} width={lw} height={1} fill={LINE} />}
            <rect x={p + 12} y={y + rowH * 0.36} width={lw * 0.5} height={rowH * 0.16} rx={2} fill={active ? LIGHT : BAR} />
            <rect x={p + 12} y={y + rowH * 0.66} width={active ? 22 : 7} height={2} fill={active ? undefined : STRONG} style={active ? SIGNAL : undefined} />
          </g>
        );
      })}
      <clipPath id={`${uid}-stage`}>
        <rect x={sx} y={p} width={sw} height={h - 2 * p} rx={h * 0.06} />
      </clipPath>
      <g clipPath={`url(#${uid}-stage)`}>
        <rect x={sx} y={p} width={sw} height={h - 2 * p} fill="#2a2a2f" />
        <rect x={split} y={p} width={sx + sw - split} height={h - 2 * p} fill="#56565e" />
        <circle cx={sx + sw * 0.3} cy={h * 0.55} r={h * 0.16} fill="#3a3a40" />
        <circle cx={sx + sw * 0.72} cy={h * 0.5} r={h * 0.2} fill="#74747c" />
      </g>
      <rect x={split - 1} y={p} width={2} height={h - 2 * p} fill="#e6e6e9" />
      <circle cx={split} cy={h / 2} r={h * 0.055} fill="#e6e6e9" />
    </>
  );
};

/* The control family: white plate command, outline command, chips with
   one chosen, a field, segmented progress, a switch. */
const controls: Draw = (w, h) => {
  const p = h * 0.14;
  const bh = h * 0.16;
  const c2 = w * 0.36;
  const c3 = w * 0.68;
  const chipW = w * 0.075;
  const seg = (w - p - c3 - 4 * 5) / 5;
  return (
    <>
      <rect x={p} y={p} width={w * 0.2} height={bh} rx={h * 0.055} fill="#e6e6e9" />
      <rect x={p + w * 0.05} y={p + bh * 0.42} width={w * 0.1} height={bh * 0.16} rx={1} fill="#2a2a2e" />
      <rect x={p} y={p + bh + 12} width={w * 0.2} height={bh} rx={h * 0.055} fill="none" stroke="rgba(255,255,255,0.3)" />
      <rect x={p + w * 0.05} y={p + bh * 1.42 + 12} width={w * 0.1} height={bh * 0.16} rx={1} fill={STRONG} />
      {range(3).map((i) => (
        <rect key={i} x={c2 + i * (chipW + 8)} y={p} width={chipW} height={bh * 0.8} rx={bh * 0.4} fill={i === 0 ? "rgba(255,255,255,0.14)" : RAISED} stroke={i === 0 ? undefined : LINE} style={i === 0 ? SIGNAL_STROKE : undefined} />
      ))}
      <rect x={c2} y={p + bh + 12} width={w * 0.24} height={bh * 1.2} rx={h * 0.05} fill={SURFACE} stroke="rgba(255,255,255,0.18)" />
      <rect x={c2 + 12} y={p + bh + 12 + bh * 0.48} width={w * 0.09} height={bh * 0.22} rx={1} fill={BAR} />
      <rect x={c2 + 12 + w * 0.1} y={p + bh + 12 + bh * 0.36} width={1.5} height={bh * 0.48} fill={LIGHT} />
      {range(5).map((i) => (
        <rect key={i} x={c3 + i * (seg + 5)} y={p + bh * 0.35} width={seg} height={4} rx={2} fill={i < 2 ? LIGHT : RAISED} />
      ))}
      <rect x={c3} y={p + bh + 12} width={bh * 2} height={bh * 1.1} rx={bh * 0.55} fill={STRONG} />
      <circle cx={c3 + bh * 2 - bh * 0.55} cy={p + bh + 12 + bh * 0.55} r={bh * 0.4} fill="#e6e6e9" />
      <rect x={p} y={h - p - h * 0.03} width={w - 2 * p} height={1} fill={LINE} />
      <rect x={p} y={h - p - h * 0.03} width={w * 0.08} height={1} style={SIGNAL} />
    </>
  );
};

/* The finder capsule unfolded: wordmark, three pills, the live one lit,
   a card tray centred under it. */
const navbar: Draw = (w, h) => {
  const ch = h * 0.2;
  const cw = Math.min(w * 0.7, ch * 13);
  const cx = (w - cw) / 2;
  const cy = h * 0.1;
  const pill = (cw - ch * 3.6) / 3 - 8;
  const pillX = (i: number) => cx + ch * 3.2 + i * (pill + 8);
  const trayW = Math.min(pill * 1.9, w * 0.4);
  const trayX = pillX(1) + pill / 2 - trayW / 2;
  const trayY = cy + ch + h * 0.06;
  const cardH = (h - trayY - h * 0.08 - 12) / 2;
  return (
    <>
      <rect x={cx} y={cy} width={cw} height={ch} rx={ch / 2} fill="#1f1f23" stroke="rgba(255,255,255,0.16)" />
      <rect x={cx + ch * 0.5} y={cy + ch * 0.36} width={ch * 2.2} height={ch * 0.28} rx={2} fill={LIGHT} />
      {range(3).map((i) => (
        <g key={i}>
          <rect x={pillX(i)} y={cy + ch * 0.16} width={pill} height={ch * 0.68} rx={ch * 0.34} fill={i === 1 ? "#3a3a41" : RAISED} />
          <rect x={pillX(i) + pill * 0.25} y={cy + ch * 0.44} width={pill * 0.5} height={ch * 0.12} rx={1} fill={i === 1 ? "#cfcfd4" : STRONG} />
        </g>
      ))}
      <rect x={pillX(1) + pill * 0.3} y={cy + ch * 0.84 - 2} width={pill * 0.4} height={2} style={SIGNAL} />
      <rect x={trayX} y={trayY} width={trayW} height={h - trayY - h * 0.04} rx={h * 0.06} fill="#161618" stroke="rgba(255,255,255,0.12)" />
      {range(2).map((i) => (
        <rect key={i} x={trayX + 8} y={trayY + 8 + i * (cardH + 6)} width={trayW - 16} height={cardH} rx={h * 0.04} fill={i === 0 ? STRONG : BAR} />
      ))}
    </>
  );
};

const DRAW: Record<string, Draw> = {
  chapter,
  "card-track": cardTrack,
  "process-sequence": processSequence,
  "story-blocks": storyBlocks,
  reservation,
  dossier,
  "selector-stage": selectorStage,
  controls,
  navbar,
};

/* Real crops of each showcase (public/library/covers/<id>-<variant>.webp,
   banner 900×216, card 1280×800). The SVG stays as the fallback. */
const PHOTO = new Set(["chapter", "card-track", "process-sequence", "story-blocks", "reservation", "dossier", "selector-stage", "controls", "navbar"]);
const PHOTO_SIZE: Record<CoverVariant, [number, number]> = { banner: [900, 216], card: [1280, 800] };

export const coverSrc = (id: string, variant: CoverVariant) => (PHOTO.has(id) ? `/library/covers/${id}-${variant}.webp` : undefined);

export function Cover({ id, variant = "card", className }: { id: string; variant?: CoverVariant; className?: string }) {
  const uid = useId().replace(/:/g, "");
  // One transient error (dev server busy, flaky network) retries once
  // before the drawing takes over for good.
  const [attempt, setAttempt] = useState(0);
  const src = coverSrc(id, variant);
  if (src && attempt < 2) {
    const [pw, ph] = PHOTO_SIZE[variant];
    return (
      <img
        key={attempt}
        src={attempt ? `${src}?retry=1` : src}
        alt=""
        width={pw}
        height={ph}
        decoding="async"
        draggable={false}
        className={className ? `lib-cover ${className}` : "lib-cover"}
        onError={() => window.setTimeout(() => setAttempt((a) => a + 1), attempt ? 0 : 600)}
      />
    );
  }
  const draw = DRAW[id];
  if (!draw) return null;
  const [w, h] = SIZE[variant];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={className} width="100%" height="100%" aria-hidden="true" focusable="false">
      {draw(w, h, uid)}
    </svg>
  );
}
