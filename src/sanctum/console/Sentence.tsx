/* The lectern's sentence: words with slots. A choice slot opens a chooser of
   what the grammar allows (refused choices stay visible with the reason);
   element slots may also be answered by a touch on the eye. */

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { AwaitChoice, Choice, SanctumStore } from "../data";
import { SurfaceFill } from "../motion";
import { patchDraft } from "./draft";
import type { ThreadEnd } from "../model/types";
import { keeperName, realmName, titleOf } from "./voice";

export interface ChoicePart {
  slot: "choice";
  key: string;
  /** Shown in the empty slot, e.g. "a kind of cord". */
  placeholder: string;
  value?: string;
  choices: Choice[];
  onChoose: (value: string) => void;
  /** The choices name ends of the map: the eye may answer, and hovering pulses them. */
  onEye?: boolean;
  /** The choices are places: where an element would stand for each (drawn as sockets on the eye). */
  placeOf?: (value: string) => Place | null;
  /** A tapped element answers a place slot through this (e.g. the quarter it stands in). */
  fromEnd?: (end: string) => string | null;
}

/** A would-be place (CONTRACT): the end of the realm, or the end of `quarter` when given. */
export interface Place {
  realm: string;
  order: number;
  quarter?: string;
}

const samePlace = (a: Place, b: Place) => a.realm === b.realm && a.order === b.order && (a.quarter ?? "") === (b.quarter ?? "");

export interface TextPart {
  slot: "text";
  key: string;
  placeholder: string;
  value: string;
  budget: number;
  onChange: (value: string) => void;
  label: string;
}

export interface NamePart {
  slot: "name";
  /** A name the sentence derives (not chosen): hovering pulses it on the eye. */
  title: string;
  end?: ThreadEnd;
}

export type Part = string | ChoicePart | TextPart | NamePart | null | false | undefined;

interface Props {
  store: SanctumStore;
  parts: Part[];
  /** Opened by a fix chip or by the sight's subject. */
  openKey?: string | null;
  onOpened?: () => void;
}

export function Sentence({ store, parts, openKey, onOpened }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const pills = useRef(new Map<string, HTMLButtonElement>());
  const live = parts.filter(Boolean) as Exclude<Part, null | false | undefined>[];
  const current = live.find((p): p is ChoicePart => typeof p === "object" && p.slot === "choice" && p.key === open);

  useEffect(() => {
    if (openKey) {
      setOpen(openKey);
      onOpened?.();
    }
  }, [openKey]);

  /* The eye may answer the slot the sentence waits on: the open chooser, else
     the first empty choice, whether or not its chooser is open. Published once
     per change of what is offered (the choices array is rebuilt every render). */
  const waitedOn = current ?? live.find((p): p is ChoicePart => typeof p === "object" && p.slot === "choice" && !p.choices.some((c) => c.value === p.value));
  const asked = waitedOn && (waitedOn.onEye || waitedOn.placeOf) ? waitedOn : undefined;
  const latest = useRef(asked);
  latest.current = asked;
  const offered = asked ? `${asked.key}|${asked.choices.map((c) => `${c.value}:${c.ok ? 1 : 0}:${JSON.stringify(asked.placeOf?.(c.value) ?? "")}`).join(",")}` : "";
  const [said, setSaid] = useState("");
  useEffect(() => setSaid(""), [offered]);
  useEffect(() => {
    const c = latest.current;
    if (!offered || !c) return;
    const choices: AwaitChoice[] = c.choices.flatMap((x): AwaitChoice[] => {
      const why = x.why ? { why: x.why } : {};
      if (!c.placeOf) return [{ value: x.value as ThreadEnd, ok: x.ok, ...why }];
      const place = c.placeOf(x.value);
      return place ? [{ socket: place, ok: x.ok, ...why }] : [];
    });
    patchDraft(store, { awaiting: { slot: c.key, choices } });
    const key = c.key;
    return () => {
      if (store.get().draft.awaiting?.slot === key) patchDraft(store, { awaiting: null });
    };
  }, [offered]);

  useEffect(() => {
    if (!offered) return;
    let seen = store.get().draft.picked?.at ?? 0;
    return store.subscribe(() => {
      const picked = store.get().draft.picked;
      const c = latest.current;
      if (!c || !picked || picked.at === seen || picked.slot !== c.key) return;
      seen = picked.at;
      const v = picked.value;
      const asValue = typeof v === "string" ? (c.placeOf && c.fromEnd ? c.fromEnd(v) : v) : null;
      const choice = typeof v === "string" ? c.choices.find((x) => x.value === asValue) : c.choices.find((x) => { const p = c.placeOf?.(x.value); return Boolean(p && samePlace(p, v.socket as Place)); });
      if (choice?.ok) {
        setSaid("");
        c.onChoose(choice.value);
        setOpen(null);
        return;
      }
      const state = store.get().state;
      if (!state) return;
      const keeper = keeperName(state);
      if (choice) setSaid(`${keeper} refuses ${choice.title} here. ${choice.why ?? "It cannot be chosen now."}`);
      else {
        const title = typeof v !== "string" ? "" : v.startsWith("layer:") ? realmName(state, v.slice(6)) : titleOf(state, v);
        setSaid(`${title || keeper} cannot answer ${c.placeholder}.`);
      }
    });
  }, [offered]);

  const close = (key: string | null) => {
    setOpen(null);
    if (key) pills.current.get(key)?.focus();
  };

  return (
    <div className="sanctum-console__sentence-wrap">
      <p className="sanctum-console__sentence">
        {live.map((p, i) => {
          if (typeof p === "string") return <span key={i}>{p}</span>;
          if (p.slot === "name") {
            return (
              <span
                key={i}
                className="sanctum-console__name"
                onPointerEnter={() => p.end && patchDraft(store, { hover: p.end })}
                onPointerLeave={() => p.end && patchDraft(store, { hover: null })}
              >
                {p.title}
              </span>
            );
          }
          if (p.slot === "text") return <InlineText key={p.key} part={p} />;
          const chosen = p.choices.find((c) => c.value === p.value);
          return (
            <button
              key={p.key}
              type="button"
              ref={(el) => {
                if (el) pills.current.set(p.key, el);
              }}
              className={`sanctum-console__slot${chosen ? "" : " is-empty"}${open === p.key ? " is-open" : ""}`}
              aria-haspopup="listbox"
              aria-expanded={open === p.key}
              data-jelly=""
              onClick={() => setOpen(open === p.key ? null : p.key)}
              onPointerEnter={() => p.onEye && p.value && patchDraft(store, { hover: p.value as ThreadEnd })}
              onPointerLeave={() => p.onEye && patchDraft(store, { hover: null })}
              onFocus={() => p.onEye && p.value && patchDraft(store, { hover: p.value as ThreadEnd })}
              onBlur={() => p.onEye && patchDraft(store, { hover: null })}
            >
              {chosen?.title ?? p.placeholder}
            </button>
          );
        })}
      </p>
      <p className="sx-small sanctum-console__said" role="status">{said}</p>
      {current && <Chooser store={store} part={current} onClose={(back) => close(back ? current.key : null)} />}
    </div>
  );
}

function Chooser({ store, part, onClose }: { store: SanctumStore; part: ChoicePart; onClose: (back: boolean) => void }) {
  const list = useRef<HTMLDivElement>(null);
  const [showRefused, setShowRefused] = useState(false);
  const open = part.choices.filter((c) => c.ok);
  const shut = part.choices.filter((c) => !c.ok);
  const headId = useId();

  useEffect(() => {
    const first = list.current?.querySelector<HTMLElement>('[role="option"]');
    /* The console scrolls the whole chooser into view; focus must not fight it. */
    first?.focus({ preventScroll: true });
  }, [part.key]);

  const move = (dir: 1 | -1) => {
    const opts = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const i = opts.indexOf(document.activeElement as HTMLElement);
    opts[(i + dir + opts.length) % opts.length]?.focus();
  };

  return (
    <div
      className="sanctum-console__chooser"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose(true);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      <p className="sx-small" id={headId}>
        {open.length ? `Choose ${part.placeholder}${part.onEye || part.placeOf ? ", here or on the eye" : ""}.` : `Nothing can be chosen as ${part.placeOf ? "a place" : part.placeholder} now.`}
      </p>
      <div ref={list} role="listbox" aria-labelledby={headId} className="sx-tiles">
        {open.map((c) => (
          <button
            key={c.value}
            type="button"
            role="option"
            aria-selected={c.value === part.value}
            className={`sx-tile sanctum-console__choice${c.value === part.value ? " is-chosen" : ""}`}
            onClick={() => {
              part.onChoose(c.value);
              onClose(true);
            }}
            onPointerEnter={() => part.onEye && patchDraft(store, { hover: c.value as ThreadEnd })}
            onPointerLeave={() => part.onEye && patchDraft(store, { hover: null })}
            onFocus={() => part.onEye && patchDraft(store, { hover: c.value as ThreadEnd })}
          >
            <span className="sx-txt">
              <span className="sanctum-console__choice-title">{c.title}</span>
              {c.count !== undefined && <Sockets used={c.count} />}
            </span>
          </button>
        ))}
      </div>
      {shut.length > 0 && (
        <div className="sanctum-console__shut">
          <button type="button" className="sx-chip" aria-expanded={showRefused} onClick={() => setShowRefused(!showRefused)}>
            {showRefused ? "Hide what cannot be chosen" : `Why the ${shut.length === 1 ? "other cannot" : "others cannot"} be chosen`}
          </button>
          {showRefused && (
            <div className="sx-tiles">
              {shut.map((c) => (
                <div key={c.value} className="sx-tile sanctum-console__choice is-shut" aria-disabled="true">
                  <span className="sx-txt">
                    <span className="sanctum-console__choice-title">{c.title}</span>
                    <span className="sx-small">{c.why}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Room as sockets: filled for what stands, faint for what is free. Never a number. */
export function Sockets({ used, capacity, pending = 0, ghost = 0 }: { used: number; capacity?: number; pending?: number; ghost?: number }) {
  const total = capacity ?? used;
  const cells: ("on" | "kept" | "ghost" | "free")[] = [];
  for (let i = 0; i < Math.max(total, used + ghost); i++) cells.push(i < used ? "on" : i < used + pending ? "kept" : i < used + pending + ghost ? "ghost" : "free");
  return (
    <span className="sanctum-console__sockets" aria-hidden="true">
      {cells.map((c, i) => (
        <i key={i} className={`is-${c}`} />
      ))}
    </span>
  );
}

function InlineText({ part }: { part: TextPart }) {
  const over = [...part.value].length > part.budget;
  return (
    /* The whole pill is the field's target, not only the line of the input. */
    <label className={`sanctum-console__inline${over ? " is-over" : ""}`}>
      <input
        aria-label={part.label}
        value={part.value}
        placeholder={part.placeholder}
        size={Math.max(part.placeholder.length, [...part.value].length + 1)}
        onChange={(e) => part.onChange(e.target.value)}
      />
      <Measure value={part.value} budget={part.budget} />
    </label>
  );
}

/** How much of the measure the words fill: a small vessel, never a count. */
export function Measure({ value, budget }: { value: string; budget: number }) {
  const used = [...value].length / budget;
  const over = used > 1;
  return (
    <span
      className={`sanctum-console__measure${over ? " is-over" : ""}`}
      style={{ ["--fill" as string]: `${Math.min(1, used) * 100}%` }}
      role="img"
      aria-label={over ? "Beyond the measure" : used > 0.85 ? "Near the measure" : "Within the measure"}
    />
  );
}

/** A field below the sentence for longer words (purpose, explanation). */
export function Field({ label, value, budget, onChange, rows = 3, hint }: { label: string; value: string; budget: number; onChange: (v: string) => void; rows?: number; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="sx-field sanctum-console__field">
      <label htmlFor={id}>{label}</label>
      <div className="sanctum-console__area">
        <textarea id={id} className="sx-input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
        <Measure value={value} budget={budget} />
      </div>
      {hint && <p className="sx-small">{hint}</p>}
    </div>
  );
}

/** Lines of nature: each on its own tile, any one may be drawn back. */
export function Lines({ label, lines, budget, max, onChange }: { label: string; lines: string[]; budget: number; max: number; onChange: (v: string[]) => void }) {
  return (
    <div className="sx-field sanctum-console__field">
      <span className="sx-field__label">{label}</span>
      <div className="sx-tiles">
        {lines.map((line, i) => (
          <div key={i} className="sx-tile sanctum-console__line">
            <input className="sanctum-console__line-input" aria-label={`${label}, line ${i + 1}`} value={line} onChange={(e) => onChange(lines.map((l, j) => (j === i ? e.target.value : l)))} />
            <Measure value={line} budget={budget} />
            <button type="button" className="sanctum-console__line-out" aria-label="Draw back this line" data-jelly="" onClick={() => onChange(lines.filter((_, j) => j !== i))}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}
      </div>
      {lines.length < max && (
        <button type="button" className="sx-chip sanctum-console__add" data-jelly="" onClick={() => onChange([...lines, ""])}>
          Add a line
        </button>
      )}
    </div>
  );
}

/** Many-of choices as chips (lights of a reading, the sight at rest). */
export function Many({ label, choices, chosen, onChange }: { label: string; choices: Choice[]; chosen: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(chosen);
  return (
    <div className="sx-field sanctum-console__field">
      <span className="sx-field__label">{label}</span>
      <div className="sx-chips" role="group" aria-label={label}>
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`sx-chip sanctum-console__toggle${set.has(c.value) ? " is-on" : ""}`}
            aria-pressed={set.has(c.value)}
            disabled={!c.ok}
            title={c.why}
            data-jelly=""
            onClick={() => onChange(set.has(c.value) ? chosen.filter((v) => v !== c.value) : [...chosen, c.value])}
          >
            <span className="sanctum-console__dot" aria-hidden="true" />
            {c.title}
            <SurfaceFill on={set.has(c.value)} lit="var(--sx-light)" litInk="var(--sx-ink)">
              <span className="sanctum-console__dot" style={{ background: "currentColor" }} />
              {c.title}
            </SurfaceFill>
          </button>
        ))}
      </div>
    </div>
  );
}
