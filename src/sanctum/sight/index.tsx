/* The sight: the eye, its panel, the focus window, and the shell the console
   stands in. Owner: Render. Contract: default export, SightProps. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { litBy, useSanctum, type SightProps } from "../data";
import type { Id, Op, SanctumState } from "../model/types";
import { usePressJelly } from "../motion";
import "../sanctum.css";
import "./sight.css";
import { kindInfos } from "./derive";
import { SightEngine, type Frame, type View } from "./engine";
import { Focus, visionOf } from "./Focus";
import { Panel, type LocalSight } from "./Panel";

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

const fromSight = (state: SanctumState): LocalSight => ({
  layers: new Set(state.sight.layers),
  kinds: new Set(state.sight.kinds),
  reading: state.sight.reading,
  explanations: state.sight.explanations,
  flow: state.sight.flow,
  rehearsal: state.sight.rehearsal,
  /* the sight's viewed condition is a default foresight; the sealed one is the map's */
  foresee: state.sight.condition !== state.condition,
});

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function Sight({ store, console }: SightProps) {
  const state = useSanctum(store, (s) => s.state);
  const draft = useSanctum(store, (s) => s.draft);
  const vp = useViewport();
  usePressJelly();

  const [local, setLocal] = useState<LocalSight | null>(() => (state ? fromSight(state) : null));
  const [panel, setPanel] = useState(false);
  const [pane, setPane] = useState<"readings" | "layers">("layers");
  const [focus, setFocus] = useState<Id | null>(null);
  const [readingOpen, setReadingOpen] = useState(false);
  const shaping = draft.open;
  const previewState = draft.previewState;

  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const marks = useRef<HTMLDivElement>(null);
  const engine = useRef<SightEngine | null>(null);
  const sealedCondition = useRef<Id | null>(null);

  useEffect(() => { if (state && !local) setLocal(fromSight(state)); }, [state, local]);

  const infos = useMemo(() => (state ? kindInfos(state) : []), [state]);
  const wide = vp.w >= 1024;
  const shown = previewState ?? state;
  const sealed = state?.condition ?? "";
  const other = state?.conditions.find((c) => c.id !== sealed)?.id ?? sealed;
  const turning = Boolean(previewState && draft.diff?.condition);
  const condition = turning ? previewState!.condition : local?.foresee ? other : sealed;
  const foreseen = Boolean(local?.foresee) || turning;
  const focusVision = Boolean(state && focus && visionOf(state, focus, condition));

  const view: View | null = useMemo(() => {
    if (!state || !local) return null;
    const reading = local.reading ? state.readings.find((r) => r.id === local.reading) : undefined;
    return { litLayers: local.layers, litKinds: local.kinds, reading: reading ? litBy(shown ?? state, reading) : null, condition, sealed, explanations: local.explanations, flow: local.flow, rehearsal: local.rehearsal, focus };
  }, [state, shown, local, condition, sealed, focus]);

  const frame: Frame = useMemo(() => {
    const W = vp.w, H = vp.h;
    if (focus) {
      if (!wide) return { x: 0, y: 0, w: W, h: Math.round(H * 0.4), mode: "index" };
      const sheetW = clamp(W * 0.27, 340, 430);
      const lanW = focusVision ? clamp(W * 0.25, 260, 400) : 0;
      return { x: 0, y: 0, w: W - sheetW - lanW - (lanW ? 64 : 40), h: H, mode: "focus" };
    }
    const side = panel ? (W >= 1280 ? 600 : 440) : shaping ? 440 : 0;
    if (wide) return { x: 0, y: 0, w: W - (side ? side + 48 : 0), h: side ? H : H - 84, mode: "full" };
    if (panel || shaping) return { x: 0, y: 0, w: W, h: Math.round(H * 0.38), mode: "index" };
    return { x: 0, y: 0, w: W, h: H - 88, mode: "full" };
  }, [vp, focus, wide, focusVision, panel, shaping]);

  /* a tap answers the console when it is asking, else opens the element */
  const awaitingRef = useRef(draft.awaiting);
  awaitingRef.current = draft.awaiting;
  const onPick = useCallback((id: Id, how: "tap" | "hover-in" | "hover-out") => {
    if (how !== "tap") return;
    if (awaitingRef.current) store.pick(id);
    else setFocus(id);
  }, [store]);

  /* the engine lives once per mount */
  useLayoutEffect(() => {
    if (!canvas.current || !marks.current || !host.current || !view || engine.current) return;
    engine.current = new SightEngine(canvas.current, marks.current, host.current, view, {
      onPick,
      onRingPick: (ref) => store.pick(ref),
      onSocketPick: (socket) => store.pick({ socket }),
    });
    return () => { engine.current?.destroy(); engine.current = null; };
  }, [Boolean(view)]);

  const refusals = draft.verdict.refusals;
  const diff = draft.diff;
  useEffect(() => {
    const e = engine.current;
    if (!e || !state) return;
    const turned = sealedCondition.current !== null && sealedCondition.current !== state.condition ? { from: sealedCondition.current, to: state.condition } : null;
    sealedCondition.current = state.condition;
    /* what a refusal touches: its subject, else what its op names */
    const named = (op: Op | undefined): string[] => {
      if (!op) return [];
      if (op.op === "removeThread" || op.op === "removeElement") return [op.id];
      if (op.op === "addThread") return [op.thread.from, op.thread.to].filter((x) => !x.startsWith("layer:"));
      if (op.op === "addElement") return [op.element.id];
      if (op.op === "setEmphasis") return [op.id];
      return [];
    };
    const refused = refusals.flatMap((r) => (r.subject?.id ? [r.subject.id] : named(r.op !== undefined ? draft.ops[r.op] : undefined)));
    e.setState(state, {
      preview: previewState && diff ? { state: previewState, added: [...diff.elements.added, ...diff.threads.added], removed: [...diff.elements.removed, ...diff.threads.removed], changed: [...diff.elements.changed, ...diff.threads.changed], restoring: draft.restoring !== null } : null,
      refused,
      turned,
    });
  }, [state, previewState, diff, refusals, draft.restoring, draft.ops]);

  useEffect(() => {
    engine.current?.setAffordances((draft.awaiting?.choices ?? []).map((c) => ("socket" in c ? { socket: c.socket, ok: c.ok } : { end: c.value, ok: c.ok })));
  }, [draft.awaiting]);
  useEffect(() => { engine.current?.setHover(draft.hover); }, [draft.hover]);

  useEffect(() => { if (view) engine.current?.setView(view); }, [view]);
  useEffect(() => { engine.current?.setFrame(frame); }, [frame]);
  useEffect(() => { engine.current?.setActive(!(focus && !wide)); }, [focus, wide]);

  /* Esc closes the topmost thing */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      if (shaping) store.closeDraft();
      else if (focus) setFocus(null);
      else if (panel) setPanel(false);
      else if (local?.reading) setLocal({ ...local, reading: null });
      else if (local?.foresee) setLocal({ ...local, foresee: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shaping, focus, panel, local, store]);

  if (!state || !local) return null;
  const reading = local.reading ? state.readings.find((r) => r.id === local.reading) : undefined;
  const patch = (p: Partial<LocalSight>) => setLocal({ ...local, ...p });
  const openShape = () => { setPanel(false); store.openDraft(null); };

  return (
    <div className="sx-sight" data-wide={wide || undefined}>
      <div ref={host} className="sx-sight__eye">
        <canvas ref={canvas} className="sx-sight__canvas" aria-hidden="true" />
        <div ref={marks} className="sx-marks" data-mode={frame.mode} />
      </div>

      {foreseen && <p className="sx-chip-note sx-glass" role="status" style={{ left: frame.x + frame.w / 2 }}>Foreseen, not sealed.</p>}

      {reading && !focus && !panel && (
        <section className="sx-reading sx-glass" aria-live="polite">
          <h2 className="sx-title" style={{ fontSize: wide ? 30 : 22 }}>{reading.title}</h2>
          <button type="button" className="sx-small sx-reading__text" data-open={readingOpen || undefined} aria-expanded={readingOpen} onClick={() => setReadingOpen(!readingOpen)}>{reading.text}</button>
          <button type="button" className="sx-orb-button sx-orb-button--tile" data-jelly="" aria-label="Close" onClick={() => patch({ reading: null })}>
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </section>
      )}

      {!panel && !shaping && !focus && (
        <button type="button" className="sx-pill" data-jelly="" onClick={() => setPanel(true)} aria-expanded={panel}>
          <span className="sx-pill__glyph" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="9.5" fill="none" stroke="rgba(243,239,230,.35)" strokeWidth="1" /><circle cx="11" cy="11" r="6.2" fill="none" stroke="rgba(243,239,230,.55)" strokeWidth="1" /><circle cx="11" cy="11" r="2.6" fill="var(--sx-ivory)" /></svg>
          </span>
          <span className="sx-label">The sight</span>
        </button>
      )}

      {panel && (
        <Panel
          state={state}
          sight={local}
          infos={infos}
          pane={pane}
          compact={vp.w < 1280}
          onPane={setPane}
          onChange={patch}
          onShape={openShape}
          onLeave={() => void store.leave()}
          onClose={() => setPanel(false)}
        />
      )}

      {focus && (
        <Focus
          state={state}
          id={focus}
          condition={condition}
          foresee={local.foresee}
          infos={infos}
          layout={wide ? "side" : "stack"}
          onClose={() => setFocus(null)}
          onShape={() => { setFocus(null); store.openDraft({ type: "element", id: focus }); }}
          onForesee={() => patch({ foresee: !local.foresee })}
          onPick={(id) => setFocus(id)}
        />
      )}

      <aside className="sx-shell sx-glass" aria-labelledby="sanctum-console-title" data-open={shaping || undefined} aria-hidden={!shaping}>
        <div className="sx-shell__scroll">{console}</div>
      </aside>
      {shaping && (
        <button type="button" className="sx-orb-button sx-shell__close" data-jelly="" aria-label="Close" onClick={() => store.closeDraft()}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </button>
      )}
    </div>
  );
}
