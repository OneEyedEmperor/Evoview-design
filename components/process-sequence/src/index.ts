import "../foundation";
import "../controls";
import "./process-sequence.css";

export { ProcessSequence, type ProcessSequenceProps } from "./ProcessSequence";
export { processSequenceRoutes } from "./routes";
export { StepDossier, STEP_DOSSIER_EXIT_MS, type StepDossierProps } from "./StepDossier";
export { StepCard } from "./StepCard";
export { buildProcessSequenceConfig, type ProcessSequenceConfigOptions } from "./process-sequence.config";
export type {
  CompletionMark,
  Locale,
  ProcessSequenceConfig,
  ProcessSequenceCopy,
  ProcessSequenceCta,
  ProcessSequenceView,
  ProcessStep,
  StepDetail,
  StepMedia,
  StepState,
} from "./types";
export { COMPLETION_MARKS } from "./types";
