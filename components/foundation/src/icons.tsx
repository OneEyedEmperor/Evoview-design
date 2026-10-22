/* Stroke icons shared by the packages (currentColor, decorative). */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function ArrowRight({ className }: IconProps) {
  return <svg className={className} {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function ArrowLeft({ className }: IconProps) {
  return <svg className={className} {...base}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
}

export function ArrowUpRight({ className }: IconProps) {
  return <svg className={className} {...base}><path d="M7 17 17 7M8 7h9v9" /></svg>;
}

export function Check({ className }: IconProps) {
  return <svg className={className} {...base} strokeWidth={3}><path d="M5 12.5 10 17 19 7" /></svg>;
}

export function Close({ className }: IconProps) {
  return <svg className={className} {...base}><path d="M6 6l12 12M18 6 6 18" /></svg>;
}

export function Chevron({ className, dir = "right" }: IconProps & { dir?: "left" | "right" | "up" | "down" }) {
  const d = { left: "m15 18-6-6 6-6", right: "m9 18 6-6-6-6", up: "m18 15-6-6-6 6", down: "m6 9 6 6 6-6" }[dir];
  return <svg className={className} {...base}><path d={d} /></svg>;
}
