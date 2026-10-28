import "../foundation";
import "../controls";
import "./card-track.css";

export { CardTrack, type CardTrackProps, type CardTrackMode } from "./CardTrack";
export { MediaCard, type MediaCardProps } from "./MediaCard";
export { buildCardTrackConfig } from "./card.config";
// CardDeck
import "./card-deck.css";
export { CardDeck, type CardDeckProps } from "./CardDeck";
export { buildCardDeckConfig } from "./card.config";
export type { CardDeckCategory, CardDeckConfig, CardDeckCopy, CardDeckDefinition } from "./types";
// /CardDeck
// CardSequence
import "./card-sequence.css";
export { CardSequence, type CardSequenceProps } from "./CardSequence";
export { buildCardSequenceConfig } from "./card.config";
export type {
  CardSequenceClip,
  CardSequenceConfig,
  CardSequenceCopy,
  CardSequenceDefinition,
  CardSequenceFact,
  CardSequenceLayout,
  CardSequenceOffer,
} from "./types";
// /CardSequence
import "./card.theme.css";
export type {
  CardHeadingLevel,
  CardTrackConfig,
  CardTrackCopy,
  CardTrackDefinition,
  CardTrackItem,
  CardTrackMedia,
  CardTrackVariant,
  Locale,
} from "./types";
export { CARD_TRACK_VARIANTS, CARD_DECK_ROWS, CARD_SEQUENCE_LAYOUTS, type CardDeckRows } from "./types";
