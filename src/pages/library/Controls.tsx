import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mic, Sparkles, UtensilsCrossed } from "lucide-react";
import {
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
  Switch,
  Tag,
  UnderlineField,
  buildControlsConfig,
} from "../../../components/controls/src";
import { ArrowLeft, ArrowUpRight, Index, Readout, useInViewPause, useMediaReady, useSequenceClock } from "../../../components/foundation/src";
import "../../../components/controls/showcase.css";
import ShowcasePage from "../../library/ShowcasePage";
import { useLibraryLocale, type Locale, type Localized } from "../../library/locale";

/* One client (a restaurant house), four roles of the control language, one
   light-tone scene. Colour comes only from the frame's --primary: nothing
   here re-renders on a swatch. */
export default function Controls() {
  return (
    <ShowcasePage
      entryId="controls"
      title={(l) => (l === "fr" ? <>Les <em>contrôles</em></> : <>The <em>controls</em></>)}
      intro={{
        fr: "Les pièces que chaque composant Evoview partage : agir, choisir, remplir, suivre le temps. Changez l'accent, elles suivent la marque du client.",
        en: "The pieces every Evoview component shares: act, choose, fill in, follow time. Change the accent and they follow the client's brand.",
      }}
      tone="dark"
    >
      <Sheet />
    </ShowcasePage>
  );
}

const DOSSIER = "/library/dossier/";
const tr = <V,>(v: Localized<V>, l: Locale) => v[l];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOTAL = 5;

const T = {
  chapters: [
    {
      title: { fr: "Une seule action primaire", en: "One primary action" },
      note: {
        fr: "La plaque blanche porte la décision et prend l'accent au survol. L'action texte et la navigation en verre restent en retrait, au-dessus de l'image.",
        en: "The white plate carries the decision and takes the accent on hover. The text action and the glass navigation stay back, over the image.",
      },
    },
    {
      title: { fr: "Des choix qui se lisent", en: "Choices that read" },
      note: {
        fr: "Une puce pour un mot, une rangée quand l'option a besoin d'un détail, des segments pour changer l'état d'un même cadre. Une sélection, c'est une bordure, une teinte et une marque : jamais la couleur seule.",
        en: "A chip for a word, a row when the option needs a detail, segments to change the state of one frame. Selection is a border, a tint and a mark: never colour alone.",
      },
    },
    {
      title: { fr: "Des champs sans boîtes", en: "Fields without boxes" },
      note: {
        fr: "Un soulignement, une étiquette, une valeur à 16 px. L'erreur se dit en mots, et l'envoi reste indisponible tant que la demande est incomplète.",
        en: "An underline, a label, a 16px value. Errors are spelled out, and sending stays unavailable while the request is incomplete.",
      },
    },
    {
      title: { fr: "Le temps se voit", en: "Time you can see" },
      note: {
        fr: "Des segments égaux : le courant se charge, les achevés prennent l'accent. L'horloge s'arrête hors écran, onglet masqué ou au survol, et reprend là où elle était.",
        en: "Equal segments: the current one charges, completed ones take the accent. The clock stops off-screen, in a hidden tab or on hover, and resumes where it was.",
      },
    },
    {
      title: { fr: "Sur un site clair", en: "On a light site" },
      note: {
        fr: "Le même langage sur papier : la plaque s'inverse, les traits d'accent se foncent pour rester lisibles, même en jaune ou en blanc cassé.",
        en: "The same language on paper: the plate inverts, accent strokes deepen to stay legible, even in yellow or off-white.",
      },
    },
  ],
  tables: [
    { image: "table-tasting.webp", title: { fr: "Menu dégustation", en: "Tasting menu" } },
    { image: "table-market.webp", title: { fr: "Marché du jour", en: "Today's market" } },
    { image: "table-cellar.webp", title: { fr: "La cave", en: "The cellar" } },
    { image: "table-chef.webp", title: { fr: "Table du chef", en: "Chef's table" } },
  ],
  portal: {
    kicker: { fr: "Nos tables", en: "Our tables" },
    prev: { fr: "Table précédente", en: "Previous table" },
    next: { fr: "Table suivante", en: "Next table" },
    book: { fr: "Réserver cette table", en: "Book this table" },
    detail: { fr: "Voir le menu", en: "See the menu" },
  },
  moment: {
    question: { fr: "Pour quel moment ?", en: "For which moment?" },
    options: { fr: ["Déjeuner", "Goûter", "Apéritif", "Dîner"], en: ["Lunch", "Afternoon", "Aperitif", "Dinner"] },
  },
  interests: {
    question: { fr: "Ce qui vous fait venir", en: "What brings you" },
    hint: { fr: "trois au maximum", en: "three at most" },
    options: { fr: ["Dégustation", "Cocktails", "Vins nature", "Concert", "Atelier pâtes", "Terrasse"], en: ["Tasting", "Cocktails", "Natural wine", "Concert", "Pasta class", "Terrace"] },
  },
  booking: {
    question: { fr: "Que réservez-vous ?", en: "What are you booking?" },
    options: {
      fr: [["Une table", "Restaurant · 2 à 12 personnes"], ["Le bar", "Comptoir · sans réservation après 22 h"], ["Un salon privé", "Salon · à l'heure"]],
      en: [["A table", "Restaurant · 2 to 12 guests"], ["The bar", "Counter · walk-in after 10 pm"], ["A private room", "Lounge · by the hour"]],
    },
  },
  setup: {
    label: { fr: "Configuration du salon", en: "Room setup" },
    options: [
      { value: "dinner", image: "salon-private.webp", label: { fr: "Dîner", en: "Dinner" }, meta: { fr: "24 couverts", en: "24 covers" } },
      { value: "meeting", image: "salon-business.webp", label: { fr: "Réunion", en: "Meeting" }, meta: { fr: "16 places", en: "16 seats" } },
      { value: "reception", image: "salon-reception.webp", label: { fr: "Réception", en: "Reception" }, meta: { fr: "60 invités", en: "60 guests" } },
    ],
  },
  fields: {
    name: { fr: "Nom", en: "Name" },
    phone: { fr: "Téléphone", en: "Phone" },
    email: { fr: "E-mail", en: "Email" },
    emailError: { fr: "Il manque la fin de l'adresse (ex. : nom@domaine.be)", en: "The address is missing its end (e.g. name@domain.com)" },
    notes: { fr: "Une précision", en: "Anything to add" },
    notesPlaceholder: { fr: "Allergie, occasion, accès…", en: "Allergy, occasion, access…" },
    sms: { fr: "Confirmation par SMS", en: "SMS confirmation" },
    smsDesc: { fr: "Un message la veille de votre venue.", en: "One message the day before your visit." },
    send: { fr: "Envoyer la demande", en: "Send the request" },
    sent: { fr: "Demande envoyée", en: "Request sent" },
  },
  evening: {
    label: { fr: "La soirée au bar", en: "An evening at the bar" },
    items: [
      { image: "bar-cocktails.webp", title: { fr: "Cocktails", en: "Cocktails" } },
      { image: "bar-boards.webp", title: { fr: "Planches à partager", en: "Sharing boards" } },
      { image: "bar-wine.webp", title: { fr: "Vins nature", en: "Natural wine" } },
      { image: "bar-live.webp", title: { fr: "Concerts", en: "Live music" } },
    ],
    running: { fr: "Lecture", en: "Playing" },
    paused: { fr: "En pause", en: "Paused" },
    why: {
      hold: { fr: "survol", en: "hover" },
      off: { fr: "hors écran", en: "off-screen" },
      hidden: { fr: "onglet masqué", en: "tab hidden" },
      suspended: { fr: "modale ouverte", en: "modal open" },
    },
    preparing: { fr: "Préparation des images", en: "Preparing images" },
    failed: { fr: "Images indisponibles", en: "Images unavailable" },
    retry: { fr: "Réessayer", en: "Retry" },
  },
  flow: {
    label: { fr: "Votre réservation", en: "Your booking" },
    steps: { fr: ["Lieu", "Date", "Invités", "Heure", "Contact"], en: ["Venue", "Date", "Guests", "Time", "Contact"] },
    guests: { question: { fr: "Combien serez-vous ?", en: "How many of you?" }, options: ["2", "3 – 4", "5 – 8", "9 – 12"] },
    time: { question: { fr: "À quelle heure ?", en: "At what time?" }, options: ["19:00", "19:30", "20:00", "20:30", "21:00"], full: "20:00" },
    contact: { question: { fr: "Où vous confirmer ?", en: "Where do we confirm?" } },
    done: { title: { fr: "C'est noté.", en: "All set." }, body: { fr: "Vous recevrez une confirmation sous 24 heures.", en: "You will receive a confirmation within 24 hours." } },
    next: { fr: "Continuer", en: "Continue" },
    back: { fr: "Retour", en: "Back" },
    again: { fr: "Recommencer", en: "Start again" },
  },
} satisfies Record<string, unknown>;

/** A command that pretends to work for a moment (busy state), then settles. */
function useBusy(ms = 1400): [boolean, (then?: () => void) => void] {
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = (then?: () => void) => {
    setBusy(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      then?.();
    }, ms);
  };
  return [busy, run];
}

function Sheet() {
  const { locale } = useLibraryLocale();
  return (
    <ControlsProvider config={buildControlsConfig(locale)}>
      <div className="ev-root ctl-sheet">
        <Chapter n={1} locale={locale}><Commands locale={locale} /></Chapter>
        <Chapter n={2} locale={locale}><Choices locale={locale} /></Chapter>
        <Chapter n={3} locale={locale}><Fields locale={locale} /></Chapter>
        <Chapter n={4} locale={locale}><Timed locale={locale} /></Chapter>
        <Chapter n={5} locale={locale} paper><PaperFlow locale={locale} /></Chapter>
      </div>
    </ControlsProvider>
  );
}

function Chapter({ n, locale, paper = false, children }: { n: number; locale: Locale; paper?: boolean; children: ReactNode }) {
  const c = T.chapters[n - 1];
  return (
    <section className={paper ? "ev-tone-paper ctl-chapter ctl-chapter--paper" : "ctl-chapter"} aria-labelledby={`ctl-ch-${n}`}>
      <div className="lib-rail ctl-chapter__grid">
        <header className="ctl-chapter__head">
          <Index current={n} total={TOTAL} size="lg" className="ctl-chapter__index" />
          <h2 id={`ctl-ch-${n}`} className="ev-t-section">{tr(c.title, locale)}</h2>
          <p className="ev-t-body ctl-chapter__note">{tr(c.note, locale)}</p>
        </header>
        <div className="ctl-chapter__scene">{children}</div>
      </div>
    </section>
  );
}

/* Visible question; the group itself carries the same text as its accessible name. */
function Question({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <p className="ctl-question" aria-hidden="true">
      {children}
      {hint && <span className="ctl-question__hint"> · {hint}</span>}
    </p>
  );
}

/* ── 01 Commands: a portal frame over a client image ─────────────────── */

function Commands({ locale }: { locale: Locale }) {
  const p = T.portal;
  const [item, setItem] = useState(0);
  const [busy, run] = useBusy();
  const n = T.tables.length;
  return (
    <div className="ctl-frame ctl-portal">
      <div className="ctl-frame__media" aria-hidden="true">
        {T.tables.map((t, i) => (
          <img key={t.image} src={DOSSIER + t.image} alt="" decoding="async" loading={i === 0 ? "eager" : "lazy"} data-current={i === item || undefined} draggable={false} />
        ))}
      </div>
      <div className="ctl-portal__bar">
        <div className="ctl-portal__pager">
          <PagerOrb direction="prev" label={tr(p.prev, locale)} disabled={item === 0} onClick={() => setItem((i) => Math.max(0, i - 1))} />
          <span className="ctl-portal__where" aria-live="polite">
            <Readout>{tr(p.kicker, locale)}</Readout>
            <Index current={item + 1} total={n} />
          </span>
          <PagerOrb direction="next" label={tr(p.next, locale)} disabled={item === n - 1} onClick={() => setItem((i) => Math.min(n - 1, i + 1))} />
        </div>
        <GlassClose className="ctl-only-wide" showLabel />
        <GlassClose className="ctl-only-narrow" />
      </div>
      <div className="ctl-portal__foot">
        <h3 className="ev-t-card ctl-portal__title">{tr(T.tables[item].title, locale)}</h3>
        <div className="ctl-portal__actions">
          <GhostAction icon={<ArrowUpRight />} iconPosition="end">{tr(p.detail, locale)}</GhostAction>
          <PrimaryPlate size="lg" busy={busy} onClick={() => run()}>{tr(p.book, locale)}</PrimaryPlate>
        </div>
      </div>
    </div>
  );
}

/* ── 02 Choices ──────────────────────────────────────────────────────── */

function Choices({ locale }: { locale: Locale }) {
  const [moment, setMoment] = useState<string | null>("3");
  const [interests, setInterests] = useState<string[]>(["0", "2"]);
  const [booking, setBooking] = useState<string | null>("0");
  const [setup, setSetup] = useState("dinner");
  const icons = [<UtensilsCrossed key="a" />, <Sparkles key="b" />, <Mic key="c" />];
  const s = T.setup;
  return (
    <div className="ctl-scenes">
      <div className="ctl-form">
        <div className="ctl-ask">
          <Question>{tr(T.moment.question, locale)}</Question>
          <ChipGroup label={tr(T.moment.question, locale)} numbered value={moment} onChange={setMoment} options={tr(T.moment.options, locale).map((label, i) => ({ value: String(i), label }))} />
        </div>
        <div className="ctl-ask">
          <Question hint={tr(T.interests.hint, locale)}>{tr(T.interests.question, locale)}</Question>
          <ChipGroup
            label={`${tr(T.interests.question, locale)} (${tr(T.interests.hint, locale)})`}
            multiple
            max={3}
            value={interests}
            onChange={setInterests}
            options={tr(T.interests.options, locale).map((label, i) => ({ value: String(i), label }))}
          />
        </div>
        <div className="ctl-ask">
          <Question>{tr(T.booking.question, locale)}</Question>
          <OptionRows
            label={tr(T.booking.question, locale)}
            numbered
            value={booking}
            onChange={setBooking}
            options={tr(T.booking.options, locale).map(([label, hint], i) => ({ value: String(i), label, hint, icon: icons[i] }))}
          />
        </div>
      </div>

      <div className="ctl-setup">
        <div className="ctl-frame ctl-setup__frame">
          <div className="ctl-frame__media ctl-frame__media--wipe" aria-hidden="true">
            {s.options.map((o) => (
              <img key={o.value} src={DOSSIER + o.image} alt="" decoding="async" loading="lazy" data-current={o.value === setup || undefined} draggable={false} />
            ))}
          </div>
          <span className="ctl-setup__meta" aria-live="polite">
            <Readout>{tr(s.options.find((o) => o.value === setup)!.meta, locale)}</Readout>
          </span>
        </div>
        <SegmentedControl label={tr(s.label, locale)} value={setup} onChange={setSetup} options={s.options.map((o) => ({ value: o.value, label: tr(o.label, locale) }))} />
      </div>
    </div>
  );
}

/* ── 03 Fields ───────────────────────────────────────────────────────── */

function Fields({ locale }: { locale: Locale }) {
  const f = T.fields;
  const [name, setName] = useState("Camille Laurent");
  const [email, setEmail] = useState("camille@");
  const [touched, setTouched] = useState(true);
  const [sms, setSms] = useState(true);
  const [sent, setSent] = useState(false);
  const [busy, run] = useBusy();
  const emailValid = EMAIL_RE.test(email.trim());
  const complete = name.trim().length > 0 && emailValid;
  return (
    <form
      className="ctl-form ctl-request"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (complete && !busy) run(() => setSent(true));
      }}
    >
      <FieldGrid>
        <UnderlineField label={tr(f.name, locale)} required autoComplete="off" value={name} onChange={(e) => (setName(e.target.value), setSent(false))} />
        <UnderlineField label={tr(f.phone, locale)} type="tel" inputMode="tel" autoComplete="off" optional />
        <UnderlineField
          label={tr(f.email, locale)}
          required
          wide
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => (setEmail(e.target.value), setSent(false))}
          onBlur={() => setTouched(true)}
          error={touched && !emailValid ? tr(f.emailError, locale) : undefined}
        />
        <UnderlineField label={tr(f.notes, locale)} optional wide multiline placeholder={tr(f.notesPlaceholder, locale)} />
      </FieldGrid>
      <Switch checked={sms} onCheckedChange={setSms} label={tr(f.sms, locale)} description={tr(f.smsDesc, locale)} />
      <div className="ctl-request__actions">
        <PrimaryPlate type="submit" disabled={!complete} busy={busy}>{tr(f.send, locale)}</PrimaryPlate>
        <span role="status">{sent && <Tag tone="accent" dot>{tr(f.sent, locale)}</Tag>}</span>
      </div>
    </form>
  );
}

/* ── 04 Progress: a timed sequence under the pause model ─────────────── */

const DWELL = 4000;

function Timed({ locale }: { locale: Locale }) {
  const e = T.evening;
  const ref = useRef<HTMLDivElement>(null);
  const near = useInViewPause(ref, { rootMargin: "600px 0px", ignoreSuspension: true, once: true }).active;
  const gate = useMediaReady(near, e.items.map((it) => DOSSIER + it.image));
  const [hold, setHold] = useState(false);
  const pause = useInViewPause(ref, { enabled: gate.ready && !hold });
  const [phase, setPhase] = useState(0);
  const clock = useSequenceClock(phase, pause.active, DWELL, () => setPhase((p) => (p + 1) % e.items.length));
  const titles = e.items.map((it) => tr(it.title, locale));
  const why = hold ? e.why.hold : pause.suspended ? e.why.suspended : !pause.documentVisible ? e.why.hidden : !pause.inView ? e.why.off : null;

  return (
    <div
      ref={ref}
      className="ctl-timed"
      onPointerEnter={(ev) => ev.pointerType === "mouse" && setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(ev) => !ev.currentTarget.contains(ev.relatedTarget as Node | null) && setHold(false)}
    >
      <div className="ctl-frame ctl-timed__frame" data-ready={gate.ready || undefined}>
        <div className="ctl-frame__media" aria-hidden="true">
          {e.items.map((it, i) => (
            <img key={it.image} src={DOSSIER + it.image} alt="" decoding="async" data-current={(gate.ready && i === phase) || undefined} draggable={false} />
          ))}
        </div>
        {gate.ready ? (
          <span className="ctl-timed__caption">
            <Index current={phase + 1} total={titles.length} />
            <span className="ev-t-card">{titles[phase]}</span>
          </span>
        ) : (
          (gate.slow || gate.failed) && (
            <span className="ctl-timed__loading" role="status">
              <Readout>{tr(gate.failed ? e.failed : e.preparing, locale)}</Readout>
              {gate.failed && <GhostAction onClick={gate.retry}>{tr(e.retry, locale)}</GhostAction>}
            </span>
          )
        )}
      </div>
      <div className="ctl-timed__bar">
        <SegmentedProgress size="lg" captions="complete" label={tr(e.label, locale)} count={titles.length} current={phase} labels={titles} clock={clock} onSelect={setPhase} />
        <Tag tone={pause.active ? "accent" : "neutral"} dot={pause.active} className="ctl-timed__status">
          {pause.active ? tr(e.running, locale) : `${tr(e.paused, locale)}${why ? ` · ${tr(why, locale)}` : ""}`}
        </Tag>
      </div>
    </div>
  );
}

/* ── 05 On paper: one booking flow, every role together ─────────────── */

function PaperFlow({ locale }: { locale: Locale }) {
  const fl = T.flow;
  const steps = tr(fl.steps, locale);
  const [step, setStep] = useState(2);
  const [guests, setGuests] = useState<string | null>("1");
  const [time, setTime] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sms, setSms] = useState(false);
  const [busy, run] = useBusy();
  const done = step >= TOTAL;
  const canContinue = step === 2 ? guests !== null : step === 3 ? time !== null : EMAIL_RE.test(email.trim());
  const restart = () => {
    setStep(2);
    setTime(null);
    setEmail("");
  };

  return (
    <div className="ctl-flow">
      <SegmentedProgress label={tr(fl.label, locale)} count={TOTAL} current={step} labels={steps} captions onSelect={setStep} canSelect={(i) => !done && i >= 2 && i < step} />
      <div className="ctl-flow__step" key={step}>
        {step === 2 && (
          <>
            <h3 className="ev-t-question">{tr(fl.guests.question, locale)}</h3>
            <ChipGroup size="lg" label={tr(fl.guests.question, locale)} value={guests} onChange={setGuests} options={fl.guests.options.map((label, i) => ({ value: String(i), label }))} />
          </>
        )}
        {step === 3 && (
          <>
            <h3 className="ev-t-question">{tr(fl.time.question, locale)}</h3>
            <ChipGroup size="lg" label={tr(fl.time.question, locale)} value={time} onChange={setTime} options={fl.time.options.map((label) => ({ value: label, label, disabled: label === fl.time.full }))} />
          </>
        )}
        {step === 4 && (
          <>
            <h3 className="ev-t-question">{tr(fl.contact.question, locale)}</h3>
            <div className="ctl-flow__contact">
              <UnderlineField label={tr(T.fields.email, locale)} required type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Switch checked={sms} onCheckedChange={setSms} label={tr(T.fields.sms, locale)} description={tr(T.fields.smsDesc, locale)} />
            </div>
          </>
        )}
        {done && (
          <div role="status">
            <h3 className="ev-t-question">{tr(fl.done.title, locale)}</h3>
            <p className="ev-t-body ctl-flow__body">{tr(fl.done.body, locale)}</p>
          </div>
        )}
      </div>
      <div className="ctl-flow__actions">
        {done ? (
          <GhostAction icon={<ArrowLeft />} onClick={restart}>{tr(fl.again, locale)}</GhostAction>
        ) : (
          <>
            <GhostAction icon={<ArrowLeft />} disabled={step <= 2 || busy} onClick={() => setStep((s) => s - 1)}>{tr(fl.back, locale)}</GhostAction>
            <PrimaryPlate disabled={!canContinue} busy={busy} onClick={() => (step === 4 ? run(() => setStep(TOTAL)) : setStep((s) => s + 1))}>
              {step === 4 ? tr(T.fields.send, locale) : tr(fl.next, locale)}
            </PrimaryPlate>
          </>
        )}
      </div>
    </div>
  );
}
