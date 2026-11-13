/* The sight panel: readings, layers, the lexicon of cords (legend and veil at
   once), the sight's switches, and the way into shaping. Every word that
   names the map is read from the state. */

import { useEffect, useId, useRef } from "react";
import { BEYOND, type Id, type SanctumState } from "../model/types";
import { OrbFill, SurfaceFill, TextFill } from "../motion";
import { realmColour, type KindInfo } from "./derive";
import { Glyph } from "./Glyph";

export interface LocalSight {
  layers: Set<Id>;
  kinds: Set<Id>;
  reading: Id | null;
  explanations: boolean;
  flow: boolean;
  rehearsal: boolean;
  foresee: boolean;
}

interface Props {
  state: SanctumState;
  sight: LocalSight;
  infos: KindInfo[];
  pane: "readings" | "layers";
  compact: boolean;
  onPane(p: "readings" | "layers"): void;
  onChange(patch: Partial<LocalSight>): void;
  onShape(): void;
  onLeave(): void;
  onClose(): void;
}

const INK = "var(--sx-light)";
const DIM = "rgba(243,239,230,0.38)";

export function Switch({ on, colour = "var(--sx-light)" }: { on: boolean; colour?: string }) {
  return (
    <span className="sx-switch" aria-hidden="true" data-on={on || undefined}>
      <SurfaceFill on={on} lit={colour}><span /></SurfaceFill>
      <span className="sx-switch__knob" />
    </span>
  );
}

export function SwitchRow({ on, label, colour, onToggle }: { on: boolean; label: string; colour?: string; onToggle(): void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="sx-tile" data-jelly=".sx-switch" onClick={onToggle}>
      <span className="sx-label" style={{ flex: 1 }}>{label}</span>
      <Switch on={on} colour={colour} />
    </button>
  );
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: { id: T; title: string }[]; value: T; onChange(v: T): void; label: string }) {
  return (
    <div className="sx-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className="sx-opt" data-jelly="" onClick={() => onChange(o.id)}>
          {o.title}
          <SurfaceFill on={o.id === value} lit="var(--sx-light)" litInk="var(--sx-ink)">{o.title}</SurfaceFill>
        </button>
      ))}
    </div>
  );
}

export function Panel({ state, sight, infos, pane, compact, onPane, onChange, onShape, onLeave, onClose }: Props) {
  const titleId = useId();
  const root = useRef<HTMLElement>(null);
  useEffect(() => { root.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus({ preventScroll: true }); }, []);
  const realms = [...state.layers].sort((a, b) => a.order - b.order);
  const rows = [{ id: BEYOND as Id, title: state.beyond.title, purpose: state.beyond.purpose }, ...realms.map((l) => ({ id: l.id, title: l.title, purpose: l.purpose }))];
  const toggle = (set: Set<Id>, id: Id) => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); return n; };
  const union = infos.find((i) => i.role === "union");
  const other = state.conditions.find((c) => c.id !== state.sight.condition);
  const readings = [...state.readings].sort((a, b) => a.order - b.order);

  const switches = (
    <div className="sx-tiles">
      <SwitchRow on={sight.flow} label="Flow" onToggle={() => onChange({ flow: !sight.flow })} />
      <SwitchRow on={sight.explanations} label="Explanations" onToggle={() => onChange({ explanations: !sight.explanations })} />
      {union && <SwitchRow on={sight.rehearsal} label={union.kind.title} colour={union.colour} onToggle={() => onChange({ rehearsal: !sight.rehearsal })} />}
      {other && <SwitchRow on={sight.foresee} label={`Foresee ${other.title.toLowerCase()}`} onToggle={() => onChange({ foresee: !sight.foresee })} />}
    </div>
  );

  const layerList = (
    <div className="sx-tiles" role="group" aria-label="Layers">
      {rows.map((r) => {
        const on = sight.layers.has(r.id);
        const c = realmColour(state, r.id);
        return (
          <button key={r.id} type="button" className="sx-tile" aria-pressed={on} onClick={() => onChange({ layers: toggle(sight.layers, r.id) })}>
            <OrbFill on={on} lit={c} ring={c} />
            <span className="sx-txt">
              <TextFill ink={on ? INK : DIM} className="sx-label">{r.title}</TextFill>
              {!compact && <span className="sx-small">{r.purpose}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );

  const readingList = (
    <div className="sx-tiles" role="radiogroup" aria-label="Readings">
      {readings.map((r) => {
        const on = sight.reading === r.id;
        return (
          <button key={r.id} type="button" role="radio" aria-checked={on} className="sx-tile" data-on={on || undefined} onClick={() => onChange({ reading: on ? null : r.id })} style={{ alignItems: on ? "flex-start" : "center" }}>
            <OrbFill on={on} lit="var(--sx-light)" ring="rgba(243,239,230,.45)" />
            <span className="sx-txt">
              <TextFill ink={on ? INK : "var(--sx-fg-65)"} className="sx-label">{r.title}</TextFill>
              {on && <span className="sx-small">{r.text}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );

  const lexicon = (
    <div className="sx-tiles sx-lexicon" role="group" aria-label={state.lexicon.title}>
      {infos.map(({ kind, role, colour }) => {
        const on = sight.kinds.has(kind.id);
        return (
          <button key={kind.id} type="button" className="sx-tile" aria-pressed={on} onClick={() => onChange({ kinds: toggle(sight.kinds, kind.id) })} style={{ gap: 14 }}>
            <Glyph role={role} colour={colour} dim={!on} />
            <span className="sx-txt">
              <TextFill ink={on ? INK : DIM} className="sx-label">{kind.title}</TextFill>
              <span className="sx-small">{kind.course}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <section ref={root} className="sx-panel sx-glass" aria-labelledby={titleId} data-compact={compact || undefined}>
      <header className="sx-panel__head">
        <h2 id={titleId} className="sx-title" style={{ fontSize: compact ? 24 : 32 }}>{state.threshold.title}</h2>
        <button type="button" className="sx-orb-button sx-orb-button--tile" data-jelly="" aria-label="Close" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      </header>
      <div className="sx-panel__body">
        <div className="sx-panel__col">
          <Seg label="Show" value={pane} onChange={onPane} options={[{ id: "readings", title: "Readings" }, { id: "layers", title: "Layers" }]} />
          {pane === "readings" ? readingList : layerList}
          {switches}
        </div>
        <div className="sx-panel__col">
          <h3 className="sx-head sx-panel__sub">{state.lexicon.title}</h3>
          {lexicon}
          <div className="sx-panel__acts">
            <button type="button" className="sx-ghost" data-jelly="" onClick={onLeave}>Leave</button>
            <button type="button" className="sx-plate" data-jelly="" onClick={onShape}>
              Shape the map
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
