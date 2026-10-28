import { useMemo, useState, type MouseEvent } from "react";
import {
  ChapterContact,
  buildChapterContactConfig,
  type ChapterContactHoursView,
  type ChapterContactLayout,
} from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import { DeskSetting, Scene, SceneDesk, deskOptions } from "../scene/Scene";

const T = {
  fr: {
    name: "Contact",
    when: "La section qui fait venir : une action, l'adresse, les moyens de joindre et les heures, l'état du jour calculé à l'heure du lieu.",
    controls: {
      layout: { label: "Disposition", options: { columns: "Colonnes", split: "Scindé", band: "Bandeau" } satisfies Record<ChapterContactLayout, string> },
      hours: { label: "Horaires", options: { today: "Aujourd'hui", week: "Semaine" } satisfies Record<ChapterContactHoursView, string> },
    },
  },
  en: {
    name: "Contact",
    when: "The section that brings people in: one action, the address, ways to reach and the hours, today's state computed in the place's time.",
    controls: {
      layout: { label: "Layout", options: { columns: "Columns", split: "Split", band: "Band" } satisfies Record<ChapterContactLayout, string> },
      hours: { label: "Hours", options: { today: "Today", week: "Week" } satisfies Record<ChapterContactHoursView, string> },
    },
  },
} satisfies Record<Locale, unknown>;

/* Demo destinations are fictional: links do not leave the showcase. */
const holdLinks = (e: MouseEvent<HTMLElement>) => {
  if ((e.target as HTMLElement).closest("a[href]")) e.preventDefault();
};

/* Contact chapter (Tchin home contact): layout × hours, the scene on the
   chapter's dark ground. */
export default function ContactScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildChapterContactConfig(locale), [locale]);
  const [layout, setLayout] = useState<ChapterContactLayout>("columns");
  const [hours, setHours] = useState<ChapterContactHoursView>("today");

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
              onChange={(v) => setLayout(v as ChapterContactLayout)}
            />
          </DeskSetting>
          <DeskSetting label={t.controls.hours.label}>
            <SegmentedControl
              block
              label={t.controls.hours.label}
              options={deskOptions(t.controls.hours.options)}
              value={hours}
              onChange={(v) => setHours(v as ChapterContactHoursView)}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <div onClickCapture={holdLinks}>
        <ChapterContact id="chc-contact" config={config} layout={layout} hours={hours} tone="dark" rhythm="compact" level={3} />
      </div>
    </Scene>
  );
}
