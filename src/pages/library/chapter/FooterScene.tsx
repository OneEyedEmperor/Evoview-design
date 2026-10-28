import { useMemo, useState, type MouseEvent } from "react";
import { CHAPTER_FOOTER_LAYOUTS, ChapterFooter, type ChapterConfig, type ChapterFooterLayout } from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk } from "../scene/Scene";

/* The footer that closes the client page, as its own scene: caption and
   desk on the footer's light ground, the footer last, so the frame lets the
   library footer follow it directly. Its logo links to the top of the
   demo (Chapter.tsx, chd-specimen). */

const preventDefault = (e: MouseEvent<HTMLElement>) => e.preventDefault();

const T = {
  fr: {
    name: "Pied de page",
    when: "La dernière ligne de chaque page : le logo, les mentions, et le crédit Evoview à sa place approuvée.",
    label: "Disposition",
    options: { bar: "Barre", panel: "Panneau" } satisfies Record<ChapterFooterLayout, string>,
  },
  en: {
    name: "Footer",
    when: "The last line of every page: the logo, the legal line, and the Evoview credit in its approved place.",
    label: "Layout",
    options: { bar: "Bar", panel: "Panel" } satisfies Record<ChapterFooterLayout, string>,
  },
} satisfies Record<Locale, unknown>;

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
        <SceneDesk>
          <DeskSetting label={t.label}>
            <SegmentedControl
              block
              label={t.label}
              options={CHAPTER_FOOTER_LAYOUTS.map((value) => ({ value, label: t.options[value] }))}
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
