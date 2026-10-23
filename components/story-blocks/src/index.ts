import "../foundation";
import "../controls";
import "./story-blocks.css";

export { Story, renderChapter, type StoryProps } from "./Story";
export { StoryIntro, IndexedRows, ProofGrid, PayoffBand } from "./blocks";
export { StoryFigure, Reveal } from "./parts";
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
