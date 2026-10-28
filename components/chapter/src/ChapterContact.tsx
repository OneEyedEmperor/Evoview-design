import { useCallback, useId, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, Chevron, cn, TextFill, useInViewPause } from "../foundation";
import { PrimaryPlate } from "../controls";
import { Chapter, ChapterHeading, type ChapterRhythm, type ChapterTone } from "./Chapter";

/* ── Config types (filled by `buildChapterContactConfig` in chapter.config.tsx) ── */

export type ChapterContactChannel = {
  /** State-voice label over the value: "Téléphone", "Instagram"… */
  label: string;
  /** What the visitor reaches: the number, the address, the handle. */
  value: string;
  href?: string;
  /** Leaves the site: new tab, ↗ and the spoken hint. */
  external?: boolean;
};

export type ChapterContactHours = {
  /** h3 of the hours block. */
  title: string;
  /** IANA zone of the business; "today" and the open state are computed in it. */
  timeZone: string;
  /** Service names, one per slot column: ["Midi", "Soir"], ["Matin", "Après-midi"]. */
  services: string[];
  /** Monday → Sunday; per day one entry per service, "10:00–13:00" or null (closed). */
  week: (string | null)[][];
  /** Optional line under the hours (time zone, "by appointment"). */
  note?: string;
  labels: {
    /** Monday → Sunday. */
    days: string[];
    today: string;
    day: string;
    closed: string;
    weekToggle: string;
    openUntil: (time: string) => string;
    /** `day` is null when the next opening is later today. */
    opensAt: (day: string | null, time: string) => string;
    closedForNow: string;
  };
};

export type ChapterContactConfig = {
  title: ReactNode;
  lead?: ReactNode;
  /** The one primary action (booking, appointment). No Evoview mark beside it. */
  action?: { label: string; href: string; external?: boolean };
  /** Where: the address row(s). On phones they come first, then the hours. */
  place: ChapterContactChannel[];
  /** How to reach: phone, e-mail, messages, socials. */
  channels: ChapterContactChannel[];
  hours: ChapterContactHours;
  /** The place itself (façade, room). Shown by `columns` (under the hours) and `split` (the large side). `sizes` overrides the per-layout default. */
  picture?: { src: string; srcSet?: string; sizes?: string; alt: string; width: number; height: number };
  /** Spoken suffix for external links. */
  newTab: string;
};

/** columns: heading over channels | hours (the original) · split: heading + hours beside the picture and channels · band: one compact closing band. */
export const CHAPTER_CONTACT_LAYOUTS = ["columns", "split", "band"] as const;
export type ChapterContactLayout = (typeof CHAPTER_CONTACT_LAYOUTS)[number];
/** today: today's slots + live state, the week folded · week: the whole week laid out. */
export const CHAPTER_CONTACT_HOURS_VIEWS = ["today", "week"] as const;
export type ChapterContactHoursView = (typeof CHAPTER_CONTACT_HOURS_VIEWS)[number];

export type ChapterContactProps = {
  config: ChapterContactConfig;
  layout?: ChapterContactLayout;
  hours?: ChapterContactHoursView;
  id?: string;
  tone?: ChapterTone;
  rhythm?: ChapterRhythm;
  /** Section heading level; the hours title is one level below. */
  level?: 2 | 3;
  className?: string;
};

/* ── Business time ──────────────────────────────────────────────────── */

/** Monday = 0; minutes since the business's midnight. */
type Now = { day: number; minutes: number };
type Slot = { start: number; end: number; from: string; to: string };

const DAY = 1440;
const MINUTE_MS = 60_000;
const clocks = new Map<string, Intl.DateTimeFormat | null>();

/** Weekday and wall-clock minutes at `date` in the business's IANA zone; null for an unknown zone. */
function businessNow(timeZone: string, date: Date): Now | null {
  let clock = clocks.get(timeZone);
  if (clock === undefined) {
    try {
      clock = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" });
    } catch {
      clock = null;
    }
    clocks.set(timeZone, clock);
  }
  if (!clock) return null;
  const at: Record<string, number> = {};
  for (const part of clock.formatToParts(date)) at[part.type] = Number(part.value);
  /* The weekday from the zone's calendar date, not from locale day names. */
  const sunday0 = new Date(Date.UTC(at.year, at.month - 1, at.day)).getUTCDay();
  return { day: (sunday0 + 6) % 7, minutes: (at.hour % 24) * 60 + at.minute };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

function parseSlot(text: string | null): Slot | null {
  if (!text) return null;
  const [from, to] = text.split(/\s*[–—-]\s*/);
  if (!from || !to) return null;
  const start = toMinutes(from);
  const end = toMinutes(to);
  /* "18:00–01:00" runs past midnight. */
  return { from, to, start, end: end <= start ? end + DAY : end };
}

const pretty = (text: string | null) => (text ? text.replace(/\s*[–—-]\s*/, "–") : text);

/* Today and the open state, in the business's zone. Server and hydration
   render `null` (the prerender is built on another day than it is read).
   Afterwards it re-reads the clock just after each minute turns, only while
   the chapter is on screen and the tab visible (pause model); coming back it
   re-reads at once. The snapshot is one number (minute of the week), so
   reads within a minute are equal. */
function useBusinessNow(timeZone: string, active: boolean): Now | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!active) return () => undefined;
      let timer = 0;
      const arm = () => {
        timer = window.setTimeout(
          () => {
            onChange();
            arm();
          },
          MINUTE_MS - (Date.now() % MINUTE_MS) + 250,
        );
      };
      arm();
      return () => window.clearTimeout(timer);
    },
    [active],
  );
  const at = useSyncExternalStore(
    subscribe,
    () => {
      const now = businessNow(timeZone, new Date());
      return now ? now.day * DAY + now.minutes : null;
    },
    () => null,
  );
  return at === null ? null : { day: Math.floor(at / DAY), minutes: at % DAY };
}

type Status = { open: boolean; text: string };

/** Open until …, opens at … (today or the next open day), or closed for now. */
function businessStatus(now: Now, hours: ChapterContactHours): Status {
  const { labels } = hours;
  const slotsOf = (day: number) => (hours.week[day] ?? []).map(parseSlot).filter((s): s is Slot => s !== null).sort((a, b) => a.start - b.start);
  const current =
    slotsOf(now.day).find((s) => now.minutes >= s.start && now.minutes < s.end) ??
    slotsOf((now.day + 6) % 7).find((s) => now.minutes + DAY >= s.start && now.minutes + DAY < s.end);
  if (current) return { open: true, text: labels.openUntil(current.to) };
  const later = slotsOf(now.day).find((s) => s.start > now.minutes);
  if (later) return { open: false, text: labels.opensAt(null, later.from) };
  for (let i = 1; i <= 7; i++) {
    const day = (now.day + i) % 7;
    const first = slotsOf(day)[0];
    if (first) return { open: false, text: labels.opensAt(labels.days[day], first.from) };
  }
  return { open: false, text: labels.closedForNow };
}

/* ── Pieces ─────────────────────────────────────────────────────────── */

function ChannelTile({ channel, newTab }: { channel: ChapterContactChannel; newTab: string }) {
  const value = channel.href ? (
    <a
      className="ev-chapter-contact__value ev-chapter-contact__link"
      href={channel.href}
      {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <TextFill hoverWithin=".ev-chapter-contact__link">{channel.value}</TextFill>
      {channel.external && (
        <>
          <span className="ev-chapter-contact__out" aria-hidden="true">
            <TextFill hoverWithin=".ev-chapter-contact__link">
              <ArrowUpRight />
            </TextFill>
          </span>
          <span className="ev-sr"> ({newTab})</span>
        </>
      )}
    </a>
  ) : (
    <span className="ev-chapter-contact__value">{channel.value}</span>
  );
  return (
    <li className="ev-chapter-contact__tile">
      <span className="ev-t-label ev-chapter-contact__label">{channel.label}</span>
      {value}
    </li>
  );
}

function ChannelList({ items, newTab, className }: { items: ChapterContactChannel[]; newTab: string; className: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("ev-chapter-contact__tiles", className)} style={{ "--n": items.length } as CSSProperties}>
      {items.map((c) => (
        <ChannelTile key={`${c.label}-${c.value}`} channel={c} newTab={newTab} />
      ))}
    </ul>
  );
}

function StatusLine({ status }: { status: Status | null }) {
  return (
    <p className="ev-chapter-contact__status" data-open={status?.open ? "" : undefined}>
      <span className="ev-chapter-contact__dot" aria-hidden="true" />
      {/* Reserved line until the business time is known (no layout jump). */}
      <span>{status?.text ?? " "}</span>
    </p>
  );
}

function TodayCard({ hours, now }: { hours: ChapterContactHours; now: Now | null }) {
  const { labels, services } = hours;
  const day = now ? hours.week[now.day] ?? [] : null;
  const closed = day !== null && day.every((s) => !s);
  return (
    <div className="ev-chapter-contact__today">
      <p className="ev-chapter-contact__today-head">
        <span className="ev-t-label">{labels.today}</span>
        <span className="ev-chapter-contact__today-day">{now ? labels.days[now.day] : " "}</span>
      </p>
      {closed ? (
        <p className="ev-chapter-contact__today-closed">{labels.closed}</p>
      ) : (
        <dl className="ev-chapter-contact__services" aria-hidden={day === null || undefined}>
          {services.map((name, i) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{day === null ? "—" : (pretty(day[i] ?? null) ?? labels.closed)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/* The week as joined-in-spirit tonal rows (a real table: day × service). */
function WeekTable({ hours, today }: { hours: ChapterContactHours; today: number | null }) {
  const { labels, services } = hours;
  return (
    <table className="ev-chapter-contact__table">
      <thead>
        <tr>
          <th scope="col">{labels.day}</th>
          {services.map((s) => (
            <th key={s} scope="col">
              {s}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {labels.days.map((name, d) => (
          <tr key={name} data-today={d === today ? "" : undefined} aria-current={d === today ? "date" : undefined}>
            <th scope="row">
              {d === today && <span className="ev-chapter-contact__mark" aria-hidden="true" />}
              {name}
              {d === today && <span className="ev-sr"> — {labels.today}</span>}
            </th>
            {services.map((s, i) => (
              <td key={s} data-closed={hours.week[d]?.[i] ? undefined : ""}>
                {pretty(hours.week[d]?.[i] ?? null) ?? labels.closed}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* The week as seven day tiles across (band). */
function WeekStrip({ hours, today }: { hours: ChapterContactHours; today: number | null }) {
  const { labels, services } = hours;
  return (
    <ol className="ev-chapter-contact__strip">
      {labels.days.map((name, d) => {
        const slots = hours.week[d] ?? [];
        const closed = slots.every((s) => !s);
        return (
          <li key={name} data-today={d === today ? "" : undefined} aria-current={d === today ? "date" : undefined}>
            <span className="ev-t-label ev-chapter-contact__strip-day">
              {d === today && <span className="ev-chapter-contact__mark" aria-hidden="true" />}
              {name}
              {d === today && <span className="ev-sr"> — {labels.today}</span>}
            </span>
            {closed ? (
              <span className="ev-chapter-contact__strip-slot" data-closed="">
                {labels.closed}
              </span>
            ) : (
              services.map((s, i) =>
                slots[i] ? (
                  <span key={s} className="ev-chapter-contact__strip-slot">
                    <span className="ev-sr">{s} </span>
                    {pretty(slots[i])}
                  </span>
                ) : null,
              )
            )}
          </li>
        );
      })}
    </ol>
  );
}

function WeekFold({ hours, today, strip }: { hours: ChapterContactHours; today: number | null; strip: boolean }) {
  return (
    <details className="ev-chapter-contact__fold">
      <summary>
        <span>{hours.labels.weekToggle}</span>
        <Chevron dir="down" className="ev-chapter-contact__chevron" />
      </summary>
      <div className="ev-chapter-contact__fold-body">{strip ? <WeekStrip hours={hours} today={today} /> : <WeekTable hours={hours} today={today} />}</div>
    </details>
  );
}

function HoursBlock({
  hours,
  view,
  now,
  strip,
  headingId,
  level,
}: {
  hours: ChapterContactHours;
  view: ChapterContactHoursView;
  now: Now | null;
  strip: boolean;
  headingId: string;
  level: 2 | 3;
}) {
  const status = now ? businessStatus(now, hours) : null;
  const today = now?.day ?? null;
  const H = level === 2 ? "h3" : "h4";
  return (
    <section className="ev-chapter-contact__hours" aria-labelledby={headingId} data-view={view}>
      <div className="ev-chapter-contact__hours-head">
        <H id={headingId} className="ev-t-label ev-chapter-contact__hours-title">
          {hours.title}
        </H>
        <StatusLine status={status} />
      </div>
      <div className="ev-chapter-contact__hours-body">
        {view === "today" ? (
          <>
            <TodayCard hours={hours} now={now} />
            <WeekFold hours={hours} today={today} strip={strip} />
          </>
        ) : strip ? (
          <WeekStrip hours={hours} today={today} />
        ) : (
          <WeekTable hours={hours} today={today} />
        )}
      </div>
      {hours.note && <p className="ev-t-compact ev-chapter-contact__note">{hours.note}</p>}
    </section>
  );
}

/* Rendered width per layout (wide rail 85em): columns = the hours column
   (≈ .56 of the rail from 768, hidden on phones), split = .63 of the rail
   from 1024, the full rail below. */
const PICTURE_SIZES: Record<Exclude<ChapterContactLayout, "band">, string> = {
  columns: "50vw",
  split: "(min-width: 1024px) 50vw, 100vw",
};

function Picture({ picture, layout }: { picture: NonNullable<ChapterContactConfig["picture"]>; layout: Exclude<ChapterContactLayout, "band"> }) {
  return (
    <figure className="ev-chapter-contact__picture">
      <img
        src={picture.src}
        srcSet={picture.srcSet}
        sizes={picture.srcSet ? (picture.sizes ?? PICTURE_SIZES[layout]) : undefined}
        alt={picture.alt}
        width={picture.width}
        height={picture.height}
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

/* ── The chapter ────────────────────────────────────────────────────── */

/** The contact chapter: one booking action, where, how to reach, and the hours with today computed live. */
export function ChapterContact({ config, layout = "columns", hours = "today", id, tone = "dark", rhythm = "standard", level = 2, className }: ChapterContactProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { active } = useInViewPause(ref);
  const now = useBusinessNow(config.hours.timeZone, active);
  const hoursId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-hours`;

  const action = config.action ? (
    <PrimaryPlate
      href={config.action.href}
      className="ev-chapter-contact__action"
      {...(config.action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {config.action.label}
      {config.action.external && <span className="ev-sr"> ({config.newTab})</span>}
    </PrimaryPlate>
  ) : undefined;

  const heading = (
    <ChapterHeading
      level={level}
      marker={false}
      layout={layout === "columns" ? "centered" : "split"}
      title={config.title}
      subtitle={config.lead}
      side={action}
    />
  );
  const place = <ChannelList items={config.place} newTab={config.newTab} className="ev-chapter-contact__place" />;
  const reach = <ChannelList items={config.channels} newTab={config.newTab} className="ev-chapter-contact__reach" />;
  const hoursBlock = <HoursBlock hours={config.hours} view={hours} now={now} strip={layout === "band"} headingId={hoursId} level={level} />;
  const picture = config.picture && layout !== "band" ? <Picture picture={config.picture} layout={layout} /> : null;

  return (
    <Chapter id={id} tone={tone} rhythm={rhythm} rail="wide" className={cn("ev-chapter-contact", className)}>
      <div ref={ref} className="ev-chapter-contact__body" data-layout={layout} data-hours={hours} data-picture={picture ? "" : undefined}>
        {layout === "columns" && (
          <>
            {heading}
            <div className="ev-chapter-contact__cols">
              <div className="ev-chapter-contact__col ev-chapter-contact__col--reach">
                {place}
                {reach}
              </div>
              <div className="ev-chapter-contact__col ev-chapter-contact__col--hours">
                {hoursBlock}
                {hours === "today" && picture}
              </div>
            </div>
          </>
        )}
        {layout === "split" && (
          <div className="ev-chapter-contact__cols">
            <div className="ev-chapter-contact__col ev-chapter-contact__col--side">
              {heading}
              {hoursBlock}
            </div>
            <div className="ev-chapter-contact__col ev-chapter-contact__col--main">
              {picture}
              {place}
              {reach}
            </div>
          </div>
        )}
        {layout === "band" && (
          <>
            {heading}
            <div className="ev-chapter-contact__band">
              {place}
              {reach}
              {hoursBlock}
            </div>
          </>
        )}
      </div>
    </Chapter>
  );
}
