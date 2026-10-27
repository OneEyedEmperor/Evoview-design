import { useMemo, useState } from "react";
import { ChapterFaq, buildChapterFaqConfig, type ChapterFaqLayout } from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk } from "../scene/Scene";

const T = {
  fr: {
    name: "FAQ",
    when: "Avant le contact : les questions que les clients posent, une réponse ouverte à la fois, lisibles par les moteurs de recherche.",
    label: "Mise en page",
    options: { media: "Image", split: "Côte à côte", stacked: "Empilé" },
    hint: "Une question à la fois : la réponse s'ouvre sur sa rangée. Sur téléphone, quatre questions, puis une rangée pour le reste.",
    say: {
      media: "Image. Le titre au-dessus, une photo verticale tient sa colonne pendant que les réponses s'ouvrent ; sur téléphone elle passe devant la liste.",
      split: "Côte à côte. Le titre et sa phrase tiennent la colonne de gauche, les questions à droite : la FAQ d'une page sans photo à donner.",
      stacked: "Empilé. Titre centré sur une seule colonne de lecture : une FAQ courte, au fil d'une page étroite.",
    },
  },
  en: {
    name: "FAQ",
    when: "Before the contact: the questions clients ask, one answer open at a time, readable by search engines.",
    label: "Layout",
    options: { media: "Image", split: "Side by side", stacked: "Stacked" },
    hint: "One question at a time: the answer opens on its own row. On phones, four questions, then one row for the rest.",
    say: {
      media: "Image. The heading above, a portrait holds its column while answers open; on phones it comes before the list.",
      split: "Side by side. The heading and its sentence hold the left column, the questions the right: the FAQ of a page with no photo to give.",
      stacked: "Stacked. A centred heading over one reading column: a short FAQ along a narrow page.",
    },
  },
} satisfies Record<Locale, unknown>;

const LAYOUTS: ChapterFaqLayout[] = ["media", "split", "stacked"];

/* FAQ chapter (Tchin "Tout ce que vous devez savoir"): one layout setting,
   the scene on the FAQ's light ground. */
export default function FaqScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildChapterFaqConfig(locale), [locale]);
  const [layout, setLayout] = useState<ChapterFaqLayout>("media");
  const [said, setSaid] = useState(false);

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="light"
      rhythm="standard"
      desk={
        <SceneDesk say={said ? t.say[layout] : t.hint} sayAll={[t.hint, ...Object.values(t.say)]}>
          <DeskSetting label={t.label}>
            <SegmentedControl
              block
              label={t.label}
              options={LAYOUTS.map((value) => ({ value, label: t.options[value] }))}
              value={layout}
              onChange={(v) => {
                setLayout(v as ChapterFaqLayout);
                setSaid(true);
              }}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <ChapterFaq config={config} layout={layout} tone="light" defaultOpen={1} />
    </Scene>
  );
}
