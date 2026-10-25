import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent, ReactNode, Ref } from "react";
import { Check, cn, OrbFill, pad, TextFill } from "../foundation";
import { useControlsCopy } from "./copy";

const indexText = (index: number | string | undefined) => (typeof index === "number" ? pad(index) : index);

/* ── Marks ───────────────────────────────────────────────────────────── */

/** 24px check orb: empty ring → accent fill with a check. Decorative (state lives on the control). */
export function CheckOrb({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span className={cn("ev-controls evc-orb", className)} data-checked={checked || undefined} aria-hidden="true">
      <OrbFill on={checked} lit={<Check />} />
    </span>
  );
}

export type StepState = "idle" | "current" | "done";

/** Circled step numeral: idle ring, current accent ring + halo, done accent fill + check. */
export function StepMark({ index, state = "idle", size = "md", label, className }: { index: number | string; state?: StepState; size?: "sm" | "md"; label?: string; className?: string }) {
  return (
    <span
      className={cn("ev-controls evc-step", size === "sm" && "evc-step--sm", className)}
      data-state={state}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <OrbFill on={state === "done"} lit={<Check />}>
        <TextFill ink={state === "current" ? "var(--controls-signal)" : undefined}>{indexText(index)}</TextFill>
      </OrbFill>
    </span>
  );
}

/* ── Single controls ─────────────────────────────────────────────────── */

export type OptionChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>;
  selected?: boolean;
  /** Mark content: a number is padded ("01"); omitted → empty ring. Turns into a check when selected. */
  index?: number | string;
  size?: "md" | "lg";
  children: ReactNode;
};

/** Pill token for a choice. Toggle semantics (aria-pressed) unless given role="radio". */
export function OptionChip({ selected = false, index, size = "md", className, children, ...rest }: OptionChipProps) {
  const radio = rest.role === "radio";
  return (
    <button
      type="button"
      className={cn("ev-controls evc-chip", size === "lg" && "evc-chip--lg", className)}
      data-selected={selected || undefined}
      aria-pressed={radio ? undefined : selected}
      aria-checked={radio ? selected : undefined}
      {...rest}
    >
      <span className="evc-chip__mark" aria-hidden="true">
        {index !== undefined && <span className="evc-chip__num evc-chip__sizer">{indexText(index)}</span>}
        <OrbFill on={selected} lit={<Check className="evc-chip__check" />}>
          {index !== undefined && <span className="evc-chip__num">{indexText(index)}</span>}
        </OrbFill>
      </span>
      <span className="evc-chip__label">
        <TextFill ink={selected ? "var(--ev-fg)" : undefined} hoverWithin=".evc-chip" hoverInk="var(--ev-fg)" withFocus={false}>
          {children}
        </TextFill>
      </span>
    </button>
  );
}

export type OptionRowProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  ref?: Ref<HTMLButtonElement>;
  selected?: boolean;
  index?: number | string;
  /** Client mark / icon (keeps its own colours), 28px. */
  icon?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
};

/** Selectable row (the reservation anatomy): index top-left, icon, label, hint readout, check orb. */
export function OptionRow({ selected = false, index, icon, label, hint, className, ...rest }: OptionRowProps) {
  const radio = rest.role === "radio";
  return (
    <button
      type="button"
      className={cn("ev-controls evc-row", icon != null && "evc-row--icon", className)}
      data-selected={selected || undefined}
      aria-pressed={radio ? undefined : selected}
      aria-checked={radio ? selected : undefined}
      {...rest}
    >
      {index !== undefined && (
        <span className="ev-t-readout evc-row__index" aria-hidden="true">
          <TextFill ink={selected ? "var(--controls-signal)" : undefined}>{indexText(index)}</TextFill>
        </span>
      )}
      {icon != null && <span className="evc-row__icon" aria-hidden="true">{icon}</span>}
      <span className="evc-row__label">{label}</span>
      {hint != null && <span className="ev-t-readout evc-row__hint">{hint}</span>}
      <CheckOrb checked={selected} className="evc-row__check" />
    </button>
  );
}

/* ── Groups (single = radiogroup with arrow keys, multi = toggles with optional max) ── */

export type ChoiceOption = {
  value: string;
  label: ReactNode;
  /** Overrides the automatic index of `numbered`. */
  index?: number | string;
  hint?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

type SingleChoice = { multiple?: false; value: string | null; onChange: (value: string) => void; max?: undefined };
type MultiChoice = { multiple: true; value: string[]; onChange: (value: string[]) => void; /** Selection cap; shows the counter. */ max?: number };
type ChoiceGroupBase = {
  options: ChoiceOption[];
  /** Accessible group name (the question). */
  label: string;
  /** Index every option 01, 02… */
  numbered?: boolean;
  className?: string;
};

export type ChipGroupProps = ChoiceGroupBase & (SingleChoice | MultiChoice) & { size?: "md" | "lg" };
export type OptionRowsProps = ChoiceGroupBase & (SingleChoice | MultiChoice);

const NAV_KEYS = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];

/**
 * Roving-tabindex radiogroup keyboard, for the group's `onKeyDown`: arrows
 * (wrapping) / Home / End move focus to the next enabled item matching
 * `itemSelector` and call `select(index, item)`; `index` counts every matching
 * item, disabled ones included, so it maps onto the options array.
 */
export function rovingKeyDown(
  e: KeyboardEvent<HTMLElement>,
  select: (index: number, item: HTMLElement) => void,
  itemSelector = "[data-evc-item]",
): void {
  if (!NAV_KEYS.includes(e.key)) return;
  const all = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(itemSelector));
  const items = all.filter((el) => !(el as HTMLButtonElement).disabled);
  const i = items.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const n = items.length;
  const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n;
  items[next].focus();
  select(all.indexOf(items[next]), items[next]);
}

function useChoiceGroup(props: ChoiceGroupBase & (SingleChoice | MultiChoice)) {
  const { options, label, numbered } = props;
  const isSelected = (v: string) => (props.multiple ? props.value.includes(v) : props.value === v);
  const count = props.multiple ? props.value.length : 0;
  const max = props.multiple ? props.max : undefined;
  const atMax = max !== undefined && count >= max;
  const choose = (v: string) => {
    if (props.multiple) {
      if (isSelected(v)) props.onChange(props.value.filter((x) => x !== v));
      else if (!atMax) props.onChange([...props.value, v]);
    } else props.onChange(v);
  };
  const enabled = options.filter((o) => !o.disabled);
  const tabStop = props.multiple ? null : (enabled.find((o) => o.value === props.value) ?? enabled[0])?.value;

  const group = {
    role: props.multiple ? "group" : "radiogroup",
    "aria-label": label,
    onKeyDown: props.multiple ? undefined : (e: KeyboardEvent<HTMLElement>) =>
          rovingKeyDown(e, (_, item) => {
            if (item.dataset.value !== undefined) choose(item.dataset.value);
          }),
  };
  const item = (o: ChoiceOption, i: number) => {
    const selected = isSelected(o.value);
    const locked = atMax && !selected;
    return {
      key: o.value,
      selected,
      index: o.index ?? (numbered ? i + 1 : undefined),
      disabled: o.disabled,
      "data-evc-item": "",
      "data-value": o.value,
      "data-locked": locked || undefined,
      onClick: () => choose(o.value),
      ...(props.multiple
        ? { "aria-disabled": locked || undefined }
        : { role: "radio" as const, tabIndex: o.value === tabStop ? 0 : -1 }),
    };
  };
  return { group, item, count, max };
}

function Counter({ count, max }: { count: number; max: number }) {
  const copy = useControlsCopy();
  return (
    <div className="ev-controls evc-counter">
      <span className="evc-ticks" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => <i key={i} className={i < count ? "is-on" : undefined} />)}
      </span>
      <span className="ev-t-readout" aria-live="polite">{count >= max ? copy.maxReached(max) : copy.selectedCount(count, max)}</span>
    </div>
  );
}

/** Chip cloud: single (radio) or multi (toggles, optional max with counter ticks). */
export function ChipGroup(props: ChipGroupProps) {
  const { group, item, count, max } = useChoiceGroup(props);
  return (
    <div className={cn("evc-choice", props.className)}>
      <div className="ev-controls evc-chips" {...group}>
        {props.options.map((o, i) => {
          const { key, ...p } = item(o, i);
          return <OptionChip key={key} size={props.size} {...p}>{o.label}</OptionChip>;
        })}
      </div>
      {max !== undefined && <Counter count={count} max={max} />}
    </div>
  );
}

/** Stack of option rows: single (radio) or multi (toggles, optional max with counter ticks). */
export function OptionRows(props: OptionRowsProps) {
  const { group, item, count, max } = useChoiceGroup(props);
  return (
    <div className={cn("evc-choice", props.className)}>
      <div className="ev-controls evc-rows" {...group}>
        {props.options.map((o, i) => {
          const { key, ...p } = item(o, i);
          return <OptionRow key={key} label={o.label} hint={o.hint} icon={o.icon} {...p} />;
        })}
      </div>
      {max !== undefined && <Counter count={count} max={max} />}
    </div>
  );
}

/* ── Metadata ────────────────────────────────────────────────────────── */

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent";
  /** Status dot before the text. */
  dot?: boolean;
};

/** Rectangular metadata tag (radius 8): readout text, optional status dot. */
export function Tag({ tone = "neutral", dot = false, className, children, ...rest }: TagProps) {
  return (
    <span className={cn("ev-controls ev-t-readout evc-tag", tone === "accent" && "evc-tag--accent", className)} {...rest}>
      {dot && <i className="evc-tag__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Small index badge (radius 4), accent by default: `01` on a tab, a count. */
export function Badge({ tone = "accent", className, children, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: "accent" | "neutral" }) {
  return (
    <span className={cn("ev-controls evc-badge", tone === "neutral" && "evc-badge--neutral", className)} {...rest}>
      {children}
    </span>
  );
}
