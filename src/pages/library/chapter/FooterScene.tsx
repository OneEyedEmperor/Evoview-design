import { useMemo, useState, type MouseEvent } from "react";
import { ChapterFooter, type ChapterConfig, type ChapterFooterLayout } from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk } from "../scene/Scene";

/* The footer that closes the page scene above (Chapter.tsx, chd-page), as
   its own scene: caption and desk on the footer's light ground, the footer
   last, so the frame lets the library footer follow it directly. */

const preventDefault = (e: MouseEvent<HTMLElement>) => e.preventDefault();

const T = {
  fr: {
    name: "Pied de page",
    when: "La dernière ligne de chaque page : le logo, les mentions, et le crédit Evoview à sa place approuvée.",
    label: "Disposition",
    options: { bar: "Barre", panel: "Panneau" },
    say: {
      bar: "Barre. Une ligne : logo, mentions, liens légaux, puis le crédit Evoview. Pour un site d'une page.",
      panel: "Panneau. Le logo et sa phrase, les pages du site en tuiles, les réseaux ; dessous l'adresse et les mentions, le crédit Evoview au centre. Pour un site de plusieurs pages.",
    },
  },
  en: {
    name: "Footer",
    when: "The last line of every page: the logo, the legal line, and the Evoview credit in its approved place.",
    label: "Layout",
    options: { bar: "Bar", panel: "Panel" },
    say: {
      bar: "Bar. One line: logo, legal line and links, then the Evoview credit. For a one-page site.",
      panel: "Panel. The logo and its sentence, the site's pages as tiles, the socials; below, the address and legal line, the Evoview credit centred. For a site of several pages.",
    },
  },
} satisfies Record<Locale, unknown>;

const LAYOUTS: ChapterFooterLayout[] = ["bar", "panel"];

/** `config`: the page's chapter config (its brand link points at the page scene). */
export default function FooterScene({ config }: { config: ChapterConfig }) {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const [layout, setLayout] = useState<ChapterFooterLayout>("panel");
  const demo = useMemo(
    () => ({ ...config, footer: { ...config.footer, nav: config.footer.nav?.map((link) => ({ ...link, onSelect: preventDefault })) } }),
    [config],
  );

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="light"
      desk={
        <SceneDesk say={t.say[layout]} sayAll={Object.values(t.say)}>
          <DeskSetting label={t.label}>
            <SegmentedControl
              block
              label={t.label}
              options={LAYOUTS.map((value) => ({ value, label: t.options[value] }))}
              value={layout}
              onChange={(v) => setLayout(v as ChapterFooterLayout)}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <ChapterFooter tone="light" config={demo} layout={layout} />
    </Scene>
  );
}
