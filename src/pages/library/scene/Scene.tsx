import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Readout, cn } from "../../../../components/foundation/src";
import { ShowcaseVariant, type DemoRhythm, type DemoTone } from "../../../library/ShowcasePage";
import "./scene.css";

/* One scene of a showcase page: caption (what it is, when a client picks it)
   → desk (its settings and one sentence) → the live component, all on the
   ground the component opens on, so the tone cut always falls between
   scenes. The frame (ShowcaseVariant) owns the bands: chapter band between
   scenes, heading band from caption to desk. The component keeps its own
   top padding (its rhythm), so caption → desk reads tighter than desk →
   component. Shared by the chapter and card pages. */

type SceneProps = {
  /** What it is: the caption heading. */
  name: ReactNode;
  /** One sentence: when a client picks it. */
  when: ReactNode;
  /** The ground the component opens on; caption and desk stand on it.
      Omit for a framed crop: the scene then stands on the frame's dark
      ground. A page of chapters gives its first chapter's ground here and
      its last one in `exit`. */
  tone?: DemoTone;
  /** The ground the component ends on, when it differs (a page of
      chapters): the next scene's top band follows it. */
  exit?: DemoTone;
  /** A <SceneDesk>, set on the rail above the component. */
  desk?: ReactNode;
  /** Pre-measure guess of the component's top padding (frame contract). */
  rhythm?: DemoRhythm;
  id?: string;
  children: ReactNode;
};

export function Scene({ name, when, tone, exit, desk, rhythm = "flush", id, children }: SceneProps) {
  const deskRef = useRef<HTMLDivElement>(null);
  const held = useRef<{ top: number; at: number } | null>(null);

  /* A setting that changes the scene's ground (a tone switch) changes the
     band above it. The desk is held under the pointer: its page position
     is read when it is used and the scroll absorbs the shift before paint. */
  const hold = () => {
    const el = deskRef.current;
    if (el) held.current = { top: el.getBoundingClientRect().top + window.scrollY, at: performance.now() };
  };
  useLayoutEffect(() => {
    const was = held.current;
    const el = deskRef.current;
    held.current = null;
    if (!was || !el || performance.now() - was.at > 1000) return;
    const shift = el.getBoundingClientRect().top + window.scrollY - was.top;
    if (Math.abs(shift) >= 1) window.scrollBy(0, shift);
  });

  return (
    <ShowcaseVariant id={id} name={name} when={keepSpaces(when)} caption="title" tone={tone} rhythm={rhythm}>
      <div className="lib-scene" data-exit={exit ?? tone ?? "dark"}>
        {desk && (
          <div
            ref={deskRef}
            className={`lib-rail ev-root ev-tone-${tone ?? "dark"} lib-scene__desk`}
            onPointerDownCapture={hold}
            onKeyDownCapture={hold}
          >
            {desk}
          </div>
        )}
        {children}
      </div>
    </ShowcaseVariant>
  );
}

type SceneDeskProps = {
  /** <DeskSetting>s. */
  children: ReactNode;
  /** The sentence for the current state. */
  say: ReactNode;
  /** Every sentence the desk can show: the tallest is reserved, so the
      component below never moves when the sentence changes. */
  sayAll?: ReactNode[];
  /** strip: settings side by side over the sentence (default) · column:
      settings stacked, for a desk standing beside its component. */
  layout?: "strip" | "column";
  className?: string;
};

/* The desk: settings (label over control) and one sentence under them,
   on the same left edge. Tone comes from the element around it. */
export function SceneDesk({ children, say, sayAll = [], layout = "strip", className }: SceneDeskProps) {
  return (
    <div className={cn("lib-desk", className)} data-layout={layout}>
      <div className="lib-desk__settings">{children}</div>
      <div className="lib-desk__say">
        {sayAll.map((line, i) => (
          <p key={i} className="ev-t-body" aria-hidden="true">
            {keepSpaces(line)}
          </p>
        ))}
        <p className="ev-t-body" aria-live="polite">
          {keepSpaces(say)}
        </p>
      </div>
    </div>
  );
}

/* One setting: its label (state voice, decorative: the control carries the
   same accessible name) over the control. */
export function DeskSetting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="lib-desk__setting">
      <Readout className="lib-desk__label" aria-hidden="true">
        {label}
      </Readout>
      {children}
    </div>
  );
}

/* French punctuation keeps its space unbreakable: a line never opens on a
   colon or a closing guillemet. */
const keepSpaces = (node: ReactNode): ReactNode =>
  typeof node === "string" ? node.replace(/ ([:;!?»])/g, " $1").replace(/« /g, "« ") : node;

export const deskOptions =<K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));
