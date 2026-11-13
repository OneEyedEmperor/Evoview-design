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

  const compose = (c: Composed) => {
    setComposed(c);
    const ops = c.ops ?? [];
    if (JSON.stringify(ops) !== JSON.stringify(store.get().draft.ops)) patchDraft(store, { ops });
    if (c.ops) setSealed("");
  };

  const withdraw = () => {
    patchDraft(store, { ops: [], awaiting: null, hover: null });
    setComposed({ ops: null });
    setEpoch((e) => e + 1);
  };

  const seal = async () => {
    const ok = await store.seal();
    if (ok) {
      setSealed(store.get().word);
      setComposed({ ops: null });
      setEpoch((e) => e + 1);
    }
  };

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

  return (
    <section ref={root} className="sanctum-console" aria-labelledby="sanctum-console-title">
      <header className="sanctum-console__head">
        <h2 id="sanctum-console-title" className="sx-title sanctum-console__title">Shape the map</h2>
        <div className="sx-seg" role="tablist" aria-label="The console">
          {(["shape", "record"] as const).map((f) => (
            <button key={f} type="button" role="tab" aria-selected={face === f} className="sx-opt" data-jelly="" onClick={() => setFace(f)}>
              {f === "shape" ? "Shape" : "The record"}
              <SurfaceFill on={face === f} lit="var(--sx-ivory)" litInk="var(--sx-ink)">{f === "shape" ? "Shape" : "The record"}</SurfaceFill>
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
                  if (x.id === current.id) return;
                  withdraw();
                  setVerb(x.id);
                }}
              >
                {x.label}
                <SurfaceFill on={x.id === current.id} lit="var(--sx-ivory)" litInk="var(--sx-ink)">{x.label}</SurfaceFill>
              </button>
            ))}
            {verbs.some((x) => !primary.has(x.id)) && (
              <button type="button" className="sx-chip sanctum-console__more" aria-expanded={more} data-jelly="" onClick={() => setMore(!more)}>
                {more ? "Fewer" : "More"}
              </button>
            )}
          </div>
          <div className="sanctum-console__compose">
            <V key={`${current.id}-${epoch}`} store={store} state={state} brought={brought} subject={draft.subject} verdict={v} previewState={draft.previewState} compose={compose} />
            {composed.ops && composed.brings && composed.brings.length > 0 && (
              <div className="sanctum-console__brings">
                <p className="sx-small">What the change brings, foreseen:</p>
                <div className="sx-rows">
                  {composed.brings.map((b) => <p key={b} className="sx-small">{b}</p>)}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {(face === "record" || restoring) && <Record store={store} />}

      {(face === "shape" || restoring) && (
      <div className="sanctum-console__bar">
        <Examination keeper={keeper} verdict={v} composed={composed} restoring={Boolean(restoring)} sealed={sealed} />
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

function Examination({ keeper, verdict, composed, restoring, sealed }: { keeper: string; verdict: VerbProps["verdict"]; composed: Composed; restoring: boolean; sealed: string }) {
  const unique = [...new Set(verdict.refusals.map((r) => r.message))].slice(0, 3);
  let tone: "wait" | "weigh" | "accept" | "refuse" | "sealed" = "wait";
  let head: string;
  if (sealed && verdict.state === "empty") {
    tone = "sealed";
    head = "Sealed. A knot is tied in the record.";
  } else if (verdict.state === "refused") {
    tone = "refuse";
    head = restoring ? `${keeper} refuses the return to this knot.` : `${keeper} refuses the change.`;
  } else if (verdict.state === "accepted" && verdict.confirmed) {
    tone = "accept";
    head = restoring ? `${keeper} accepts the return to this knot.` : `${keeper} accepts the change.`;
  } else if (verdict.state === "checking" || verdict.state === "accepted") {
    tone = "weigh";
    head = restoring ? `${keeper} weighs the return to this knot.` : `${keeper} examines the change.`;
  } else head = composed.waiting ? `${keeper} waits for ${composed.waiting}.` : `${keeper} listens as the sentence forms.`;

  return (
    <div className={`sanctum-console__exam is-${tone}`} role="status" aria-live="polite">
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
