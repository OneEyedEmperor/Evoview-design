import { useMemo, useState } from "react";
import { CHAPTER_FAQ_LAYOUTS, ChapterFaq, buildChapterFaqConfig, type ChapterFaqLayout } from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk } from "../scene/Scene";

const T = {
  fr: {
    name: "FAQ",
    when: "Avant le contact : les questions que les clients posent, une réponse ouverte à la fois, lisibles par les moteurs de recherche.",
    label: "Mise en page",
    options: { media: "Image", split: "Côte à côte", stacked: "Empilé" } satisfies Record<ChapterFaqLayout, string>,
  },
  en: {
    name: "FAQ",
    when: "Before the contact: the questions clients ask, one answer open at a time, readable by search engines.",
    label: "Layout",
    options: { media: "Image", split: "Side by side", stacked: "Stacked" } satisfies Record<ChapterFaqLayout, string>,
  },
} satisfies Record<Locale, unknown>;

/* FAQ chapter (Tchin "Tout ce que vous devez savoir"): one layout setting,
   the scene on the FAQ's light ground. */
export default function FaqScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildChapterFaqConfig(locale), [locale]);
  const [layout, setLayout] = useState<ChapterFaqLayout>("media");

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="light"
      rhythm="standard"
      desk={
        <SceneDesk>
          <DeskSetting label={t.label}>
            <SegmentedControl
              block
              label={t.label}
              options={CHAPTER_FAQ_LAYOUTS.map((value) => ({ value, label: t.options[value] }))}
              value={layout}
              onChange={(v) => setLayout(v as ChapterFaqLayout)}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <ChapterFaq config={config} layout={layout} tone="light" defaultOpen={1} level={3} />
    </Scene>
  );
}
