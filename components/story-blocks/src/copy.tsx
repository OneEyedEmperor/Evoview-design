import { createContext, useContext } from "react";
import { buildStoryBlocksConfig, defaultStoryBlocksLocale, type StoryBlocksCopy } from "./story-blocks.config";

const StoryCopyContext = createContext<StoryBlocksCopy | null>(null);

export const StoryCopyProvider = StoryCopyContext.Provider;

export function useStoryCopy(): StoryBlocksCopy {
  return useContext(StoryCopyContext) ?? buildStoryBlocksConfig(defaultStoryBlocksLocale).copy;
}
