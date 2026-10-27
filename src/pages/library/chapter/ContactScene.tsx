import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import {
  ChapterContact,
  buildChapterContactConfig,
  type ChapterContactHoursView,
  type ChapterContactLayout,
} from "../../../../components/chapter/src";
import { SegmentedControl } from "../../../../components/controls/src";
import { Readout } from "../../../../components/foundation/src";
import { ShowcaseVariant } from "../../../library/ShowcasePage";
import { useLibraryLocale, type Locale } from "../../../library/locale";
import "./contact-scene.css";

type Said = { layout: ChapterContactLayout } | { hours: ChapterContactHoursView } | null;

const T = {
  fr: {
    hint: "La section contact : une action, où venir, comment joindre, et les heures, l'état d'aujourd'hui calculé à l'heure de l'atelier.",
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
    hint: "The contact section: one action, where to come, how to reach, and the hours, today's state computed in the studio's time.",
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

const options = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

/* Demo destinations are fictional: links do not leave the showcase. */
const holdLinks = (e: MouseEvent<HTMLElement>) => {
  if ((e.target as HTMLElement).closest("a[href]")) e.preventDefault();
};

/* Contact chapter (Tchin home contact): layout × hours, the chapter dark
   under the desk like the story scene. */
export default function ContactScene() {
  const { locale } = useLibraryLocale();
  const t = T[locale];
  const config = useMemo(() => buildChapterContactConfig(locale), [locale]);
  const [layout, setLayout] = useState<ChapterContactLayout>("columns");
  const [hours, setHours] = useState<ChapterContactHoursView>("today");
  const [said, setSaid] = useState<Said>(null);

  const sentence = !said ? t.hint : "layout" in said ? t.say.layout[said.layout] : t.say.hours[said.hours];

  return (
    <ShowcaseVariant caption="none" rhythm="flush">
      <div className="lib-rail">
        <div className="ev-root ev-tone-dark chc-desk">
          <div className="chc-desk__controls">
            <Setting label={t.controls.layout.label}>
              <SegmentedControl
                block
                label={t.controls.layout.label}
                options={options(t.controls.layout.options)}
                value={layout}
                onChange={(v) => {
                  setLayout(v as ChapterContactLayout);
                  setSaid({ layout: v as ChapterContactLayout });
                }}
              />
            </Setting>
            <Setting label={t.controls.hours.label}>
              <SegmentedControl
                block
                label={t.controls.hours.label}
                options={options(t.controls.hours.options)}
                value={hours}
                onChange={(v) => {
                  setHours(v as ChapterContactHoursView);
                  setSaid({ hours: v as ChapterContactHoursView });
                }}
              />
            </Setting>
          </div>
          <p className="ev-t-body chc-desk__say" aria-live="polite">
            {sentence}
          </p>
        </div>
      </div>
      <div onClickCapture={holdLinks}>
        <ChapterContact id="chc-contact" config={config} layout={layout} hours={hours} tone="dark" rhythm="compact" />
      </div>
    </ShowcaseVariant>
  );
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="chc-setting">
      <Readout className="chc-setting__label" aria-hidden="true">
        {label}
      </Readout>
      {children}
    </div>
  );
}
