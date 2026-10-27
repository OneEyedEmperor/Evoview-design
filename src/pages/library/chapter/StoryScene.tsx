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

type Said = { layout: ChapterStoryLayout } | { density: ChapterStoryDensity } | null;

const T = {
  fr: {
    name: "Récit",
    when: "Le chapitre qui suit l'accueil : l'histoire du client, portée par ses images qui dérivent au rythme du défilement.",
    hint: "Placez le récit, choisissez la densité des images, puis faites défiler : les images avancent avec la page.",
    controls: {
      layout: { label: "Texte", options: { start: "Gauche", center: "Centre", end: "Droite", above: "Dessus" } },
      density: { label: "Images", options: { ample: "Amples", dense: "Denses" } },
    },
    say: {
      layout: {
        start: "Gauche. Le récit tient la colonne de lecture, les images dérivent à sa droite. Sur téléphone, elles passent en bandeau au-dessus du texte.",
        center: "Centre. Le récit au milieu, encadré de colonnes qui dérivent en sens contraires : une ouverture de page. Sur téléphone, les bandeaux l'encadrent dessus et dessous.",
        end: "Droite. Le miroir : les images ouvrent la lecture. Alterné avec Gauche, il rythme une page de plusieurs récits.",
        above: "Dessus. Titre et récit en tête, les images passent dessous en bandeau, d'un bord à l'autre : pour des photos en paysage.",
      },
      density: {
        ample: "Amples. Moins de colonnes, des images plus grandes : pour un client qui a peu d'images, mais fortes.",
        dense: "Denses. Une colonne de plus, des images plus petites : une mosaïque, pour un fonds d'images riche.",
      },
    },
  },
  en: {
    name: "Story",
    when: "The chapter after the hero: the client's story, carried by its pictures drifting with the scroll.",
    hint: "Place the story, choose the picture density, then scroll: the pictures travel with the page.",
    controls: {
      layout: { label: "Text", options: { start: "Left", center: "Centre", end: "Right", above: "Above" } },
      density: { label: "Pictures", options: { ample: "Ample", dense: "Dense" } },
    },
    say: {
      layout: {
        start: "Left. The story holds the reading column, the pictures drift on its right. On phones they turn into a band above the text.",
        center: "Centre. The story in the middle, framed by columns drifting in opposite directions: a page opener. On phones the bands frame it above and below.",
        end: "Right. The mirror: the pictures open the reading. Alternated with Left, it paces a page of several stories.",
        above: "Above. Title and story first, the pictures pass underneath as a band, edge to edge: for landscape photography.",
      },
      density: {
        ample: "Ample. Fewer columns, larger pictures: for a client with few pictures, but strong ones.",
        dense: "Dense. One more column, smaller pictures: a mosaic, for a rich picture library.",
      },
    },
  },
} satisfies Record<Locale, unknown>;

export default function StoryScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const content = useMemo(() => buildChapterStoryConfig(locale), [locale]);
  const [layout, setLayout] = useState<ChapterStoryLayout>("start");
  const [density, setDensity] = useState<ChapterStoryDensity>("dense");
  const [said, setSaid] = useState<Said>(null);

  const sentence = !said ? t.hint : "layout" in said ? t.say.layout[said.layout] : t.say.density[said.density];

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="dark"
      rhythm="compact"
      desk={
        <SceneDesk say={sentence} sayAll={[t.hint, ...Object.values(t.say.layout), ...Object.values(t.say.density)]}>
          <DeskSetting label={t.controls.layout.label}>
            <SegmentedControl
              block
              label={t.controls.layout.label}
              options={deskOptions(t.controls.layout.options)}
              value={layout}
              onChange={(v) => {
                setLayout(v as ChapterStoryLayout);
                setSaid({ layout: v as ChapterStoryLayout });
              }}
            />
          </DeskSetting>
          <DeskSetting label={t.controls.density.label}>
            <SegmentedControl
              block
              label={t.controls.density.label}
              options={deskOptions(t.controls.density.options)}
              value={density}
              onChange={(v) => {
                setDensity(v as ChapterStoryDensity);
                setSaid({ density: v as ChapterStoryDensity });
              }}
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
