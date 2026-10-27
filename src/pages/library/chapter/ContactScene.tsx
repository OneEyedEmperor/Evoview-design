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

type Said = { layout: ChapterContactLayout } | { hours: ChapterContactHoursView } | null;

const T = {
  fr: {
    name: "Contact",
    when: "La section qui fait venir : une action, l'adresse, les moyens de joindre et les heures, l'état du jour calculé à l'heure du lieu.",
    hint: "Changez la disposition ou les horaires : la section se recompose, l'état du jour reste juste.",
    controls: {
      layout: { label: "Disposition", options: { columns: "Colonnes", split: "Scindé", band: "Bandeau" } },
      hours: { label: "Horaires", options: { today: "Aujourd'hui", week: "Semaine" } },
    },
    say: {
      layout: {
        columns: "Colonnes. Le titre et l'action au centre, puis les coordonnées face aux heures ; la photo du lieu remplit la colonne et s'efface quand la semaine s'ouvre.",
        split: "Scindé. Le titre, l'action et les heures tiennent une colonne ; le lieu en grand et les coordonnées en face : pour un lieu qui se montre.",
        band: "Bandeau. Une bande compacte de fin de page : les coordonnées sur une ligne, la semaine en sept jours dessous. Sans photo.",
      },
      hours: {
        today: "Aujourd'hui. L'état du moment et les créneaux du jour d'abord, la semaine repliée mais présente dans la page.",
        week: "Semaine. Les sept jours posés d'un coup, aujourd'hui marqué : pour des horaires qui changent d'un jour à l'autre.",
      },
    },
  },
  en: {
    name: "Contact",
    when: "The section that brings people in: one action, the address, ways to reach and the hours, today's state computed in the place's time.",
    hint: "Change the layout or the hours: the section recomposes, today's state stays right.",
    controls: {
      layout: { label: "Layout", options: { columns: "Columns", split: "Split", band: "Band" } },
      hours: { label: "Hours", options: { today: "Today", week: "Week" } },
    },
    say: {
      layout: {
        columns: "Columns. Heading and action centred, then the details across from the hours; the place's photo fills the column and steps aside when the week opens.",
        split: "Split. Heading, action and hours hold one column; the place, large, and the details across: for a place worth showing.",
        band: "Band. A compact closing band: the details on one row, the week as seven days below it. No photo.",
      },
      hours: {
        today: "Today. The current state and today's slots first, the week folded but still in the page.",
        week: "Week. All seven days laid out at once, today marked: for hours that change from day to day.",
      },
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
  const [said, setSaid] = useState<Said>(null);

  const sentence = !said ? t.hint : "layout" in said ? t.say.layout[said.layout] : t.say.hours[said.hours];

  return (
    <Scene
      name={t.name}
      when={t.when}
      tone="dark"
      rhythm="compact"
      desk={
        <SceneDesk say={sentence} sayAll={[t.hint, ...Object.values(t.say.layout), ...Object.values(t.say.hours)]}>
          <DeskSetting label={t.controls.layout.label}>
            <SegmentedControl
              block
              label={t.controls.layout.label}
              options={deskOptions(t.controls.layout.options)}
              value={layout}
              onChange={(v) => {
                setLayout(v as ChapterContactLayout);
                setSaid({ layout: v as ChapterContactLayout });
              }}
            />
          </DeskSetting>
          <DeskSetting label={t.controls.hours.label}>
            <SegmentedControl
              block
              label={t.controls.hours.label}
              options={deskOptions(t.controls.hours.options)}
              value={hours}
              onChange={(v) => {
                setHours(v as ChapterContactHoursView);
                setSaid({ hours: v as ChapterContactHoursView });
              }}
            />
          </DeskSetting>
        </SceneDesk>
      }
    >
      <div onClickCapture={holdLinks}>
        <ChapterContact id="chc-contact" config={config} layout={layout} hours={hours} tone="dark" rhythm="compact" />
      </div>
    </Scene>
  );
}
