import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, MouseEventHandler, ReactNode, Ref } from "react";
import { ArrowRight, Chevron, Close, cn, SurfaceFill, TextFill, usePressJelly } from "../foundation";
import { useControlsCopy } from "./copy";

type ButtonLike = ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; ref?: Ref<HTMLButtonElement> };
type AnchorLike = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> };

/** Renders an <a> when `href` is set, a <button type="button"> otherwise. Busy keeps focus but ignores clicks. */
function Pressable({ className, children, busy, onClick, ...rest }: (ButtonLike | AnchorLike) & { busy?: boolean }) {
  usePressJelly();
  const handle = onClick as MouseEventHandler<HTMLElement> | undefined;
  const guarded = (e: MouseEvent<HTMLElement>) => {
    if (busy) e.preventDefault();
    else handle?.(e);
  };
  if (typeof rest.href === "string") {
    return (
      <a className={className} aria-busy={busy || undefined} data-ev-jelly="" onClick={guarded} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  const { type = "button", ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={className} aria-busy={busy || undefined} data-ev-jelly="" onClick={guarded} {...button}>
      {children}
    </button>
  );
}

export type PrimaryPlateProps = (ButtonLike | AnchorLike) & {
  children: ReactNode;
  /** Orb icon; arrow by default. */
  icon?: ReactNode;
  /** "md" 54px (flows, bars), "lg" 64px (launcher, closing CTA). */
  size?: "md" | "lg";
  /** Full width of its column (mobile bars, payoff CTA). */
  block?: boolean;
  /** Pending action: spinner in the orb, aria-busy, clicks ignored. */
  busy?: boolean;
};

/** The one primary action: white plate (ink plate on light tones), round orb; hover pours the accent over plate, label and orb (RULES §1). */
export function PrimaryPlate({ children, icon, size = "md", block = false, busy = false, className, ...rest }: PrimaryPlateProps) {
  const copy = useControlsCopy();
  const orb = (
    <span className="evc-plate__orb" aria-hidden="true">
      {busy ? <span className="evc-spinner" /> : (icon ?? <ArrowRight />)}
    </span>
  );
  return (
    <Pressable className={cn("ev-controls evc-plate", size === "lg" && "evc-plate--lg", block && "evc-plate--block", className)} busy={busy} {...rest}>
      <span className="evc-plate__label">
        {children}
        {busy && <span className="ev-sr"> ({copy.busy})</span>}
      </span>
      {orb}
      <SurfaceFill hoverWithin=".evc-plate">
        <span className="evc-plate__label">{children}</span>
        {orb}
      </SurfaceFill>
    </Pressable>
  );
}

export type GhostActionProps = (ButtonLike | AnchorLike) & {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
};

/** Secondary action: text-only readout with an icon, 44px tall (Retour, Voir le détail…). */
export function GhostAction({ children, icon, iconPosition = "start", className, ...rest }: GhostActionProps) {
  return (
    <Pressable className={cn("ev-controls evc-ghost", iconPosition === "end" && "evc-ghost--end", className)} {...rest}>
      {icon && iconPosition === "start" && (
        <span className="evc-ghost__icon" aria-hidden="true">
          <TextFill hoverWithin=".evc-ghost" withFocus={false}>{icon}</TextFill>
        </span>
      )}
      <TextFill hoverWithin=".evc-ghost" withFocus={false}>{children}</TextFill>
      {icon && iconPosition === "end" && (
        <span className="evc-ghost__icon" aria-hidden="true">
          <TextFill hoverWithin=".evc-ghost" withFocus={false}>{icon}</TextFill>
        </span>
      )}
    </Pressable>
  );
}

export type GlassCloseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  /** Accessible name; the locale's "Fermer" by default. */
  label?: string;
  /** Show the label next to the cross (desktop topbar `× FERMER`). */
  showLabel?: boolean;
};

/** Glass chrome close (portals, sheets). */
export function GlassClose({ label, showLabel = false, className, ...rest }: GlassCloseProps) {
  const copy = useControlsCopy();
  usePressJelly();
  const name = label ?? copy.close;
  return (
    <button type="button" className={cn("ev-controls evc-glass evc-close", showLabel && "evc-close--label", className)} aria-label={showLabel ? undefined : name} data-ev-jelly="" {...rest}>
      <Close className="evc-close__icon" />
      {showLabel && <span className="ev-t-label">{name}</span>}
    </button>
  );
}

export type PagerOrbProps = (ButtonLike | AnchorLike) & {
  direction: "prev" | "next";
  /** Accessible name; "Précédent" / "Suivant" by default. Name the target when known. */
  label?: string;
};

/** Round glass pager (previous / next item in a portal header). With `href` it is a link (a modal view's URL: pair it with `followRouteLink` in `onClick`); without a target, render it without `href` and `disabled`. */
export function PagerOrb({ direction, label, className, ...rest }: PagerOrbProps) {
  const copy = useControlsCopy();
  return (
    <Pressable
      className={cn("ev-controls evc-glass evc-pager", `evc-pager--${direction}`, className)}
      aria-label={label ?? (direction === "prev" ? copy.previous : copy.next)}
      {...rest}
    >
      <Chevron dir={direction === "prev" ? "left" : "right"} />
    </Pressable>
  );
}
