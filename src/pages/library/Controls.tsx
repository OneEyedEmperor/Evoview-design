import { useRef, useState, type ReactNode } from "react";
import { Mic, Sparkles, UtensilsCrossed } from "lucide-react";
import {
  Badge,
  ChipGroup,
  ControlsProvider,
  FieldGrid,
  GhostAction,
  GlassClose,
  OptionRows,
  PagerOrb,
  PrimaryPlate,
  SegmentedControl,
  SegmentedProgress,
  StepMark,
  Switch,
  Tag,
  UnderlineField,
  buildControlsConfig,
} from "../../../components/controls/src";
import { ArrowLeft, ArrowUpRight, Index, Readout, useInViewPause, useSequenceClock } from "../../../components/foundation/src";
import "../../../components/controls/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";

/* Specimen sheet of the controls package, grouped by role. Colour comes only
   from the frame's --primary (the palette): nothing here re-renders on a swatch. */
export default function Controls() {
  return (
    <ShowcasePage
      entryId="controls"
      title={(l) => (l === "fr" ? <>Les <em>contrôles</em></> : <>The <em>controls</em></>)}
      intro={{
        fr: "Le langage de contrôle Evoview en pièces neutres : actions, choix, champs et progression, pilotés par l'accent du client.",
        en: "The Evoview control language as neutral pieces: actions, choices, fields and progress, driven by the client's accent.",
      }}
      tone="dark"
    >
      <Sheet />
    </ShowcasePage>
  );
}

const T = {
  groups: [
    {
      title: { fr: "Actions", en: "Commands" },
      note: { fr: "Une seule action primaire par écran ; tout le reste se retire.", en: "One primary action per screen; everything else steps back." },
      parts: { fr: ["Plaque primaire", "Action texte", "Fermer en verre", "Orbe de pagination"], en: ["Primary plate", "Text action", "Glass close", "Pager orb"] },
    },
    {
      title: { fr: "Choix", en: "Choices" },
      note: { fr: "Une sélection, c'est une bordure, une teinte, une marque et un état ARIA. Jamais la couleur seule.", en: "Selection is a border, a tint, a mark and an ARIA state. Never colour alone." },
      parts: { fr: ["Puces", "Rangées d'options", "Étiquettes", "Marques d'étape"], en: ["Chips", "Option rows", "Tags", "Step marks"] },
    },
    {
      title: { fr: "Champs", en: "Fields" },
      note: { fr: "Des soulignements, pas des boîtes. La valeur reste à 16 px.", en: "Underlines, not boxes. Values stay at 16px." },
      parts: { fr: ["Champ souligné", "Interrupteur", "Contrôle segmenté"], en: ["Underline field", "Switch", "Segmented control"] },
    },
    {
      title: { fr: "Progression", en: "Progress" },
      note: { fr: "Segments égaux : le courant se charge, l'achevé prend l'accent. L'horloge s'arrête hors écran.", en: "Equal segments: the current one charges, completed ones take the accent. The clock stops off-screen." },
      parts: { fr: ["Instrument minuté", "Étapes cliquables", "Charge fixe"], en: ["Timed instrument", "Clickable steps", "Static charge"] },
    },
  ],
  paper: {
    title: { fr: "Sur papier", en: "On paper" },
    note: { fr: "Même langage sur un ton clair : la plaque s'inverse, les traits d'accent se foncent pour rester lisibles, même en jaune ou en blanc cassé.", en: "Same language on a light tone: the plate inverts, accent strokes deepen to stay legible, even in yellow or off-white." },
  },
  plate: {
    next: { fr: "Continuer", en: "Continue" },
    quote: { fr: "Demander un devis", en: "Request a quote" },
    busy: { fr: "Envoi en cours", en: "Sending" },
    disabled: { fr: "Indisponible", en: "Unavailable" },
    back: { fr: "Retour", en: "Back" },
    detail: { fr: "Voir le détail", en: "See the detail" },
  },
  chrome: { item: { fr: "Atelier Nord", en: "North studio" }, prev: { fr: "Projet précédent", en: "Previous project" }, next: { fr: "Projet suivant", en: "Next project" } },
  slots: {
    label: { fr: "Moment de la visite", en: "Time of visit" },
    options: { fr: ["Matin", "Midi", "Après-midi", "Soir"], en: ["Morning", "Noon", "Afternoon", "Evening"] },
  },
  topics: {
    label: { fr: "Sujets (trois au maximum)", en: "Topics (three at most)" },
    options: { fr: ["Architecture", "Mobilier", "Lumière", "Textile", "Céramique", "Jardin"], en: ["Architecture", "Furniture", "Lighting", "Textile", "Ceramics", "Garden"] },
  },
  rows: {
    label: { fr: "Type de réservation", en: "Booking type" },
    options: {
      fr: [["Une table", "Restaurant · 2 à 12 personnes"], ["Une salle privée", "Salon · à l'heure"], ["Les deux", "Table puis salon"]],
      en: [["A table", "Restaurant · 2 to 12 guests"], ["A private room", "Lounge · by the hour"], ["Both", "Table, then lounge"]],
    },
  },
  tags: { live: { fr: "Disponible", en: "Available" }, meta: { fr: "Sur rendez-vous", en: "By appointment" }, format: { fr: "4K", en: "4K" } },
  steps: { fr: ["Lieu", "Date", "Invités"], en: ["Venue", "Date", "Guests"] },
  fields: {
    name: { fr: "Nom", en: "Name" },
    phone: { fr: "Téléphone", en: "Phone" },
    email: { fr: "E-mail", en: "Email" },
    emailError: { fr: "Adresse e-mail incomplète", en: "Incomplete email address" },
    notes: { fr: "Une précision", en: "Anything to add" },
    notesPlaceholder: { fr: "Allergie, occasion, accès…", en: "Allergy, occasion, access…" },
  },
  switches: [
    { label: { fr: "Confirmation par SMS", en: "SMS confirmation" }, desc: { fr: "Un message la veille de la visite.", en: "One message the day before the visit." } },
    { label: { fr: "Nouvelles de la maison", en: "News from the house" }, desc: { fr: "Quatre lettres par an, au plus.", en: "Four letters a year, at most." } },
  ],
  compare: {
    label: { fr: "Comparer l'état", en: "Compare the state" },
    before: { fr: "Avant", en: "Before" },
    after: { fr: "Après", en: "After" },
    caption: { fr: "Même cadre, autre état", en: "Same frame, other state" },
  },
  phases: { fr: ["Analyse", "Langage", "Création", "Déploiement"], en: ["Analysis", "Language", "Creation", "Rollout"] },
  instrument: {
    label: { fr: "Phases du projet", en: "Project phases" },
    running: { fr: "En cours", en: "Running" },
    paused: { fr: "En pause", en: "Paused" },
    why: {
      hold: { fr: "survol", en: "hover" },
      off: { fr: "hors écran", en: "off-screen" },
      hidden: { fr: "onglet masqué", en: "tab hidden" },
      suspended: { fr: "modale ouverte", en: "modal open" },
    },
    hint: { fr: "Survoler l'instrument le retient ; il reprend avec le temps restant.", en: "Hovering the instrument holds it; it resumes with the remaining time." },
  },
  flow: { label: { fr: "Progression de la demande", en: "Request progress" }, steps: { fr: ["Lieu", "Date", "Invités", "Heure", "Contact"], en: ["Venue", "Date", "Guests", "Time", "Contact"] } },
  charge: { label: { fr: "Préparation des médias", en: "Preparing media" }, readout: { fr: "Préparation", en: "Preparing" } },
} satisfies Record<string, unknown>;

const tr = <V,>(v: Localized<V>, l: Locale) => v[l];
const DURATIONS = [4000, 4000, 4000, 6000];

function Sheet() {
  const { locale } = useLibraryLocale();
  return (
    <ControlsProvider config={buildControlsConfig(locale)}>
      <div className="ev-root ctl-sheet">
        <div className="lib-rail">
          <Group n={1} locale={locale}><CommandsSpecimens locale={locale} /></Group>
          <Group n={2} locale={locale}><ChoicesSpecimens locale={locale} /></Group>
          <Group n={3} locale={locale}><FieldsSpecimens locale={locale} /></Group>
          <Group n={4} locale={locale}><ProgressSpecimens locale={locale} /></Group>
        </div>
        <PaperBand locale={locale} />
      </div>
    </ControlsProvider>
  );
}

function Group({ n, locale, children }: { n: number; locale: Locale; children: ReactNode }) {
  const g = T.groups[n - 1];
  return (
    <section className="ctl-group" aria-labelledby={`ctl-group-${n}`}>
      <header className="ctl-group__head">
        <Index current={n} total={5} size="lg" className="ctl-group__index" />
        <h2 id={`ctl-group-${n}`} className="ev-t-section">{tr(g.title, locale)}</h2>
        <p className="ev-t-body ctl-group__note">{tr(g.note, locale)}</p>
        <ol className="ctl-group__parts">
          {tr(g.parts, locale).map((p, i) => (
            <li key={p}>
              <Readout>{String.fromCharCode(65 + i)}</Readout>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </header>
      <div className="ctl-group__body">{children}</div>
    </section>
  );
}

function Specimen({ id, title, span = "full", children }: { id: string; title: string; span?: "full" | "major" | "minor"; children: ReactNode }) {
  return (
    <figure className={`ctl-spec ctl-spec--${span}`}>
      <figcaption className="ctl-spec__cap">
        <Readout className="ctl-spec__id">{id}</Readout>
        <Readout>{title}</Readout>
      </figcaption>
      <div className="ctl-spec__body">{children}</div>
    </figure>
  );
}

/* ── 01 Commands ─────────────────────────────────────────────────────── */

function CommandsSpecimens({ locale }: { locale: Locale }) {
  const parts = tr(T.groups[0].parts, locale);
  const p = T.plate;
  const [item, setItem] = useState(2);
  return (
    <>
      <Specimen id="01.A" title={parts[0]} span="major">
        <div className="ctl-stack">
          <PrimaryPlate size="lg">{tr(p.quote, locale)}</PrimaryPlate>
          <div className="ctl-row">
            <PrimaryPlate>{tr(p.next, locale)}</PrimaryPlate>
            <PrimaryPlate busy>{tr(p.busy, locale)}</PrimaryPlate>
            <PrimaryPlate disabled>{tr(p.disabled, locale)}</PrimaryPlate>
          </div>
        </div>
      </Specimen>
      <Specimen id="01.B" title={parts[1]} span="minor">
        <div className="ctl-stack ctl-stack--tight">
          <GhostAction icon={<ArrowLeft />}>{tr(p.back, locale)}</GhostAction>
          <GhostAction icon={<ArrowUpRight />} iconPosition="end">{tr(p.detail, locale)}</GhostAction>
        </div>
      </Specimen>
      <Specimen id="01.C" title={`${parts[2]} · ${parts[3]}`}>
        <div className="ctl-well">
          <div className="ctl-well__bar">
            <div className="ctl-well__pager">
              <PagerOrb direction="prev" label={tr(T.chrome.prev, locale)} disabled={item === 1} onClick={() => setItem((i) => Math.max(1, i - 1))} />
              <span className="ctl-well__where">
                <Readout>{tr(T.chrome.item, locale)}</Readout>
                <Index current={item} total={4} />
              </span>
              <PagerOrb direction="next" label={tr(T.chrome.next, locale)} disabled={item === 4} onClick={() => setItem((i) => Math.min(4, i + 1))} />
            </div>
            <span className="ctl-well__close">
              <GlassClose className="ctl-only-wide" showLabel />
              <GlassClose className="ctl-only-narrow" />
            </span>
          </div>
        </div>
      </Specimen>
    </>
  );
}

/* ── 02 Choices ──────────────────────────────────────────────────────── */

function ChoicesSpecimens({ locale }: { locale: Locale }) {
  const parts = tr(T.groups[1].parts, locale);
  const slots = tr(T.slots.options, locale);
  const topics = tr(T.topics.options, locale);
  const rows = tr(T.rows.options, locale);
  const [slot, setSlot] = useState<string | null>("1");
  const [picked, setPicked] = useState<string[]>(["0", "2"]);
  const [row, setRow] = useState<string | null>("0");
  const icons = [<UtensilsCrossed key="a" />, <Mic key="b" />, <Sparkles key="c" />];
  return (
    <>
      <Specimen id="02.A" title={`${parts[0]} · ${locale === "fr" ? "choix unique" : "single"}`} span="major">
        <ChipGroup label={tr(T.slots.label, locale)} numbered value={slot} onChange={setSlot} options={slots.map((s, i) => ({ value: String(i), label: s }))} />
      </Specimen>
      <Specimen id="02.B" title={`${parts[0]} · max 3`} span="minor">
        <ChipGroup label={tr(T.topics.label, locale)} multiple max={3} value={picked} onChange={setPicked} options={topics.map((s, i) => ({ value: String(i), label: s }))} />
      </Specimen>
      <Specimen id="02.C" title={parts[1]} span="major">
        <OptionRows
          label={tr(T.rows.label, locale)}
          numbered
          value={row}
          onChange={setRow}
          options={rows.map(([label, hint], i) => ({ value: String(i), label, hint, icon: icons[i] }))}
        />
      </Specimen>
      <Specimen id="02.D" title={`${parts[2]} · ${parts[3]}`} span="minor">
        <div className="ctl-stack">
          <div className="ctl-row ctl-row--tight">
            <Tag tone="accent" dot>{tr(T.tags.live, locale)}</Tag>
            <Tag>{tr(T.tags.meta, locale)}</Tag>
            <Tag>{tr(T.tags.format, locale)}</Tag>
          </div>
          <div className="ctl-row ctl-row--tight">
            <Badge>01</Badge>
            <Badge>02</Badge>
            <Badge tone="neutral">03</Badge>
          </div>
          <ol className="ctl-marks">
            {tr(T.steps, locale).map((s, i) => (
              <li key={s}>
                <StepMark index={i + 1} state={i === 0 ? "done" : i === 1 ? "current" : "idle"} />
                <Readout>{s}</Readout>
              </li>
            ))}
          </ol>
        </div>
      </Specimen>
    </>
  );
}

/* ── 03 Fields ───────────────────────────────────────────────────────── */

function FieldsSpecimens({ locale }: { locale: Locale }) {
  const parts = tr(T.groups[2].parts, locale);
  const f = T.fields;
  const [email, setEmail] = useState("camille@");
  const [touched, setTouched] = useState(true);
  const [sms, setSms] = useState(true);
  const [news, setNews] = useState(false);
  const [state, setState] = useState("after");
  const emailInvalid = touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <>
      <Specimen id="03.A" title={parts[0]}>
        <FieldGrid>
          <UnderlineField label={tr(f.name, locale)} required autoComplete="off" defaultValue="Camille Laurent" />
          <UnderlineField label={tr(f.phone, locale)} required type="tel" inputMode="tel" autoComplete="off" />
          <UnderlineField
            label={tr(f.email, locale)}
            required
            wide
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            error={emailInvalid ? tr(f.emailError, locale) : undefined}
          />
          <UnderlineField label={tr(f.notes, locale)} optional wide multiline placeholder={tr(f.notesPlaceholder, locale)} />
        </FieldGrid>
      </Specimen>
      <Specimen id="03.B" title={parts[1]} span="minor">
        <div className="ctl-switches">
          <Switch checked={sms} onCheckedChange={setSms} label={tr(T.switches[0].label, locale)} description={tr(T.switches[0].desc, locale)} />
          <Switch checked={news} onCheckedChange={setNews} label={tr(T.switches[1].label, locale)} description={tr(T.switches[1].desc, locale)} />
        </div>
      </Specimen>
      <Specimen id="03.C" title={parts[2]} span="major">
        <div className="ctl-compare">
          <div className="ctl-compare__frame" data-state={state} aria-live="polite">
            <span className="ctl-compare__layer ctl-compare__layer--before" aria-hidden={state !== "before"}>
              <span className="ev-t-heading">{tr(T.compare.before, locale)}</span>
            </span>
            <span className="ctl-compare__layer ctl-compare__layer--after" aria-hidden={state !== "after"}>
              <span className="ev-t-heading">{tr(T.compare.after, locale)}</span>
            </span>
            <Readout className="ctl-compare__cap">{tr(T.compare.caption, locale)}</Readout>
          </div>
          <SegmentedControl
            label={tr(T.compare.label, locale)}
            value={state}
            onChange={setState}
            options={[
              { value: "before", label: tr(T.compare.before, locale) },
              { value: "after", label: tr(T.compare.after, locale) },
            ]}
          />
        </div>
      </Specimen>
    </>
  );
}

/* ── 04 Progress ─────────────────────────────────────────────────────── */

function ProgressSpecimens({ locale }: { locale: Locale }) {
  const parts = tr(T.groups[3].parts, locale);
  const flowSteps = tr(T.flow.steps, locale);
  const [flow, setFlow] = useState(2);
  return (
    <>
      <Specimen id="04.A" title={parts[0]}>
        <TimedInstrument locale={locale} />
      </Specimen>
      <Specimen id="04.B" title={parts[1]} span="major">
        <div className="ctl-stack">
          <SegmentedProgress label={tr(T.flow.label, locale)} count={5} current={flow} labels={flowSteps} onSelect={setFlow} canSelect={(i) => i !== flow && i <= 3} />
          <Readout aria-live="polite">
            {String(flow + 1).padStart(2, "0")} / 05 · {flowSteps[flow]}
          </Readout>
        </div>
      </Specimen>
      <Specimen id="04.C" title={parts[2]} span="minor">
        <div className="ctl-stack">
          <SegmentedProgress label={tr(T.charge.label, locale)} count={4} current={2} fill={0.64} />
          <Readout>{tr(T.charge.readout, locale)} · 03 / 04 · 64 %</Readout>
        </div>
      </Specimen>
    </>
  );
}

function TimedInstrument({ locale }: { locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hold, setHold] = useState(false);
  const pause = useInViewPause(ref, { enabled: !hold });
  const [phase, setPhase] = useState(0);
  const clock = useSequenceClock(phase, pause.active, DURATIONS[phase], () => setPhase((p) => (p + 1) % DURATIONS.length));
  const phases = tr(T.phases, locale);
  const t = T.instrument;
  const why = hold ? t.why.hold : pause.suspended ? t.why.suspended : !pause.documentVisible ? t.why.hidden : !pause.inView ? t.why.off : null;

  return (
    <div
      ref={ref}
      className="ctl-instrument"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={() => setHold(false)}
    >
      <div className="ctl-instrument__head">
        <span className="ctl-instrument__phase">
          <span className="ev-t-index">{String(phase + 1).padStart(2, "0")}</span>
          <span className="ev-t-card">{phases[phase]}</span>
        </span>
        <Tag tone={pause.active ? "accent" : "neutral"} dot={pause.active}>
          {pause.active ? tr(t.running, locale) : `${tr(t.paused, locale)}${why ? ` · ${tr(why, locale)}` : ""}`}
        </Tag>
      </div>
      <SegmentedProgress size="lg" captions="complete" label={tr(t.label, locale)} count={phases.length} current={phase} labels={phases} clock={clock} onSelect={setPhase} canSelect={() => true} />
      <p className="ev-t-compact ctl-instrument__hint">{tr(t.hint, locale)}</p>
    </div>
  );
}

/* ── 05 On paper ─────────────────────────────────────────────────────── */

function PaperBand({ locale }: { locale: Locale }) {
  const slots = tr(T.slots.options, locale);
  const rows = tr(T.rows.options, locale);
  const [slot, setSlot] = useState<string | null>("2");
  const [row, setRow] = useState<string | null>("1");
  const [on, setOn] = useState(true);
  const [state, setState] = useState("before");
  return (
    <section className="ev-tone-paper ctl-paper" aria-labelledby="ctl-group-5">
      <div className="lib-rail ctl-group ctl-group--paper">
        <header className="ctl-group__head">
          <Index current={5} total={5} size="lg" className="ctl-group__index" />
          <h2 id="ctl-group-5" className="ev-t-section">{tr(T.paper.title, locale)}</h2>
          <p className="ev-t-body ctl-group__note">{tr(T.paper.note, locale)}</p>
        </header>
        <div className="ctl-group__body">
          <Specimen id="05.A" title={tr(T.groups[0].title, locale)} span="major">
            <div className="ctl-row">
              <PrimaryPlate>{tr(T.plate.next, locale)}</PrimaryPlate>
              <GhostAction icon={<ArrowLeft />}>{tr(T.plate.back, locale)}</GhostAction>
            </div>
          </Specimen>
          <Specimen id="05.B" title={tr(T.groups[3].title, locale)} span="minor">
            <SegmentedProgress label={tr(T.flow.label, locale)} count={5} current={2} labels={tr(T.flow.steps, locale)} />
          </Specimen>
          <Specimen id="05.C" title={tr(T.groups[1].title, locale)} span="major">
            <div className="ctl-stack">
              <ChipGroup label={tr(T.slots.label, locale)} numbered value={slot} onChange={setSlot} options={slots.map((s, i) => ({ value: String(i), label: s }))} />
              <OptionRows label={tr(T.rows.label, locale)} numbered value={row} onChange={setRow} options={rows.slice(0, 2).map(([label, hint], i) => ({ value: String(i), label, hint }))} />
            </div>
          </Specimen>
          <Specimen id="05.D" title={tr(T.groups[2].title, locale)} span="minor">
            <div className="ctl-stack">
              <Switch checked={on} onCheckedChange={setOn} label={tr(T.switches[0].label, locale)} />
              <SegmentedControl
                block
                label={tr(T.compare.label, locale)}
                value={state}
                onChange={setState}
                options={[
                  { value: "before", label: tr(T.compare.before, locale) },
                  { value: "after", label: tr(T.compare.after, locale) },
                ]}
              />
              <div className="ctl-row ctl-row--tight">
                <Tag tone="accent" dot>{tr(T.tags.live, locale)}</Tag>
                <Badge>01</Badge>
                <StepMark index={2} state="current" size="sm" />
                <StepMark index={1} state="done" size="sm" />
              </div>
            </div>
          </Specimen>
        </div>
      </div>
    </section>
  );
}
