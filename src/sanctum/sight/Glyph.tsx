/* A small drawing of a cord's course, chosen by what the kind does (its role),
   in the kind's colour. The lexicon is drawn, not described. */

import type { CordRole } from "./geometry";

export function Glyph({ role, colour, dim = false, size = 44 }: { role: CordRole; colour: string; dim?: boolean; size?: number }) {
  const o = dim ? 0.32 : 1;
  const c = colour;
  const s = (d: string, w = 1.6, a = 1) => <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" opacity={a * o} />;
  const dot = (x: number, y: number, r = 2.2, f = c) => <circle cx={x} cy={y} r={r} fill={f} opacity={o} />;
  const halo = (x: number, y: number, r = 5) => <circle cx={x} cy={y} r={r} fill={c} opacity={0.22 * o} />;
  let body;
  switch (role) {
    case "bond":
      body = <>{s("M8 13 Q22 10.5 36 13")}<rect x="3" y="9.5" width="7" height="7" rx="1.6" fill={c} opacity={0.75 * o} /><rect x="34" y="9.5" width="7" height="7" rx="1.6" fill={c} opacity={0.75 * o} /></>;
      break;
    case "cross":
      body = <>{s("M22 11 L22 2")}{s("M22 11 L36 11")}{s("M22 11 L22 20")}{s("M22 11 L8 11")}{halo(22, 11)}{dot(22, 11, 2.6)}</>;
      break;
    case "gather":
      body = <>{s("M4 3 Q20 6 36 11", 1.3)}{s("M4 11 L36 11", 1.3)}{s("M4 19 Q20 16 36 11", 1.3)}{halo(37, 11, 5.5)}{dot(37, 11, 2.8)}</>;
      break;
    case "held":
      body = <>{s("M6 11 L38 11", 3.2)}{s("M6 11 L38 11", 7, 0.16)}{dot(6, 11, 3)}{dot(38, 11, 3)}</>;
      break;
    case "return":
      body = <>{s("M3 11 C14 4 26 18 41 11", 1.4, 0.75)}{dot(10, 8.6, 1.3)}{dot(21, 11.4, 2.4)}{halo(33, 12.6, 4.5)}{dot(33, 12.6, 3)}{dot(41, 11, 2.4, "#fff")}</>;
      break;
    case "steer":
      body = <>{s("M38 11 C30 2 14 2 8 9 C4 14 10 19 16 15", 1.5)}{halo(16, 15, 4)}{dot(16, 15, 2.2)}{dot(38, 11, 2.4, "#fff")}</>;
      break;
    case "oath":
      body = <>{s("M5 11 L39 11", 1.8)}{dot(5, 11, 2.4)}{dot(39, 11, 2.4)}</>;
      break;
    case "thrust":
      body = <><path d="M4 11 L36 9.6 L42 11 L36 12.4 Z" fill={c} opacity={o} />{s("M4 11 L30 11", 5, 0.15)}</>;
      break;
    case "union":
      body = <>{s("M7 11 C15 3 29 3 37 11 C29 19 15 19 7 11 Z", 1.5)}{dot(7, 11, 2.6)}{dot(37, 11, 2.6)}{halo(22, 5.2, 3.5)}{halo(22, 16.8, 3.5)}</>;
      break;
  }
  return (
    <svg width={size} height={(size * 22) / 44} viewBox="0 0 44 22" aria-hidden="true" style={{ flex: "none", overflow: "visible" }}>
      {body}
    </svg>
  );
}
