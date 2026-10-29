/** The disclosure trigger of the nearest region around `el` that one controls (`aria-controls` names its id). */
function triggerOf(el: HTMLElement): HTMLElement | null {
  for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
    if (!node.id) continue;
    const trigger = document.querySelector(`[aria-controls~="${CSS.escape(node.id)}"]`);
    if (trigger instanceof HTMLElement && trigger !== el && !node.contains(trigger)) return trigger;
  }
  return null;
}

/**
 * Gives focus back to a modal's launcher. A launcher that can no longer take it (inside a disclosure that closed
 * meanwhile: inert, hidden) hands it to that disclosure's trigger (`aria-controls`), up through nested
 * disclosures. Returns whether something took focus; a disconnected launcher takes nothing.
 */
export function restoreFocus(target: HTMLElement | null, options: FocusOptions = { preventScroll: true }): boolean {
  let el = target;
  for (let hop = 0; el && el.isConnected && hop < 8; hop += 1) {
    el.focus(options);
    if (document.activeElement === el) return true;
    el = triggerOf(el);
  }
  return false;
}
