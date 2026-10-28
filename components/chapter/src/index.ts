import "../foundation";
import "../controls";
import "./chapter.css";
import "./chapter-faq.css";
import "./chapter-footer-panel.css";
import "./ChapterStory.css";
import "./chapter-contact.css";
import "./chapter.theme.css";

export { Chapter, ChapterHeading, ChapterMark, ChapterTicker, chapterNavSections } from "./Chapter";
export type { ChapterProps, ChapterHeadingProps, ChapterTickerProps, ChapterTone, ChapterRhythm, ChapterRail } from "./Chapter";
export { ChapterFooter, type ChapterFooterProps, type ChapterFooterLayout } from "./ChapterFooter";
export { buildChapterConfig, type ChapterConfig, type ChapterFooterLink, type Locale } from "./chapter.config";
export type { ChapterFooterSocial, ChapterFooterContact } from "./chapter.config";
export { ChapterFaq, chapterFaqJsonLd, type ChapterFaqProps, type ChapterFaqLayout } from "./ChapterFaq";
export { buildChapterFaqConfig, type ChapterFaqConfig, type ChapterFaqItem } from "./chapter.config";
export { ChapterStory, type ChapterStoryProps, type ChapterStoryContent, type ChapterStoryMedia, type ChapterStoryLayout, type ChapterStoryDensity } from "./ChapterStory";
export { buildChapterStoryConfig, type ChapterStoryConfig } from "./chapter.config";
export {
  ChapterContact,
  type ChapterContactProps,
  type ChapterContactConfig,
  type ChapterContactChannel,
  type ChapterContactHours,
  type ChapterContactLayout,
  type ChapterContactHoursView,
} from "./ChapterContact";
export { buildChapterContactConfig } from "./chapter.config";
export { CHAPTER_HEADING_LAYOUTS, CHAPTER_HEADING_VARIANTS, type ChapterHeadingLayout, type ChapterHeadingVariant } from "./Chapter";
export { CHAPTER_STORY_LAYOUTS, CHAPTER_STORY_DENSITIES } from "./ChapterStory";
export { CHAPTER_FAQ_LAYOUTS } from "./ChapterFaq";
export { CHAPTER_CONTACT_LAYOUTS, CHAPTER_CONTACT_HOURS_VIEWS } from "./ChapterContact";
export { CHAPTER_FOOTER_LAYOUTS } from "./ChapterFooter";
