// Base sheets first: package rules override foundation type roles at equal specificity.
import "../foundation";
import "../controls";
import "./selector-stage.css";
import "./selector-stage.theme.css";

export { SelectorStage, type SelectorStageProps } from "./SelectorStage";
export { CompareToggle, type CompareToggleProps } from "./CompareToggle";
export { ProofAtlas, type ProofAtlasProps } from "./ProofAtlas";
export { buildSelectorStageConfig, defaultSelectorStageLocale, type SelectorStageConfig } from "./selector-stage.config";
export type {
  AtlasContent,
  AtlasItem,
  CompareContent,
  CompareState,
  Locale,
  SelectorOption,
  SelectorStageContent,
  SelectorStageCopy,
  StageMedia,
  StageVisual,
  Tone,
} from "./types";
export { COMPARE_TOGGLE_MODES, type CompareToggleMode } from "./CompareToggle";
