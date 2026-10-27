import { useMemo, useState } from "react";
import { ChapterFaq, buildChapterFaqConfig, type ChapterFaqLayout } from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { Readout } from "../../../../components/foundation/src";
import { ShowcaseVariant } from "../../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import "./faq-footer.css";

const T = {
  fr: {
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
   the chapter on a light ground under it. */
export default function FaqScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildChapterFaqConfig(locale), [locale]);
  const [layout, setLayout] = useState<ChapterFaqLayout>("media");
  const [said, setSaid] = useState(false);

  return (
    <ShowcaseVariant caption="none" rhythm="flush">
      <div className="lib-rail">
        <div className="ev-root ev-tone-dark chd-desk chf-desk">
          <div className="chd-setting">
            <Readout className="chd-setting__label" aria-hidden="true">
              {t.label}
            </Readout>
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
          </div>
          <p className="ev-t-body chd-desk__say" aria-live="polite">
            {said ? t.say[layout] : t.hint}
          </p>
        </div>
      </div>
      <ChapterFaq config={config} layout={layout} tone="light" defaultOpen={1} className="chf-faq" />
    </ShowcaseVariant>
  );
}
