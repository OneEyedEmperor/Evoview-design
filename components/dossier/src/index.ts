import "../foundation";
import "../controls";
import "./dossier.css";

export { Dossier, type DossierProps } from "./Dossier";
export { SelectionBoard, type SelectionBoardProps } from "./Board";
export { DossierLoader, type DossierLoaderProps } from "./Loader";
export {
  DossierChapter,
  ChapterHead,
  ChapterFigure,
  ChapterSplit,
  ChapterRows,
  ChapterSpecimen,
  ChapterPayoff,
  type DossierChapterProps,
  type ChapterHeadProps,
  type ChapterFigureProps,
  type ChapterRow,
  type ChapterPayoffProps,
} from "./Chapters";
export { buildDossierConfig, dossierCopy } from "./dossier.config";
export type { DossierConfig, DossierItem, DossierEntry, DossierEntryContext, DossierMedia, DossierCopy, Locale } from "./types";
