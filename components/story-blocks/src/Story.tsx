import type { ReactNode } from "react";
import { cn } from "../foundation";
import { IndexedRows, PayoffBand, ProofGrid, StoryIntro } from "./blocks";
import { StoryCopyProvider } from "./copy";
import type { StoryBlocksCopy } from "./story-blocks.config";
import type { StoryChapter } from "./types";

export type StoryProps = {
  /** Environment of the whole story. A tone cut = a new <Story> with the other tone. */
  tone?: "dark" | "light" | "paper";
  /** "page" = site chapter band (96 / 144 authored) · "dossier" = inside a portal (64 / 96). */
  rhythm?: "page" | "dossier";
  /** Labels (media status); from `buildStoryBlocksConfig(locale).copy`. */
  copy?: StoryBlocksCopy;
  /** Data-driven chapters; or compose the blocks as children. */
  chapters?: readonly StoryChapter[];
  className?: string;
  children?: ReactNode;
};

export function renderChapter(chapter: StoryChapter, key?: number | string): ReactNode {
  switch (chapter.kind) {
    case "intro": {
      const { kind: _, ...props } = chapter;
      return <StoryIntro key={key} {...props} />;
    }
    case "rows": {
      const { kind: _, ...props } = chapter;
      return <IndexedRows key={key} {...props} />;
    }
    case "proof": {
      const { kind: _, ...props } = chapter;
      return <ProofGrid key={key} {...props} />;
    }
    case "payoff": {
      const { kind: _, ...props } = chapter;
      return <PayoffBand key={key} {...props} />;
    }
  }
}

/** Root of one story: tone, rhythm, copy. Children are story blocks. */
export function Story({ tone = "dark", rhythm = "page", copy, chapters, className, children }: StoryProps) {
  const body = (
    <div className={cn("ev-root ev-story-blocks", `ev-tone-${tone}`, className)} data-rhythm={rhythm}>
      {chapters?.map((chapter, i) => renderChapter(chapter, i))}
      {children}
    </div>
  );
  return copy ? <StoryCopyProvider value={copy}>{body}</StoryCopyProvider> : body;
}
