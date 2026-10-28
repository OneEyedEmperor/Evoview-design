import { useLayoutEffect } from "react";

/* Page scroll lock for modals. Ref-counted: nested modals unlock in any order,
   the page stays locked until the last release. The overflow goes on the
   element whose overflow reaches the viewport (body, unless the host gives
   <html> an overflow), so sticky elements keep the viewport as their scroller.
   A classic scrollbar's width is kept as body padding and exposed as
   `--ev-scroll-lock-gap` on <html> for fixed elements, which body padding
   doesn't reach. */

export const SCROLL_LOCK_GAP = "--ev-scroll-lock-gap";

let locks = 0;
let unlock: (() => void) | null = null;

function apply(): () => void {
  const { body, documentElement: root } = document;
  const rootStyle = getComputedStyle(root);
  const target = rootStyle.overflowX === "visible" && rootStyle.overflowY === "visible" ? body : root;
  const previous = { overflow: target.style.overflow, paddingRight: body.style.paddingRight };
  const gap = window.innerWidth - root.clientWidth;
  // A stable gutter stays reserved while hidden: nothing to compensate.
  const compensate = gap > 0 && !rootStyle.getPropertyValue("scrollbar-gutter").includes("stable");
  if (compensate) {
    body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gap}px`;
    root.style.setProperty(SCROLL_LOCK_GAP, `${gap}px`);
  }
  target.style.overflow = "hidden";
  return () => {
    const { scrollX: x, scrollY: y } = window;
    target.style.overflow = previous.overflow;
    body.style.paddingRight = previous.paddingRight;
    root.style.removeProperty(SCROLL_LOCK_GAP);
    // Chrome first lays the page out without the returning scrollbar: near the
    // bottom of a page that is shorter at full width, that pass clamps the offset.
    if (window.scrollY !== y || window.scrollX !== x) window.scrollTo({ left: x, top: y, behavior: "instant" });
  };
}

/** Lock page scroll; returns the release function (idempotent). Call from an effect or a handler. */
export function lockScroll(): () => void {
  if (locks++ === 0) unlock = apply();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks > 0) return;
    unlock?.();
    unlock = null;
  };
}

/** For modals: lock page scroll while `active`, applied before paint (no frame of a scrollable or shifted page). */
export function useScrollLock(active: boolean): void {
  useLayoutEffect(() => (active ? lockScroll() : undefined), [active]);
}
