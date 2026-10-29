import "../foundation";
import "../controls";
import "./dossier.css";
import "./dossier.theme.css";

export { Dossier, type DossierProps, type DossierRouteProps, type DossierLegacyProps } from "./Dossier";
export { dossierRoutes, type DossierView } from "./routes";
export { SelectionBoard, SELECTION_BOARD_LAYOUTS, type SelectionBoardProps, type SelectionBoardLayout, type SelectionTile } from "./Board";
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
  type ChapterRowsProps,
  type ChapterPayoffProps,
} from "./Chapters";
export { buildDossierConfig, dossierCopy } from "./dossier.config";
export type { DossierConfig, DossierItem, DossierEntry, DossierEntryContext, DossierMedia, DossierCopy, DossierOpening, DossierComposition, DossierTileMedia, Locale } from "./types";
export { DOSSIER_COMPOSITIONS, DOSSIER_TILE_MEDIA } from "./types";
export { DOSSIER_CHAPTER_VARIANTS, CHAPTER_ROWS_SURFACES, type DossierChapterVariant, type ChapterRowsSurface } from "./Chapters";
