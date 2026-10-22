import { useId, type InputHTMLAttributes, type KeyboardEvent, type ReactNode, type Ref, type TextareaHTMLAttributes } from "react";
import { Check, cn } from "../foundation";
import { useControlsCopy } from "./copy";

type FieldOwn = {
  label: ReactNode;
  /** Shows "(facultatif)" after the label. */
  optional?: boolean;
  /** Error message: red underline, aria-invalid, announced via aria-describedby. */
  error?: string;
  hint?: ReactNode;
  /** Spans both columns of a <FieldGrid>. */
  wide?: boolean;
  className?: string;
};

export type UnderlineFieldProps = FieldOwn &
  (
    | ({ multiline?: false; ref?: Ref<HTMLInputElement> } & Omit<InputHTMLAttributes<HTMLInputElement>, "className">)
    | ({ multiline: true; ref?: Ref<HTMLTextAreaElement> } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">)
  );

/** Underline input: readout label above, 16px value (no iOS zoom), accent underline on focus. */
export function UnderlineField(props: UnderlineFieldProps) {
  const { label, optional, error, hint, wide, className, id: idProp, multiline, ...rest } = props;
  const copy = useControlsCopy();
  const autoId = useId();
  const id = idProp ?? `evc-field-${autoId}`;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  const aria = { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, className: "evc-field__input" };

  return (
    <div className={cn("ev-controls evc-field", wide && "evc-field--wide", className)}>
      <label htmlFor={id} className="ev-t-readout evc-field__label">
        {label}
        {optional ? (
          <small> ({copy.optional})</small>
        ) : rest.required ? (
          <>
            <span aria-hidden="true"> *</span>
            <span className="ev-sr"> ({copy.required})</span>
          </>
        ) : null}
      </label>
      {multiline ? (
        <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...aria} />
      ) : (
        <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...aria} />
      )}
      {hint && !error && <p id={`${id}-hint`} className="evc-field__hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="evc-field__error">{error}</p>}
    </div>
  );
}

/** Field layout: one column, two from a 560px-wide container (wide fields span). */
export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("ev-controls evc-fields", className)}>
      <div className="evc-fields__grid">{children}</div>
    </div>
  );
}

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/** Switch row (consent, preferences): the whole row toggles; on = accent track, thumb right with a check. */
export function Switch({ checked, onCheckedChange, label, description, disabled, id, className }: SwitchProps) {
  const autoId = useId();
  const base = id ?? `evc-switch-${autoId}`;
  return (
    <button
      type="button"
      role="switch"
      id={base}
      aria-checked={checked}
      aria-labelledby={`${base}-label`}
      aria-describedby={description ? `${base}-desc` : undefined}
      disabled={disabled}
      className={cn("ev-controls evc-switch", className)}
      onClick={() => onCheckedChange(!checked)}
    >
      <span className="evc-switch__text">
        <span id={`${base}-label`} className="evc-switch__label">{label}</span>
        {description && <span id={`${base}-desc`} className="evc-switch__desc">{description}</span>}
      </span>
      <span className="evc-switch__track" aria-hidden="true">
        <span className="evc-switch__thumb"><Check /></span>
      </span>
    </button>
  );
}

export type SegmentOption = { value: string; label: ReactNode };

export type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the radiogroup. */
  label: string;
  /** Full width of its column. */
  block?: boolean;
  className?: string;
};

/** Segmented switch between states of one frame (Avant / Après): sliding accent thumb, arrow keys. */
export function SegmentedControl({ options, value, onChange, label, block = false, className }: SegmentedControlProps) {
  const active = Math.max(0, options.findIndex((o) => o.value === value));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = options.length;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (active + 1) % n
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (active - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("ev-controls evc-seg", block && "evc-seg--block", className)}
      style={{ ["--evc-seg-n" as string]: options.length, ["--evc-seg-i" as string]: active }}
      onKeyDown={onKeyDown}
    >
      <span className="evc-seg__thumb" aria-hidden="true" />
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={i === active}
          tabIndex={i === active ? 0 : -1}
          className="ev-t-label evc-seg__option"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
