import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { addDays, format, isBefore, isSameDay, startOfDay } from "date-fns";
import EvoviewLogo from "./brand/EvoviewLogo";
import ringEyeSvg from "./brand/eye-4-ring.svg?raw";
import { OrbFill } from "../foundation/OrbFill";
import { SurfaceFill } from "../foundation/SurfaceFill";
import { TextFill } from "../foundation/TextFill";
import { usePressJelly } from "../foundation/usePressJelly";
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
// Room left above the chassis when it scrolls itself into view (host fixed navbar).
const SCROLL_OFFSET = 96;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_ORDER = ["name", "phone", "email"] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const OVERFLOW = (max: number) => max + 1;
// French typography: keep "?", "!", ":" and ";" on the line of the word before them.
const nbsp = (text: string) => text.replace(/ ([?!:;])/g, "\u00a0$1");
// Headings: also never break a hyphenated word ("serez-vous", "attend-on") across lines.
const heading = (text: string) =>
  nbsp(text)
    .split(/(\S+-\S+)/)
    .map((part, i) => (i % 2 ? <span key={i} className="evo-resa-nowrap">{part}</span> : part));
const smooth = (): ScrollBehavior => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
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

/* Text colour switches rise in as liquid (RULES §1). */
function PillInk({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <TextFill ink={on ? "#fff" : undefined} hoverWithin=".evo-resa-pill" hoverInk="#fff" withFocus={false}>
      {children}
    </TextFill>
  );
}

function GhostInk({ children }: { children: ReactNode }) {
  return (
    <TextFill hoverWithin=".evo-resa-ghost" hoverInk="#fff" withFocus={false}>
      {children}
    </TextFill>
  );
}

/* Calendar day: the hover ink rises in; a selected day's ink follows its accent disc. */
function DayButton({ day: _day, modifiers, children, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const still = modifiers.selected || modifiers.disabled || modifiers.outside;
  return (
    <button ref={ref} data-ev-jelly="" {...props}>
      <TextFill hoverWithin={still ? undefined : ".evo-cal__daybtn"} hoverInk="#fff" withFocus={false}>
        {children}
      </TextFill>
    </button>
  );
}

/* A pill's number mark is an orb: selection fills it as liquid (RULES §1).
   The hidden copy keeps the mark's width, the fill sits over it. */
function PillMark({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className="evo-resa-pill__mark" aria-hidden="true">
      <span className="evo-resa-pill__sizer">{children}</span>
      <OrbFill on={on}>{children}</OrbFill>
    </span>
  );
}

function Pills<T extends string | number>({ items, selected, onSelect, render, label, className }: { items: T[]; selected: T | null; onSelect: (v: T) => void; render?: (v: T, selected: boolean) => ReactNode; label: string; className?: string }) {
  return (
    <div className={`evo-resa-pills${className ? ` ${className}` : ""}`} role="group" aria-label={label}>
      {items.map((item) => (
        <button key={item} type="button" className="evo-resa-pill" data-ev-jelly="" aria-pressed={selected === item} onClick={() => onSelect(item)}>
          {render ? render(item, selected === item) : <PillInk on={selected === item}>{item}</PillInk>}
        </button>
      ))}
    </div>
  );
}

export function Reservation({ config }: { config: ReservationConfig }) {
  const { copy: c, experiences, windows, guests: guestRange, submit, venue } = config;
  usePressJelly();
  const slot = config.slotMinutes ?? 30;

  const onMount = config.onMount;
  useEffect(() => onMount?.(), [onMount]);

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const interacted = useRef(false);

  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hours, setHours] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // `max + 1` stands for "more than max" when `guests.overflow` is on.
  const overflow = guests !== null && guests > guestRange.max;
  const current = experiences.find((e) => e.value === experience);
  const requiresEndTime = !!current?.requiresEndTime;
  const hoursSpec = current?.hours;
  const dayWindows = date ? windows(date) : [];
  const endTimes = date && startTime ? endTimesFor(dayWindows, startTime, slot) : [];
  // A start must leave room for the shortest duration when durations stay inside the window.
  const minHours = hoursSpec?.withinWindow ? Math.min(...hoursSpec.options) : 0;
  const startSlots = (w: ReservationWindow) => slotsOf(w, slot).filter((t) => toMinutes(t) + minHours * 60 <= toMinutes(w.close));
  const hourOptions = !hoursSpec || !startTime
    ? []
    : hoursSpec.options.filter((h) => {
        if (!hoursSpec.withinWindow) return true;
        const start = toMinutes(startTime);
        const w = dayWindows.find((x) => start >= toMinutes(x.open) && start < toMinutes(x.close));
        return !!w && start + h * 60 <= toMinutes(w.close);
      });

  const answered = [
    !!experience,
    !!date,
    guests !== null,
    !!startTime && (!requiresEndTime || !!endTime) && (!hoursSpec || hours !== null),
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
      // Also when the header strip sits under the host's fixed navbar.
      if (top < SCROLL_OFFSET - 8 || top > window.innerHeight * 0.6) {
        window.scrollTo({ top: top + window.scrollY - SCROLL_OFFSET, behavior: smooth() });
      }
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step, confirmed]);

  // The duration / end-time group appears below the start times: on short screens bring it into view.
  useEffect(() => {
    const el = revealRef.current;
    if (!startTime || !el) return;
    const { top, bottom } = el.getBoundingClientRect();
    const delta = Math.min(bottom + 24 - window.innerHeight, top - SCROLL_OFFSET);
    if (delta > 0) window.scrollBy({ top: delta, behavior: smooth() });
  }, [startTime]);

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

  // Re-tapping the current answer keeps it and moves on: on mobile the
  // auto-advancing steps have no "Continuer", so this is how to go forward again.
  const selectExperience = (value: string) => {
    if (value === experience) return advanceSoon(0);
    setExperience(value);
    setEndTime("");
    setHours(null);
    advanceSoon(0);
  };
  const selectDate = (d: Date | undefined) => {
    if (d && date && isSameDay(d, date)) return advanceSoon(1);
    setDate(d);
    setStartTime("");
    setEndTime("");
    setHours(null);
    if (d) advanceSoon(1);
  };
  const selectGuests = (n: number) => {
    setGuests(n);
    advanceSoon(2);
  };
  const selectStart = (time: string) => {
    if (time === startTime) {
      if (answered[3]) advanceSoon(3);
      return;
    }
    setStartTime(time);
    setEndTime("");
    setHours(null);
    if (!requiresEndTime && !hoursSpec) advanceSoon(3);
  };
  const selectHours = (h: number) => {
    setHours(h);
    advanceSoon(3);
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

  // Errors can sit above the fold (or behind the keyboard) when sending from the bottom of the form.
  const focusFirstInvalid = (errs: Record<string, string>) => {
    const key = FIELD_ORDER.find((k) => errs[k]);
    if (key) document.getElementById(`evo-resa-${key}`)?.focus();
  };
  // Enter on name / phone moves on instead of sending a half-filled form.
  const enterToNext = (next: string) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    document.getElementById(next)?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < TOTAL - 1) {
      if (answered[step]) goTo(step + 1);
      else setBlocked(true);
      return;
    }
    if (!experience || !date || guests === null || !startTime || (requiresEndTime && !endTime) || (hoursSpec && hours === null)) {
      goTo(firstOpen);
      return;
    }
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirstInvalid(errs);
      return;
    }
    setSubmitting(true);
    setFormError("");

    const trimmedNotes = notes.trim();
    const request: ReservationRequest = {
      experience,
      date,
      dateISO: format(date, "yyyy-MM-dd"),
      startTime,
      ...(requiresEndTime ? { endTime } : {}),
      ...(hoursSpec && hours !== null ? { hours } : {}),
      guests: overflow ? guestRange.max : guests,
      ...(overflow ? { guestsOverflow: true } : {}),
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
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors as Record<string, string>);
        focusFirstInvalid(result.fieldErrors as Record<string, string>);
      }
      setFormError(result.error || c.errorGeneric);
    }
  };

  const resetForm = () => {
    setExperience(null);
    setDate(undefined);
    setGuests(null);
    setStartTime("");
    setEndTime("");
    setHours(null);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setConfirmed(false);
    setFieldErrors({});
    setFormError("");
    goTo(0);
  };

  const unit = (n: number) => (n > 1 ? c.guestsUnit.many : c.guestsUnit.one);
  const guestLabel = (n: number) => (n > guestRange.max ? `+${guestRange.max} ${c.guestsUnit.many}` : `${n} ${unit(n)}`);
  const values: (string | null)[] = [
    current?.label ?? null,
    date ? format(date, "EEEE d MMMM", { locale: config.dateLocale }) : null,
    guests !== null ? guestLabel(guests) : null,
    startTime ? `${endTime ? `${startTime} → ${endTime}` : startTime}${hours !== null && hoursSpec ? ` · ${hours} h` : ""}` : null,
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
            <dt className="evo-resa-readout">
              <TextFill ink={values[i] ? "var(--resa-accent)" : undefined}>{c.steps[STEP_KEYS[i]].short}</TextFill>
            </dt>
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
          return (
            <button key={exp.value} type="button" className="evo-resa-choice" aria-pressed={experience === exp.value} onClick={() => selectExperience(exp.value)}>
              <span className="evo-resa-readout evo-resa-choice__index">{pad(i + 1)}</span>
              {exp.icon ? <span className="evo-resa-choice__icon" aria-hidden="true">{exp.icon}</span> : <EyeGlyph className="evo-resa-choice__eye" variant={i === experiences.length - 1 && i > 0 ? 4 : i} />}
              <span className="evo-resa-choice__label">{exp.label}</span>
              <span className="evo-resa-readout evo-resa-choice__hint">{exp.desc}</span>
              <span className="evo-resa-choice__check" aria-hidden="true"><OrbFill on={experience === exp.value} lit={<Check />} /></span>
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
          required
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
          components={{ Chevron: ({ orientation }) => <Chevron className="evo-cal__chevron" dir={orientation === "left" ? "left" : "right"} />, DayButton }}
        />
        {c.closedNote && <p className="evo-resa-readout evo-resa-note"><i className="evo-resa-rec" aria-hidden="true" />{c.closedNote}</p>}
      </div>
    );
  } else if (step === 2) {
    const counts = Array.from({ length: guestRange.max - guestRange.min + 1 }, (_, i) => i + guestRange.min);
    if (guestRange.overflow) counts.push(OVERFLOW(guestRange.max));
    body = (
      <div className="evo-resa-guests">
        <Pills
          label={stepCopy.short}
          items={counts}
          selected={guests}
          onSelect={selectGuests}
          render={(n, on) => (
            <>
              <PillMark on={on}>{n > guestRange.max ? `+${guestRange.max}` : pad(n)}</PillMark>
              <span className="evo-resa-pill__unit"><span className="evo-resa-sr">{n > guestRange.max ? `+${guestRange.max}` : n} </span><PillInk on={on}>{unit(n)}</PillInk></span>
            </>
          )}
        />
      </div>
    );
  } else if (step === 3) {
    body = (
      <div className="evo-resa-times">
        {dayWindows.filter((w) => startSlots(w).length > 0).map((w, wi) => (
          <div key={wi} className="evo-resa-group">
            <span className="evo-resa-readout evo-resa-group__title">{w.label ?? c.startTimeLabel}<span>{w.open} — {w.close}</span></span>
            <Pills className="is-slots" label={w.label ?? c.startTimeLabel} items={startSlots(w)} selected={startTime || null} onSelect={selectStart} />
          </div>
        ))}
        {startTime && requiresEndTime && (
          <div ref={revealRef} className="evo-resa-group evo-resa-reveal">
            <span className="evo-resa-readout evo-resa-group__title">{c.endTimeLabel}<span>{startTime} →</span></span>
            <Pills className="is-slots" label={c.endTimeLabel} items={endTimes} selected={endTime || null} onSelect={selectEnd} />
          </div>
        )}
        {startTime && hoursSpec && (
          <div ref={revealRef} className="evo-resa-group evo-resa-reveal">
            <span className="evo-resa-readout evo-resa-group__title">{c.hoursLabel ?? "Durée"}<span>{startTime} →</span></span>
            <Pills
              label={c.hoursLabel ?? "Durée"}
              items={hourOptions}
              selected={hours}
              onSelect={selectHours}
              render={(h, on) => (
                <>
                  <PillMark on={on}>{pad(h)}</PillMark>
                  <span className="evo-resa-pill__unit"><span className="evo-resa-sr">{h} </span><PillInk on={on}>{h > 1 ? c.hoursUnit?.many ?? "h" : c.hoursUnit?.one ?? "h"}</PillInk></span>
                </>
              )}
            />
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
          {field("evo-resa-name", "name", c.nameLabel, <input id="evo-resa-name" autoComplete="name" autoCapitalize="words" enterKeyHint="next" onKeyDown={enterToNext("evo-resa-phone")} value={name} onChange={(e) => setName(e.target.value)} {...aria("name", "evo-resa-name")} />)}
          {field("evo-resa-phone", "phone", c.phoneLabel, <input id="evo-resa-phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" onKeyDown={enterToNext("evo-resa-email")} value={phone} onChange={(e) => setPhone(e.target.value)} {...aria("phone", "evo-resa-phone")} />)}
          {field("evo-resa-email", "email", c.emailLabel, <input id="evo-resa-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="send" value={email} onChange={(e) => setEmail(e.target.value)} {...aria("email", "evo-resa-email")} />, true)}
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
          {config.attribution?.href === null ? (
            <span className="evo-resa-top__brand" data-link="paused" role="img" aria-label="Evoview">
              <EvoviewLogo className="evo-resa-top__logo" alt="" />
            </span>
          ) : (
            <a className="evo-resa-top__brand" href={config.attribution?.href ?? EVOVIEW_URL} target="_blank" rel="noopener" aria-label={c.signatureAriaLabel}>
              <EvoviewLogo className="evo-resa-top__logo" alt="" />
            </a>
          )}
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
                <h3 ref={headingRef} tabIndex={-1} className="evo-resa-done__title">{heading(c.confirmationTitle)}</h3>
                <p className="evo-resa-done__text">{nbsp(c.confirmationMessage)}</p>
                <div className="evo-resa-inline-ticket">{ticket}</div>
                <button type="button" className="evo-resa-ghost evo-resa-readout" data-ev-jelly="" onClick={resetForm}>
                  <GhostInk><ArrowLeft className="evo-resa-ghost__icon" /></GhostInk>
                  <GhostInk>{c.submitAnother}</GhostInk>
                </button>
              </div>
            ) : (
              <>
                <div className="evo-resa-scroll" key={step}>
                  <div className="evo-resa-question">
                    <h3 ref={headingRef} tabIndex={-1}>
                      <span className="evo-resa-mark">{pad(step + 1)}</span>
                      {heading(stepCopy.title)}
                    </h3>
                    <p>{nbsp(stepCopy.hint)}</p>
                  </div>
                  {body}
                </div>
                <div className={`evo-resa-bar${last ? "" : " evo-resa-bar--auto"}`}>
                  <button type="button" className="evo-resa-ghost evo-resa-readout" data-ev-jelly="" onClick={() => goTo(step - 1)} disabled={step === 0}>
                    <GhostInk><ArrowLeft className="evo-resa-ghost__icon" /></GhostInk>
                    <GhostInk>{c.back}</GhostInk>
                  </button>
                  {(blocked || formError) && <p className="evo-resa-bar__error" role="alert">{formError || c.chooseToContinue}</p>}
                  <button type="submit" className="evo-resa-primary" data-ev-jelly="" disabled={submitting} aria-busy={submitting || undefined}>
                    {last ? (submitting ? c.submitting : c.submit) : c.next}
                    <span className="evo-resa-primary__orb"><ArrowRight /></span>
                    <SurfaceFill hoverWithin=".evo-resa-primary">
                      <span>{last ? (submitting ? c.submitting : c.submit) : c.next}</span>
                      <span className="evo-resa-primary__orb"><ArrowRight /></span>
                    </SurfaceFill>
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
