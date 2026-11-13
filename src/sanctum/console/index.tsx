/* The console: the lectern where every change is a sentence. The keeper
   (read from the state) examines it as it forms; a held seal ties it into
   the record. Content only: the sight owns the shell, the eye draws the
   draft. */

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useSanctum, type ConsoleProps, type DraftSubject } from "../data";
import { SurfaceFill, usePressJelly } from "../motion";
import { patchDraft } from "./draft";
import { Record } from "./Record";
import { SealButton } from "./Seal";
import { Bind, DrawBack, LayCord, Order, Raise, Readings, Rewrite, SightAtRest, Turn, type Composed, type VerbProps } from "./verbs";
import { VisionVerb } from "./Vision";
import { keeperName, lower, possessive, turnerOf } from "./voice";
import "./console.css";

type VerbId = "raise" | "cord" | "draw" | "words" | "vision" | "order" | "reading" | "sight" | "turn" | "bind";

const VERBS: { id: VerbId; label: string; C: ComponentType<VerbProps> }[] = [
  { id: "raise", label: "Raise", C: Raise },
  { id: "cord", label: "Lay a cord", C: LayCord },
  { id: "draw", label: "Draw back", C: DrawBack },
  { id: "words", label: "Rewrite", C: Rewrite },
  { id: "vision", label: "Bring a vision", C: VisionVerb },
  { id: "order", label: "Order and weight", C: Order },
  { id: "reading", label: "Readings", C: Readings },
  { id: "sight", label: "The sight at rest", C: SightAtRest },
  { id: "turn", label: "", C: Turn },
  { id: "bind", label: "", C: Bind },
];

function verbFor(subject: DraftSubject | null): VerbId {
  if (!subject) return "raise";
  if (subject.type === "vision") return "vision";
  if (subject.type === "reading") return "reading";
  return "words";
}

export default function Console({ store }: ConsoleProps) {
  usePressJelly();
  const state = useSanctum(store, (s) => s.state);
  const draft = useSanctum(store, (s) => s.draft);
  const brought = useSanctum(store, (s) => s.brought);
  const busy = useSanctum(store, (s) => s.busy);
  const [face, setFace] = useState<"shape" | "record">("shape");
  const [verb, setVerb] = useState<VerbId>(verbFor(draft.subject));
  const [epoch, setEpoch] = useState(0);
  const [composed, setComposed] = useState<Composed>({ ops: null });
  const [sealed, setSealed] = useState("");
  const [more, setMore] = useState(false);
  const root = useRef<HTMLElement>(null);

  /* "Shape this" from the sight: begin with the verb that fits its subject. */
  const subjectKey = draft.subject ? `${draft.subject.type}:${draft.subject.id ?? ""}` : "";
  useEffect(() => {
    if (!subjectKey) return;
    setVerb(verbFor(draft.subject));
    setFace("shape");
    setSealed("");
    setEpoch((e) => e + 1);
  }, [subjectKey]);

  /* A foreseen knot belongs to the record. */
  useEffect(() => {
    if (draft.restoring) setFace("record");
  }, [draft.restoring]);

  /* Focus enters the lectern when the console opens; closing withdraws
     whatever was being composed (the store has already cleared the draft). */
  useEffect(() => {
    if (!draft.open) {
      setComposed({ ops: null });
      setSealed("");
      setEpoch((e) => e + 1);
      return;
    }
    const id = window.setTimeout(() => root.current?.querySelector<HTMLElement>(".sanctum-console__slot")?.focus({ preventScroll: true }), 120);
    return () => window.clearTimeout(id);
  }, [draft.open]);

  /* The pinned strip's height, so whatever is scrolled into view clears it. */
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => root.current?.style.setProperty("--c-bar-h", `${Math.ceil(el.getBoundingClientRect().height)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, [face, Boolean(draft.restoring)]);

  /* The awaited choice comes into view whenever it changes: an open chooser,
     else an unanswered group of places, else the first empty slot. */
  const awaitedKey = `${draft.awaiting?.slot ?? ""}|${composed.waiting ?? ""}|${face}`;
  useEffect(() => {
    if (!draft.open) return;
    const id = requestAnimationFrame(() => {
      const r = root.current;
      if (!r) return;
      const places = r.querySelector<HTMLElement>(".sanctum-console__quarters");
      const target =
        r.querySelector<HTMLElement>(".sanctum-console__chooser") ??
        (places && !places.querySelector('[aria-pressed="true"]') ? places : null) ??
        r.querySelector<HTMLElement>(".sanctum-console__slot.is-empty");
      if (target) bringIntoView(target, bar.current);
    });
    return () => cancelAnimationFrame(id);
  }, [awaitedKey, draft.open]);

  /* While a seal is in flight the state is replaced under the verb: whatever
     it recomposes then belongs to the map that is going away. */
  const sealing = useRef(false);
  const compose = (c: Composed) => {
    if (sealing.current) return;
    setComposed(c);
    const ops = c.ops ?? [];
    if (JSON.stringify(ops) !== JSON.stringify(store.get().draft.ops)) patchDraft(store, { ops });
  };

  const withdraw = () => {
    patchDraft(store, { ops: [], awaiting: null, hover: null });
    setComposed({ ops: null });
    setEpoch((e) => e + 1);
  };

  /* After a seal the lectern rests on the sealed words until a verb is chosen
     again (a verb that composes at once, like the turn, must not hide them). */
  const seal = async () => {
    sealing.current = true;
    const ok = await store.seal();
    if (ok) {
      setSealed(store.get().word);
      setComposed({ ops: null });
      setEpoch((e) => e + 1);
    } else sealing.current = false;
  };
  /* The lectern now rests on the sealed words; composing may begin again. */
  useEffect(() => {
    sealing.current = false;
  }, [sealed, epoch]);
  const resting = Boolean(sealed) && !draft.ops.length && !draft.restoring;

  const verbs = useMemo(() => {
    if (!state) return [];
    const turner = turnerOf(state);
    const stoneKind = state.rim ? state.elementKinds.find((k) => k.id === state.rim!.stoneKind) : undefined;
    return VERBS.filter((v) => (v.id === "turn" ? Boolean(turner) && state.conditions.length > 1 : v.id === "bind" ? Boolean(state.rim) : true)).map((v) =>
      v.id === "turn" ? { ...v, label: `${possessive(turner!.title)} office` } : v.id === "bind" ? { ...v, label: `Bind an awaiting ${lower(stoneKind?.title ?? "stone")}` } : v,
    );
  }, [state]);

  if (!state) return null;
  const awaiting = state.elements.some((e) => e.awaiting);
  const primary = new Set<VerbId>(["raise", "cord", "draw", "words", "vision", "turn", ...(awaiting ? (["bind"] as VerbId[]) : [])]);
  const keeper = keeperName(state);
  const current = verbs.find((v) => v.id === verb) ?? verbs[0];
  const V = current.C;
  const restoring = draft.restoring;
  const v = draft.verdict;
  const ready = v.state === "accepted" && v.confirmed && !busy;
  const words = verdictWords(keeper, v, composed, Boolean(restoring), sealed);
  /* The phone's pinned line carries the reason itself when the keeper refuses. */
  const status = words.tone === "refuse" && v.refusals[0] ? { ...words, head: `${keeper} refuses: ${lower(v.refusals[0].message)}` } : words;

  return (
    <section ref={root} className="sanctum-console" aria-labelledby="sanctum-console-title">
      <header className="sanctum-console__head">
        <h2 id="sanctum-console-title" className="sx-title sanctum-console__title">Shape the map</h2>
        <div className="sx-seg" role="tablist" aria-label="The console">
          {(["shape", "record"] as const).map((f) => (
            <button key={f} type="button" role="tab" aria-selected={face === f} className="sx-opt" data-jelly="" onClick={() => setFace(f)}>
              {f === "shape" ? "Shape" : "The record"}
              <SurfaceFill on={face === f} lit="var(--sx-light)" litInk="var(--sx-ink)">{f === "shape" ? "Shape" : "The record"}</SurfaceFill>
            </button>
          ))}
        </div>
      </header>

      {face === "shape" && !restoring && (
        <>
          <div className="sx-chips sanctum-console__verbs" role="group" aria-label="What to shape">
            {verbs.filter((x) => more || primary.has(x.id) || x.id === current.id).map((x) => (
              <button
                key={x.id}
                type="button"
                className="sx-chip sanctum-console__verb"
                aria-pressed={x.id === current.id}
                data-jelly=""
                onClick={() => {
                  if (x.id === current.id && !resting) return;
                  withdraw();
                  setSealed("");
                  setVerb(x.id);
                }}
              >
                {x.label}
                <SurfaceFill on={x.id === current.id} lit="var(--sx-light)" litInk="var(--sx-ink)">{x.label}</SurfaceFill>
              </button>
            ))}
            {verbs.some((x) => !primary.has(x.id)) && (
              <button type="button" className="sx-chip sanctum-console__more" aria-expanded={more} data-jelly="" onClick={() => setMore(!more)}>
                {more ? "Fewer" : "More"}
              </button>
            )}
          </div>
          <div className="sanctum-console__compose">
            {resting ? (
              <p className="sx-body">Choose what to shape next, or read the new knot in the record.</p>
            ) : (
              <V key={`${current.id}-${epoch}`} store={store} state={state} brought={brought} subject={draft.subject} verdict={v} previewState={draft.previewState} compose={compose} />
            )}
            {composed.ops && composed.brings && composed.brings.length > 0 && (
              <div className="sanctum-console__brings">
                <p className="sx-small">What the change brings, foreseen:</p>
                <div className="sx-rows">
                  {composed.brings.map((b) => <p key={b} className="sx-small">{b}</p>)}
                </div>
              </div>
            )}
          </div>
          {!restoring && <Examination keeper={keeper} verdict={v} composed={composed} restoring={false} sealed={sealed} place="flow" />}
        </>
      )}

      {(face === "record" || restoring) && <Record store={store} />}
      {restoring && <Examination keeper={keeper} verdict={v} composed={composed} restoring sealed={sealed} place="flow" />}

      {(face === "shape" || restoring) && (
      <div ref={bar} className="sanctum-console__bar">
        <Examination keeper={keeper} verdict={v} composed={composed} restoring={Boolean(restoring)} sealed={sealed} place="bar" />
        <span className={`sanctum-console__status is-${status.tone}`} aria-hidden="true">{status.head}</span>
        <div className="sanctum-console__acts">
        <button type="button" className="sx-ghost" data-jelly="" disabled={!draft.ops.length && !restoring} onClick={() => (restoring ? store.closeDraft() : withdraw())}>
          Withdraw
        </button>
        <SealButton label={restoring ? "Restore this knot" : "Seal the change"} disabled={!ready} onSeal={() => void seal()} />
        <span id="sanctum-console-seal-how" className="sx-small sanctum-console__how">
          {ready ? "Hold to seal." : v.state === "refused" ? "The seal waits for a whole map." : v.state === "checking" ? `The seal waits for ${keeper}.` : "The seal waits for a whole sentence."}
        </span>
        </div>
      </div>
      )}
    </section>
  );
}

/** Scrolls the nearest scrollable ancestor so `el` stands clear of the pinned strip
    (scrollIntoView ignores the strip inside a transformed shell). */
function bringIntoView(el: HTMLElement, strip: HTMLElement | null) {
  let box: HTMLElement | null = el.parentElement;
  while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
  if (!box) return;
  const b = box.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const floor = (strip ? strip.getBoundingClientRect().top : b.bottom) - 12;
  const visible = floor - (b.top + 16);
  if (r.bottom > floor) box.scrollTop += Math.min(r.bottom - floor, Math.max(0, r.top - (b.top + 16)));
  else if (r.top < b.top + 16 && r.height <= visible) box.scrollTop -= b.top + 16 - r.top;
}

type Tone = "wait" | "weigh" | "accept" | "refuse" | "sealed";

/** The keeper's words for the draft as it stands. */
function verdictWords(keeper: string, verdict: VerbProps["verdict"], composed: Composed, restoring: boolean, sealed: string): { tone: Tone; head: string } {
  if (sealed && verdict.state === "empty") return { tone: "sealed", head: "Sealed. A knot is tied in the record." };
  if (verdict.state === "refused") return { tone: "refuse", head: restoring ? `${keeper} refuses the return to this knot.` : `${keeper} refuses the change.` };
  if (verdict.state === "accepted" && verdict.confirmed) return { tone: "accept", head: restoring ? `${keeper} accepts the return to this knot.` : `${keeper} accepts the change.` };
  if (verdict.state === "checking" || verdict.state === "accepted") return { tone: "weigh", head: restoring ? `${keeper} weighs the return to this knot.` : `${keeper} examines the change.` };
  return { tone: "wait", head: composed.waiting ? `${keeper} waits for ${composed.waiting}.` : `${keeper} listens as the sentence forms.` };
}

/** Pinned with the seal on a wide panel; in the flow, under the sentence, on a phone. */
function Examination({ keeper, verdict, composed, restoring, sealed, place }: { keeper: string; verdict: VerbProps["verdict"]; composed: Composed; restoring: boolean; sealed: string; place: "bar" | "flow" }) {
  const unique = [...new Set(verdict.refusals.map((r) => r.message))].slice(0, 3);
  const { tone, head } = verdictWords(keeper, verdict, composed, restoring, sealed);

  return (
    <div className={`sanctum-console__exam is-${tone}`} data-place={place} role="status" aria-live="polite">
      <span className="sanctum-console__seal-mark" aria-hidden="true" />
      <div className="sanctum-console__exam-words">
        <p className="sx-head sanctum-console__exam-head">{head}</p>
        {tone === "sealed" && <p className="sx-body">{sealed}</p>}
        {tone === "refuse" && unique.map((m) => <p key={m} className="sx-body sanctum-console__why">{m}</p>)}
        {tone === "accept" && verdict.summary && (
          <p className="sx-body">
            It will enter the record as: <span className="sanctum-console__summary">{verdict.summary}</span>
          </p>
        )}
        {composed.fixes && composed.fixes.length > 0 && (tone === "refuse" || tone === "wait") && (
          <div className="sx-chips sanctum-console__fixes">
            {composed.fixes.map((f) => (
              <button key={f.label} type="button" className="sx-chip" data-jelly="" onClick={f.run}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
