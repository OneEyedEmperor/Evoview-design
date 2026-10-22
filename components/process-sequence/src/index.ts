import "../foundation";
import "../controls";
import "./process-sequence.css";

export { ProcessSequence, type ProcessSequenceProps } from "./ProcessSequence";
export { StepDossier, type StepDossierProps } from "./StepDossier";
export { StepCard } from "./StepCard";
export { buildProcessSequenceConfig, type ProcessSequenceConfigOptions } from "./process-sequence.config";
export type {
  CompletionMark,
  Locale,
  ProcessSequenceConfig,
  ProcessSequenceCopy,
  ProcessSequenceCta,
  ProcessStep,
  StepDetail,
  StepMedia,
  StepState,
} from "./types";
