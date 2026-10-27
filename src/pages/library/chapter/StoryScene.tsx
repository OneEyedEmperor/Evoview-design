import { useMemo, useState } from "react";
import {
  ChapterStory,
  buildChapterStoryConfig,
  type ChapterStoryDensity,
  type ChapterStoryLayout,
} from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk, deskOptions } from "../scene/Scene";

/* The story chapter after a hero: where the text sits against the client's
   pictures, and how many lanes carry them. Both settings change the
   composition at every width; the chapter itself stays one ChapterStory. */

const T = {
  fr: {
    name: "Récit",
    when: "Le chapitre qui suit l'accueil : l'histoire du client, portée par ses images qui dérivent au rythme du défilement.",
    controls: {
      layout: { label: "Texte", options: { start: "Gauche", center: "Centre", end: "Droite", above: "Dessus" } },
      density: { label: "Images", options: { ample: "Amples", dense: "Denses" } },
    },
  },
  en: {
    name: "Story",
    when: "The chapter after the hero: the client's story, carried by its pictures drifting with the scroll.",
    controls: {
      layout: { label: "Text", options: { start: "Left", center: "Centre", end: "Right", above: "Above" } },
      density: { label: "Pictures", options: { ample: "Ample", dense: "Dense" } },
    },
  },
} satisfies Record<Locale, unknown>;

export default function StoryScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const content = useMemo(() => buildChapterStoryConfig(locale), [locale]);
  const [layout, setLayout] = useState<ChapterStoryLayout>("start");
  const [density, setDensity] = useState<ChapterStoryDensity>("dense");

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="dark"
      rhythm="compact"
      desk={
        <SceneDesk>
          <DeskSetting label={t.controls.layout.label}>
            <SegmentedControl
              block
              label={t.controls.layout.label}
              options={deskOptions(t.controls.layout.options)}
              value={layout}
              onChange={(v) => setLayout(v as ChapterStoryLayout)}
            />
          </DeskSetting>
          <DeskSetting label={t.controls.density.label}>
            <SegmentedControl
              block
              label={t.controls.density.label}
              options={deskOptions(t.controls.density.options)}
              value={density}
              onChange={(v) => setDensity(v as ChapterStoryDensity)}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      {/* The scene caption is the h2: the story heading nests under it. */}
      <ChapterStory id="chs-story" content={content} layout={layout} density={density} tone="dark" rhythm="compact" level={3} />
    </Scene>
  );
}
