import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import EvoviewLogo from "./brand/EvoviewLogo";
import ringEyeSvg from "./brand/eye-4-ring.svg?raw";
import { ArrowLeft, ArrowRight, Check, Chevron, EyeGlyph } from "./marks";
import type { ReservationConfig, ReservationRequest, ReservationWindow } from "./types";
import "./reservation.css";

// The emblem's iris follows the accent; the white contours stay.
const RING_EYE = ringEyeSvg.replace(/#6078FF/gi, "currentColor").replace(/ width="380" height="380"/, "");

/* Protected Evoview attribution: the header wordmark links here. Not a client setting. */
export const EVOVIEW_URL = "https://evoview.be/";

const STEP_KEYS = ["experience", "date", "guests", "time", "contact"] as const;
const TOTAL = STEP_KEYS.length;
const ADVANCE_MS = 340;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const formatTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let m = from; m <= to; m += step) out.push(m);
  return out;
};
const slotsOf = (w: ReservationWindow, step: number) => range(toMinutes(w.open), toMinutes(w.close) - step, step).map(formatTime);
const endTimesFor = (windows: ReservationWindow[], startTime: string, step: number) => {
  const start = toMinutes(startTime);
  const window = windows.find((w) => start >= toMinutes(w.open) && start < toMinutes(w.close));
  return window ? range(start + step, toMinutes(window.close), step).map(formatTime) : [];
};

function Pills<T extends string | number>({ items, selected, onSelect, render, label }: { items: T[]; selected: T | null; onSelect: (v: T) => void; render?: (v: T) => ReactNode; label: string }) {
  return (
    <div className="evo-resa-pills" role="group" aria-label={label}>
      {items.map((item) => (
        <button key={item} type="button" className="evo-resa-pill" aria-pressed={selected === item} onClick={() => onSelect(item)}>
          {render ? render(item) : item}
        </button>
      ))}
    </div>
  );
}

export function Reservation({ config }: { config: ReservationConfig }) {
  const { copy: c, experiences, windows, guests: guestRange, submit, venue } = config;
  const slot = config.slotMinutes ?? 30;

  const onMount = config.onMount;
  useEffect(() => onMount?.(), [onMount]);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const interacted = useRef(false);

  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const current = experiences.find((e) => e.value === experience);
  const requiresEndTime = !!current?.requiresEndTime;
  const dayWindows = date ? windows(date) : [];
  const endTimes = date && startTime ? endTimesFor(dayWindows, startTime, slot) : [];

  const answered = [
    !!experience,
    !!date,
    guests !== null,
    !!startTime && (!requiresEndTime || !!endTime),
    !!name.trim() && !!phone.trim() && EMAIL_RE.test(email.trim()),
  ];
  const firstOpen = answered.indexOf(false) === -1 ? TOTAL - 1 : answered.indexOf(false);

  const today = startOfDay(new Date());
  const lastDay = config.maxDaysAhead ? addDays(today, config.maxDaysAhead) : undefined;
  const isDisabled = (d: Date) => isBefore(d, today) || (lastDay ? isBefore(lastDay, d) : false) || windows(d).length === 0;

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  // After a user-driven step change: bring the chassis top into view and move focus to the question.
  useEffect(() => {
    if (!interacted.current) return;
    const root = rootRef.current;
    if (root) {
      const top = root.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: top + window.scrollY - 96, behavior: reduce ? "auto" : "smooth" });
      }
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step, confirmed]);

  const goTo = (i: number) => {
    window.clearTimeout(advanceTimer.current);
    interacted.current = true;
    setBlocked(false);
    setStep(Math.max(0, Math.min(i, TOTAL - 1)));
  };
  const advanceSoon = (from: number) => {
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => goTo(from + 1), ADVANCE_MS);
  };

  const selectExperience = (value: string) => {
    setExperience(value);
    setEndTime("");
    advanceSoon(0);
  };
  const selectDate = (d: Date | undefined) => {
    setDate(d);
    setStartTime("");
    setEndTime("");
    if (d) advanceSoon(1);
  };
  const selectGuests = (n: number) => {
    setGuests(n);
    advanceSoon(2);
  };
  const selectStart = (time: string) => {
    setStartTime(time);
    setEndTime("");
    if (!requiresEndTime) advanceSoon(3);
  };
  const selectEnd = (time: string) => {
    setEndTime(time);
    advanceSoon(3);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = c.errorRequired;
    if (!phone.trim()) errs.phone = c.errorRequired;
    if (!email.trim()) errs.email = c.errorRequired;
    else if (!EMAIL_RE.test(email.trim())) errs.email = c.errorInvalidEmail;
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < TOTAL - 1) {
      if (answered[step]) goTo(step + 1);
      else setBlocked(true);
      return;
    }
    if (!experience || !date || guests === null || !startTime || (requiresEndTime && !endTime)) {
      goTo(firstOpen);
      return;
    }
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    setFormError("");

    const trimmedNotes = notes.trim();
    const request: ReservationRequest = {
      experience,
      date,
      dateISO: format(date, "yyyy-MM-dd"),
      startTime,
      ...(requiresEndTime ? { endTime } : {}),
      guests,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    };

    let result: Awaited<ReturnType<typeof submit>>;
    try {
      result = await submit(request);
    } catch {
      result = { ok: false, error: c.errorGeneric };
    }
    setSubmitting(false);
    config.onResult?.(result, request);

    if (result.ok) {
      interacted.current = true;
      setConfirmed(true);
    } else {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors as Record<string, string>);
      setFormError(result.error || c.errorGeneric);
    }
  };

  const resetForm = () => {
    setExperience(null);
    setDate(undefined);
    setGuests(null);
    setStartTime("");
    setEndTime("");
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setConfirmed(false);
    setFieldErrors({});
    setFormError("");
    goTo(0);
  };

  const guestLabel = (n: number) => `${n} ${n > 1 ? c.guestsUnit.many : c.guestsUnit.one}`;
  const values: (string | null)[] = [
    current?.label ?? null,
    date ? format(date, "EEEE d MMMM", { locale: config.dateLocale }) : null,
    guests !== null ? guestLabel(guests) : null,
    startTime ? (endTime ? `${startTime} → ${endTime}` : startTime) : null,
    name.trim() || null,
  ];

  const style = {
    ...(config.accent ? { "--resa-accent": config.accent } : {}),
    ...(config.accentInk ? { "--resa-accent-ink": config.accentInk } : {}),
    ...config.vars,
    ...config.style,
  } as CSSProperties;

  const stepCopy = c.steps[STEP_KEYS[step]];
  const canVisit = (i: number) => !confirmed && i <= firstOpen;

  const ticket = (
    <div className="evo-resa-ticket" data-sent={confirmed || undefined}>
      <div className="evo-resa-ticket__head">
        <span className="evo-resa-readout evo-resa-ticket__status"><i className="evo-resa-rec" aria-hidden="true" />{confirmed ? c.statusSent : c.statusDraft}</span>
        <span className="evo-resa-readout evo-resa-ticket__venue">{venue.name}</span>
      </div>
      <div className={`evo-resa-ticket__date${date ? "" : " is-empty"}`} aria-hidden={!date}>
        {date ? (
          <>
            <span>{format(date, "EEE", { locale: config.dateLocale }).replace(".", "")}</span>
            <strong>{format(date, "d")}</strong>
            <span>{format(date, "MMM yyyy", { locale: config.dateLocale }).replace(".", "")}</span>
          </>
        ) : (
          <>
            <span>···</span>
            <strong>00</strong>
            <span>{c.steps.date.short}</span>
          </>
        )}
      </div>
      <dl className="evo-resa-ticket__rows">
        {([0, 2, 3, 4] as const).map((i) => (
          <div key={i} data-filled={!!values[i] || undefined}>
            <dt className="evo-resa-readout">{c.steps[STEP_KEYS[i]].short}</dt>
            <dd>{values[i] ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <EvoviewLogo className="evo-resa-ticket__mark" alt="" />
    </div>
  );

  let body: ReactNode;
  if (step === 0) {
    body = (
      <div className="evo-resa-choices" role="group" aria-label={stepCopy.short}>
        {experiences.map((exp, i) => {
          const Icon = exp.icon;
          return (
            <button key={exp.value} type="button" className="evo-resa-choice" aria-pressed={experience === exp.value} onClick={() => selectExperience(exp.value)}>
              <span className="evo-resa-readout evo-resa-choice__index">{pad(i + 1)}</span>
              {Icon ? <Icon className="evo-resa-choice__eye" /> : <EyeGlyph className="evo-resa-choice__eye" variant={i === experiences.length - 1 && i > 0 ? 4 : i} />}
              <span className="evo-resa-choice__label">{exp.label}</span>
              <span className="evo-resa-readout evo-resa-choice__hint">{exp.desc}</span>
              <span className="evo-resa-choice__check" aria-hidden="true"><Check /></span>
            </button>
          );
        })}
      </div>
    );
  } else if (step === 1) {
    body = (
      <div className="evo-resa-calendar-wrap">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={selectDate}
          disabled={isDisabled}
          defaultMonth={date}
          showOutsideDays
          locale={config.dateLocale}
          className="evo-resa-calendar"
          classNames={{
            months: "evo-cal__months",
            month: "evo-cal__month",
            nav: "evo-cal__nav",
            button_previous: "evo-cal__navbtn",
            button_next: "evo-cal__navbtn",
            month_caption: "evo-cal__caption",
            caption_label: "evo-cal__caption-label",
            month_grid: "evo-cal__grid",
            weekdays: "evo-cal__weekdays",
            weekday: "evo-cal__weekday",
            week: "evo-cal__week",
            day: "evo-cal__day",
            day_button: "evo-cal__daybtn",
            selected: "is-selected",
            today: "is-today",
            outside: "is-outside",
            disabled: "is-disabled",
            hidden: "is-hidden",
          }}
          components={{ Chevron: ({ orientation }) => <Chevron className="evo-cal__chevron" dir={orientation === "left" ? "left" : "right"} /> }}
        />
        {c.closedNote && <p className="evo-resa-readout evo-resa-note"><i className="evo-resa-rec" aria-hidden="true" />{c.closedNote}</p>}
      </div>
    );
  } else if (step === 2) {
    const counts = Array.from({ length: guestRange.max - guestRange.min + 1 }, (_, i) => i + guestRange.min);
    body = <Pills label={stepCopy.short} items={counts} selected={guests} onSelect={selectGuests} render={(n) => <><span className="evo-resa-pill__mark">{pad(n)}</span>{n > 1 ? c.guestsUnit.many : c.guestsUnit.one}</>} />;
  } else if (step === 3) {
    body = (
      <div className="evo-resa-times">
        {dayWindows.map((w, wi) => (
          <div key={wi} className="evo-resa-group">
            <span className="evo-resa-readout evo-resa-group__title">{w.label ?? c.startTimeLabel}<span>{w.open} — {w.close}</span></span>
            <Pills label={w.label ?? c.startTimeLabel} items={slotsOf(w, slot)} selected={startTime || null} onSelect={selectStart} />
          </div>
        ))}
        {startTime && requiresEndTime && (
          <div className="evo-resa-group evo-resa-reveal">
            <span className="evo-resa-readout evo-resa-group__title">{c.endTimeLabel}<span>{startTime} →</span></span>
            <Pills label={c.endTimeLabel} items={endTimes} selected={endTime || null} onSelect={selectEnd} />
          </div>
        )}
        {current?.timeNote && <p className="evo-resa-readout evo-resa-note"><i className="evo-resa-rec" aria-hidden="true" />{current.timeNote}</p>}
      </div>
    );
  } else {
    const field = (id: string, key: string, label: string, input: ReactNode, wide = false, optional = false) => (
      <div className={`evo-resa-field${wide ? " is-wide" : ""}`}>
        <label htmlFor={id} className="evo-resa-readout">
          {label} {optional ? <small>({c.optional})</small> : "*"}
        </label>
        {input}
        {fieldErrors[key] && <p id={`${id}-error`} className="evo-resa-field__error">{fieldErrors[key]}</p>}
      </div>
    );
    const aria = (key: string, id: string) => ({ "aria-invalid": !!fieldErrors[key] || undefined, "aria-describedby": fieldErrors[key] ? `${id}-error` : undefined });
    body = (
      <>
        <div className="evo-resa-inline-ticket">{ticket}</div>
        <div className="evo-resa-fields">
          {field("evo-resa-name", "name", c.nameLabel, <input id="evo-resa-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} {...aria("name", "evo-resa-name")} />)}
          {field("evo-resa-phone", "phone", c.phoneLabel, <input id="evo-resa-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} {...aria("phone", "evo-resa-phone")} />)}
          {field("evo-resa-email", "email", c.emailLabel, <input id="evo-resa-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} {...aria("email", "evo-resa-email")} />, true)}
          {field("evo-resa-notes", "notes", c.notesLabel, <textarea id="evo-resa-notes" value={notes} placeholder={c.notesPlaceholder} onChange={(e) => setNotes(e.target.value)} />, true, true)}
        </div>
      </>
    );
  }

  const last = step === TOTAL - 1;

  return (
    <div ref={rootRef} className={`evo-resa${config.className ? ` ${config.className}` : ""}`} style={style}>
      <div className="evo-resa__chassis">
        <span className="evo-resa__grain" aria-hidden="true" />

        <header className="evo-resa-top">
          <a className="evo-resa-top__brand" href={EVOVIEW_URL} target="_blank" rel="noopener" aria-label={c.signatureAriaLabel}>
            <EvoviewLogo className="evo-resa-top__logo" alt="" />
          </a>
          <span className="evo-resa-top__divider" aria-hidden="true" />
          <span className="evo-resa-top__meta">
            <span className="evo-resa-readout evo-resa-top__kicker">{c.kicker} · {venue.name}</span>
            <span className="evo-resa-readout evo-resa-top__title" aria-live="polite">
              {confirmed ? c.statusSent : `${pad(step + 1)} / ${pad(TOTAL)} · ${stepCopy.short}`}
            </span>
          </span>
          <span className="evo-resa-top__progress">
            {STEP_KEYS.map((key, i) => (
              <button
                key={key}
                type="button"
                aria-label={c.steps[key].short}
                aria-current={i === step && !confirmed ? "step" : undefined}
                disabled={!canVisit(i) || i === step}
                onClick={() => goTo(i)}
                className={confirmed || i < step ? "is-done" : i === step ? "is-current" : ""}
              >
                <i />
              </button>
            ))}
          </span>
        </header>

        <div className="evo-resa__body">
          <form className="evo-resa-stage" onSubmit={handleSubmit} noValidate>
            <span className="evo-resa-stage__light" aria-hidden="true" />
            {confirmed ? (
              <div className="evo-resa-scroll evo-resa-done" key="done">
                <span className="evo-resa-done__emblem" aria-hidden="true" dangerouslySetInnerHTML={{ __html: RING_EYE }} />
                <span className="evo-resa-readout evo-resa-done__kicker">{c.confirmationKicker}</span>
                <h3 ref={headingRef} tabIndex={-1} className="evo-resa-done__title">{c.confirmationTitle}</h3>
                <p className="evo-resa-done__text">{c.confirmationMessage}</p>
                <div className="evo-resa-inline-ticket">{ticket}</div>
                <button type="button" className="evo-resa-ghost evo-resa-readout" onClick={resetForm}>
                  <ArrowLeft className="evo-resa-ghost__icon" />
                  {c.submitAnother}
                </button>
              </div>
            ) : (
              <>
                <div className="evo-resa-scroll" key={step}>
                  <div className="evo-resa-question">
                    <h3 ref={headingRef} tabIndex={-1}>
                      <span className="evo-resa-mark">{pad(step + 1)}</span>
                      {stepCopy.title}
                    </h3>
                    <p>{stepCopy.hint}</p>
                  </div>
                  {body}
                </div>
                <div className="evo-resa-bar">
                  <button type="button" className="evo-resa-ghost evo-resa-readout" onClick={() => goTo(step - 1)} disabled={step === 0}>
                    <ArrowLeft className="evo-resa-ghost__icon" />
                    {c.back}
                  </button>
                  {(blocked || formError) && <p className="evo-resa-bar__error" role="alert">{formError || c.chooseToContinue}</p>}
                  <button type="submit" className="evo-resa-primary" disabled={submitting} aria-busy={submitting || undefined}>
                    {last ? (submitting ? c.submitting : c.submit) : c.next}
                    <span className="evo-resa-primary__orb"><ArrowRight /></span>
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
