import { useMemo, useSyncExternalStore, type MouseEvent } from "react";
import type { ChapterConfig, ChapterFooterLayout } from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { Readout } from "../../../../components/foundation/src";
import { ShowcaseVariant } from "../../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import "./faq-footer.css";

/* The page scene (Chapter.tsx, chd-page) ends on the footer; this desk,
   right under it, switches that footer's layout through a small store. */

let current: ChapterFooterLayout = "panel";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const setLayout = (next: ChapterFooterLayout) => {
  current = next;
  listeners.forEach((fn) => fn());
};
const useLayout = () => useSyncExternalStore(subscribe, () => current, () => "panel" as ChapterFooterLayout);

const preventDefault = (e: MouseEvent<HTMLElement>) => e.preventDefault();

/** Props for the page's `<ChapterFooter>`: the chosen layout, and demo links that stay on the page. */
function usePageFooter(config: ChapterConfig) {
  const layout = useLayout();
  const demo = useMemo(
    () => ({ ...config, footer: { ...config.footer, nav: config.footer.nav?.map((link) => ({ ...link, onSelect: preventDefault })) } }),
    [config],
  );
  return { config: demo, layout };
}

const T = {
  fr: {
    label: "Pied de page",
    options: { bar: "Barre", panel: "Panneau" },
    say: {
      bar: "Barre. Une ligne : logo, mentions, liens légaux, puis le crédit Evoview. Pour un site d'une page.",
      panel: "Panneau. Le logo et sa phrase, les pages du site en tuiles, les réseaux ; dessous l'adresse et les mentions, le crédit Evoview au centre. Pour un site de plusieurs pages.",
    },
  },
  en: {
    label: "Footer",
    options: { bar: "Bar", panel: "Panel" },
    say: {
      bar: "Bar. One line: logo, legal line and links, then the Evoview credit. For a one-page site.",
      panel: "Panel. The logo and its sentence, the site's pages as tiles, the socials; below, the address and legal line, the Evoview credit centred. For a site of several pages.",
    },
  },
} satisfies Record<Locale, unknown>;

const LAYOUTS: ChapterFooterLayout[] = ["bar", "panel"];

function FooterScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const layout = useLayout();

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
              onChange={(v) => setLayout(v as ChapterFooterLayout)}
            />
          </div>
          <p className="ev-t-body chd-desk__say" aria-live="polite">
            {t.say[layout]}
          </p>
        </div>
      </div>
    </ShowcaseVariant>
  );
}

FooterScene.usePageFooter = usePageFooter;

export default FooterScene;
