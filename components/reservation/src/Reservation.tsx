import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { DayPicker } from "react-day-picker";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { CalendarDays, CheckCircle, ChevronLeft, ChevronRight, Clock, Sparkles, UserRound, Users } from "lucide-react";
import { EvoviewSignature } from "./EvoviewSignature";
import type { ReservationConfig, ReservationIcon, ReservationRequest, ReservationWindow } from "./types";
import "./reservation.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const formatTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let m = from; m <= to; m += step) out.push(m);
  return out;
};

const startTimesFor = (windows: ReservationWindow[], step: number) =>
  windows.flatMap((w) => range(toMinutes(w.open), toMinutes(w.close) - step, step)).map(formatTime);

const endTimesFor = (windows: ReservationWindow[], startTime: string, step: number) => {
  const start = toMinutes(startTime);
  const window = windows.find((w) => start >= toMinutes(w.open) && start < toMinutes(w.close));
  return window ? range(start + step, toMinutes(window.close), step).map(formatTime) : [];
};

function Step({ number, title, icon: Icon, children }: { number: number; title: string; icon: ReservationIcon; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (number > 1) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [number]);

  return (
    <div ref={ref} className="evo-resa__step">
      <div className="evo-resa__step-head">
        <span className="evo-resa__step-num">{number}</span>
        <h3 className="evo-resa__step-title">
          <Icon className="evo-resa__step-icon" />
          {title}
        </h3>
      </div>
      <div className="evo-resa__step-body">{children}</div>
    </div>
  );
}

function ChoiceList<T extends string | number>({ items, selected, onSelect, wide }: { items: T[]; selected: T | null; onSelect: (v: T) => void; wide?: boolean }) {
  return (
    <div className="evo-resa__choices">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={selected === item}
          onClick={() => onSelect(item)}
          className={`evo-resa__chip${wide ? " evo-resa__chip--wide" : ""}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function Reservation({ config }: { config: ReservationConfig }) {
  const { copy: c, experiences, windows, guests: guestRange, submit } = config;
  const step = config.slotMinutes ?? 30;

  const onMount = config.onMount;
  useEffect(() => onMount?.(), [onMount]);

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const current = experiences.find((e) => e.value === experience);
  const requiresEndTime = !!current?.requiresEndTime;
  const dayWindows = date ? windows(date) : [];
  const startTimes = startTimesFor(dayWindows, step);
  const endTimes = date && startTime ? endTimesFor(dayWindows, startTime, step) : [];

  const today = startOfDay(new Date());
  const lastDay = config.maxDaysAhead ? addDays(today, config.maxDaysAhead) : undefined;
  const isDisabled = (d: Date) => isBefore(d, today) || (lastDay ? isBefore(lastDay, d) : false) || windows(d).length === 0;

  const selectExperience = (value: string) => {
    setExperience(value);
    setEndTime("");
  };
  const selectDate = (d: Date | undefined) => {
    setDate(d);
    setStartTime("");
    setEndTime("");
  };
  const selectStartTime = (time: string) => {
    setStartTime(time);
    setEndTime("");
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
    if (!experience || !date || guests === null || !startTime || (requiresEndTime && !endTime)) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

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

    if (result.ok) setConfirmed(true);
    else if (result.fieldErrors) setFieldErrors(result.fieldErrors as Record<string, string>);
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
  };

  const style = {
    ...(config.accent ? { "--resa-accent": config.accent } : {}),
    ...(config.accentForeground ? { "--resa-accent-fg": config.accentForeground } : {}),
    ...config.vars,
    ...config.style,
  } as CSSProperties;

  const field = (id: string, label: ReactNode, input: ReactNode, error?: string) => (
    <div className="evo-resa__field">
      <label htmlFor={id} className="evo-resa__label">{label}</label>
      {input}
      {error && <p id={`${id}-error`} className="evo-resa__error">{error}</p>}
    </div>
  );

  return (
    <div className={`evo-resa${config.className ? ` ${config.className}` : ""}`} style={style}>
      <div className="evo-resa__card">
        {confirmed ? (
          <div className="evo-resa__done" role="status">
            <CheckCircle className="evo-resa__done-icon" />
            <h3 className="evo-resa__done-title">{c.confirmationTitle}</h3>
            <p className="evo-resa__done-text">{c.confirmationMessage}</p>
            <button type="button" className="evo-resa__ghost" onClick={resetForm}>{c.submitAnother}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="evo-resa__form" noValidate>
            <Step number={1} title={c.experienceLabel} icon={Sparkles}>
              <div role="radiogroup" className="evo-resa__experiences">
                {experiences.map(({ value, label, desc, icon: Icon }) => (
                  <label key={value} className="evo-resa__experience" data-selected={experience === value || undefined}>
                    <input type="radio" name="experience" value={value} checked={experience === value} onChange={() => selectExperience(value)} className="evo-resa__sr" />
                    <Icon className="evo-resa__experience-icon" />
                    <span className="evo-resa__experience-label">{label}</span>
                    <span className="evo-resa__experience-desc">{desc}</span>
                  </label>
                ))}
              </div>
            </Step>

            {experience && (
              <Step number={2} title={c.dateLabel} icon={CalendarDays}>
                <DayPicker
                  mode="single"
                  selected={date}
                  onSelect={selectDate}
                  disabled={isDisabled}
                  showOutsideDays
                  locale={config.dateLocale}
                  className="evo-resa__calendar"
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
                  components={{
                    Chevron: ({ orientation }) => (orientation === "left" ? <ChevronLeft className="evo-cal__chevron" /> : <ChevronRight className="evo-cal__chevron" />),
                  }}
                />
                {c.closedNote && <p className="evo-resa__hint">{c.closedNote}</p>}
              </Step>
            )}

            {experience && date && (
              <Step number={3} title={c.guestsLabel} icon={Users}>
                <ChoiceList
                  items={Array.from({ length: guestRange.max - guestRange.min + 1 }, (_, i) => i + guestRange.min)}
                  selected={guests}
                  onSelect={setGuests}
                />
              </Step>
            )}

            {experience && date && guests !== null && (
              <Step number={4} title={c.timeLabel} icon={Clock}>
                <div className="evo-resa__stack">
                  <div>
                    <span className="evo-resa__sublabel">{c.startTimeLabel}</span>
                    <ChoiceList items={startTimes} selected={startTime} onSelect={selectStartTime} wide />
                  </div>
                  {startTime && requiresEndTime && (
                    <div className="evo-resa__reveal">
                      <span className="evo-resa__sublabel">{c.endTimeLabel}</span>
                      <ChoiceList items={endTimes} selected={endTime} onSelect={setEndTime} wide />
                    </div>
                  )}
                  {current?.timeNote && <p className="evo-resa__note">{current.timeNote}</p>}
                </div>
              </Step>
            )}

            {experience && date && guests !== null && startTime && (!requiresEndTime || endTime) && (
              <Step number={5} title={c.contactLabel} icon={UserRound}>
                <div className="evo-resa__contact">
                  <div className="evo-resa__fields">
                    {field("evo-resa-name", <>{c.nameLabel} *</>,
                      <input id="evo-resa-name" className="evo-resa__input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fieldErrors.name || undefined} aria-describedby={fieldErrors.name ? "evo-resa-name-error" : undefined} />,
                      fieldErrors.name)}
                    {field("evo-resa-phone", <>{c.phoneLabel} *</>,
                      <input id="evo-resa-phone" type="tel" className="evo-resa__input" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!fieldErrors.phone || undefined} aria-describedby={fieldErrors.phone ? "evo-resa-phone-error" : undefined} />,
                      fieldErrors.phone)}
                    {field("evo-resa-email", <>{c.emailLabel} *</>,
                      <input id="evo-resa-email" type="email" className="evo-resa__input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fieldErrors.email || undefined} aria-describedby={fieldErrors.email ? "evo-resa-email-error" : undefined} />,
                      fieldErrors.email)}
                    {field("evo-resa-notes", <>{c.notesLabel} <span className="evo-resa__muted">({c.notesOptional})</span></>,
                      <textarea id="evo-resa-notes" className="evo-resa__input evo-resa__textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={c.notesPlaceholder} />,
                      fieldErrors.notes)}
                  </div>
                  <div className="evo-resa__actions">
                    <button type="submit" className="evo-resa__submit" disabled={submitting}>
                      {submitting ? c.submitting : c.submit}
                    </button>
                  </div>
                </div>
              </Step>
            )}
          </form>
        )}
        <EvoviewSignature lead={c.signatureLead} ariaLabel={c.signatureAriaLabel} />
      </div>
    </div>
  );
}
