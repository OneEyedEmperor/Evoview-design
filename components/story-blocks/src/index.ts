import "../foundation";
import "../controls";
import "./story-blocks.css";
import "./story-blocks.theme.css";

export { Story, renderChapter, type StoryProps } from "./Story";
export { StoryIntro, IndexedRows, ProofGrid, PayoffBand } from "./blocks";
export { StoryFigure, Reveal } from "./parts";
export { STORY_INTRO_SIZES, STORY_SEQUENCE_SIZES, storyProofSizes } from "./sizes";
export { StoryCopyProvider, useStoryCopy } from "./copy";
export { buildStoryBlocksConfig, defaultStoryBlocksLocale, type Locale, type StoryBlocksConfig, type StoryBlocksCopy } from "./story-blocks.config";
export type {
  IndexedRow,
  IndexedRowsProps,
  Lines,
  PayoffBandProps,
  PayoffCta,
  PayoffResult,
  ProofGridProps,
  ProofItem,
  StoryChapter,
  StoryIntroProps,
  StoryMedia,
} from "./types";
export { STORY_INTRO_ALIGNS, INDEXED_ROWS_SURFACES, PROOF_GRID_HEADING_POSITIONS, type StoryIntroAlign, type IndexedRowsSurface, type ProofGridHeadingAt } from "./types";
