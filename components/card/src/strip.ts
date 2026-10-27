/** Index of the card nearest the strip's centre; at either end of the scroll
    the edge card wins even when it cannot reach the centre (short last scroll). */
export function nearestToCentre(strip: HTMLElement, cards: ArrayLike<Element>): number {
  const count = cards.length;
  const max = strip.scrollWidth - strip.clientWidth;
  if (strip.scrollLeft <= 2) return 0;
  if (max > 0 && strip.scrollLeft >= max - 2) return count - 1;
  const centre = strip.getBoundingClientRect().left + strip.clientWidth / 2;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < count; i++) {
    const r = cards[i].getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - centre);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
