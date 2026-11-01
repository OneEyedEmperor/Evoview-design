/* Default `sizes` per block, from the page-rhythm layout (story-blocks.css on
   foundation's rail): the wide rail is `100vw − 2 gutters`, capped at 85em.
   Upper bounds where the scale varies (1280+: 1240px = 85em at the largest
   --ev-scale). Inside a dossier the rail is narrower: these overestimate
   (a larger candidate, never a blurry one); pass `media.sizes` to tighten. */

type Band = { min: number; vw: number; px: number; rem: number };

/** Content width per breakpoint: W = vw% · 100vw + px. */
const BANDS: Band[] = [
  { min: 1280, vw: 0, px: 1240, rem: 14.6 },
  { min: 1024, vw: 1, px: -83, rem: 13.76 },
  { min: 768, vw: 1, px: -55, rem: 13.76 },
  { min: 640, vw: 1, px: -64, rem: 16 },
  { min: 0, vw: 1, px: -40, rem: 16 },
];

const round = (n: number) => Math.round(n * 100) / 100;

/** `sizes` for a width of `k · W + m(rem)` in each band. */
function railSizes(width: (band: Band) => { k: number; m: number }): string {
  return BANDS.map((band) => {
    const { k, m } = width(band);
    const vw = round(k * band.vw * 100);
    const px = Math.round(k * band.px + m);
    const value = vw === 0 ? `${px}px` : px === 0 ? `${vw}vw` : `calc(${vw}vw ${px < 0 ? "-" : "+"} ${Math.abs(px)}px)`;
    return band.min ? `(min-width: ${band.min}px) ${value}` : value;
  }).join(", ");
}

/** StoryIntro hero: the full rail at every width. */
export const STORY_INTRO_SIZES = railSizes(() => ({ k: 1, m: 0 }));

/** IndexedRows media: the 1.28 side of a .72 / 1.28 split (gap 3.5em) from 1024, the full rail below. */
export const STORY_SEQUENCE_SIZES = railSizes((band) => (band.min >= 1024 ? { k: 0.64, m: -0.64 * 3.5 * band.rem } : { k: 1, m: 0 }));

/** ProofGrid item: `span` of 12 columns (gap 2.9em) from 768; below, full rail or half (gap .75em) for paired portraits. */
export function storyProofSizes(span: number, half: boolean): string {
  return railSizes((band) => {
    if (band.min >= 768) {
      const gap = 2.9 * band.rem;
      return { k: span / 12, m: (span / 12) * gap - gap };
    }
    return half ? { k: 0.5, m: -0.375 * band.rem } : { k: 1, m: 0 };
  });
}
