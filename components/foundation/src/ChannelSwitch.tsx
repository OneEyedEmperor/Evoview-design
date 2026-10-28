import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

/* RULES §6: a preview screen that follows the option under the pointer or
   keyboard focus changes by a channel switch, never by a cut or a crossfade.
   The picture folds to a horizontal line (out), the new one opens from that
   line with a sideways shudder (in), and faint signal lines flash over the
   screen during the change. Measured from the evoview contact application,
   question 1 (ContactDossierScreen `channelVariants`, IntroSection.css
   `methodChannel*`). The lines exist only while switching; at rest the
   screen is clean (RULES §8).

   Fast pointer travel coalesces: while the screen folds or is folded, a
   newer channel replaces the pending one, so a sweep across five options
   plays one switch to the last. Coming back to the picture on screen while
   it folds opens it again from where it is. Incoming media is awaited
   (decoded, capped) before the screen opens on it; a host gate (`ready`)
   can hold the folded screen longer. */

const OUT_MS = 180;
const IN_MS = 360;
const BACK_MS = 260;
const SIGNAL_MS = 360;
const EASE_OUT = "cubic-bezier(0.42, 0, 1, 1)";
const EASE_IN = "cubic-bezier(0.16, 1, 0.3, 1)";
const REST = { transform: "translateX(0) scaleX(1) scaleY(1)", opacity: 1 };

const OUT: Keyframe[] = [
  { offset: 0.35, transform: "translateX(-0.6%) scaleX(1) scaleY(0.97)", opacity: 0.75, easing: EASE_OUT },
  { offset: 1, transform: "translateX(0) scaleX(1) scaleY(0.012)", opacity: 0 },
];
const OUT_FROM_REST: Keyframe[] = [{ offset: 0, ...REST, easing: EASE_OUT }, ...OUT];
const IN: Keyframe[] = [
  { offset: 0, transform: "translateX(0) scaleX(1.04) scaleY(0.018)", opacity: 0, easing: EASE_IN },
  { offset: 0.22, transform: "translateX(0) scaleX(1.02) scaleY(0.8)", opacity: 0.55, easing: EASE_IN },
  { offset: 0.4, transform: "translateX(0.7%) scaleX(1) scaleY(1)", opacity: 0.85, easing: EASE_IN },
  { offset: 0.6, transform: "translateX(-0.3%) scaleX(1) scaleY(1)", opacity: 0.7, easing: EASE_IN },
  { offset: 1, ...REST },
];
const STEPS = "steps(2, end)";
const SIGNAL: Keyframe[] = [
  { offset: 0, opacity: 0, transform: "translateY(-2%)", easing: STEPS },
  { offset: 0.3, opacity: 0.65, transform: "translateY(2%)", easing: STEPS },
  { offset: 0.65, opacity: 0.25, transform: "translateY(-1%)", easing: STEPS },
  { offset: 1, opacity: 0, transform: "none" },
];

const feedStyle: CSSProperties = { position: "relative", display: "block", width: "100%", height: "100%", transformOrigin: "50% 50%" };
const signalStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  display: "block",
  opacity: 0,
  pointerEvents: "none",
  background: "repeating-linear-gradient(0deg, transparent 0 3px, var(--ev-channel-signal, rgb(225 226 238 / 0.16)) 3px 4px, transparent 4px 7px)",
};

type Channel = string | number;
type Phase = "idle" | "out" | "folded" | "in";

export type ChannelSwitchProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Identity of the content; a new value plays the switch. */
  channel: Channel;
  /** The content of `channel`. The previous content is held while the old
      picture folds, so pass only what `channel` shows. */
  children: ReactNode;
  as?: "div" | "span";
  /** Class of the inner layer that folds (the host keeps its box). */
  feedClassName?: string;
  /** Signal lines over the host while switching. Default true. */
  signal?: boolean;
  /** Longest the folded screen waits for incoming media to decode. */
  mediaTimeout?: number;
  /** Which elements of the incoming content are awaited (`img` / `video` among them). Default "img, video". */
  mediaSelector?: string;
  /** The open waits for it (never the fold): false holds the new channel
      folded, mounted, until true. Default true. */
  ready?: boolean;
};

function waitForMedia(root: HTMLElement, timeout: number, selector: string): Promise<void> {
  const pending: Promise<unknown>[] = [];
  for (const el of Array.from(root.querySelectorAll(selector))) {
    if (el instanceof HTMLImageElement) {
      pending.push(
        el.complete
          ? el.decode().catch(() => {})
          : new Promise((resolve) => {
              el.addEventListener("load", resolve, { once: true });
              el.addEventListener("error", resolve, { once: true });
            }),
      );
    } else if (el instanceof HTMLVideoElement && el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      pending.push(
        new Promise((resolve) => {
          el.addEventListener("loadeddata", resolve, { once: true });
          el.addEventListener("error", resolve, { once: true });
        }),
      );
    }
  }
  if (!pending.length) return Promise.resolve();
  return Promise.race([Promise.all(pending).then(() => {}), new Promise<void>((resolve) => window.setTimeout(resolve, timeout))]);
}

type Options = { signal: boolean; mediaTimeout: number; mediaSelector: string; ready: boolean };

function createSwitch(feed: HTMLElement, signalEl: () => HTMLElement | null, opts: { current: Options }, show: (c: Channel) => void, initial: Channel) {
  let phase: Phase = "idle";
  let anim: Animation | null = null;
  let token = 0;
  let shown = initial;
  let wanted = initial;
  // The shown channel's content is not committed to the DOM yet.
  let mounting = false;
  const animated = typeof feed.animate === "function";

  // From where the layer is now when interrupting, so a turn never jumps.
  const play = (frames: Keyframe[], duration: number, fill: FillMode, fromHere: boolean) => {
    let list = frames;
    if (fromHere && anim) {
      const style = getComputedStyle(feed);
      const here = { transform: style.transform === "none" ? REST.transform : style.transform, opacity: Number(style.opacity) };
      list = [{ ...here, offset: 0, easing: frames[0].easing }, ...frames.filter((f) => f.offset !== 0)];
    }
    anim?.cancel();
    anim = feed.animate(list, { duration, fill });
    return anim;
  };

  const open = (turning: boolean) => {
    phase = "in";
    const t = ++token;
    play(turning ? IN.slice(2) : IN, turning ? BACK_MS : IN_MS, "none", turning).finished.then(
      () => {
        if (t !== token) return;
        anim = null;
        phase = "idle";
        if (wanted !== shown) fold();
      },
      () => {},
    );
  };

  const reveal = () => {
    const t = ++token;
    if (!opts.current.ready) return;
    void waitForMedia(feed, opts.current.mediaTimeout, opts.current.mediaSelector).then(() => {
      if (t === token && phase === "folded" && opts.current.ready) open(false);
    });
  };

  // Folded: put the wanted channel on; it opens once committed, ready and decoded.
  const tune = () => {
    ++token;
    if (wanted === shown) reveal();
    else {
      shown = wanted;
      mounting = true;
      show(wanted);
    }
  };

  const fold = () => {
    phase = "out";
    const t = ++token;
    if (opts.current.signal) signalEl()?.animate(SIGNAL, { duration: SIGNAL_MS });
    const interrupted = anim !== null;
    play(interrupted ? OUT : OUT_FROM_REST, OUT_MS, "forwards", interrupted).finished.then(
      () => {
        if (t !== token) return;
        phase = "folded";
        tune();
      },
      () => {},
    );
  };

  return {
    request(next: Channel) {
      wanted = next;
      if (!animated) {
        if (next !== shown) show((shown = next));
        return;
      }
      if (next === shown) {
        if (phase === "out") open(true);
        return;
      }
      if (phase === "out") return;
      if (phase === "folded") tune();
      else fold();
    },
    committed(next: Channel) {
      if (next === shown) mounting = false;
      if (next === shown && phase === "folded") reveal();
    },
    released() {
      if (phase === "folded" && !mounting) reveal();
    },
    dispose() {
      token += 1;
      anim?.cancel();
    },
  };
}

export function ChannelSwitch({ channel, children, as: Tag = "div", feedClassName, signal = true, mediaTimeout = 600, mediaSelector = "img, video", ready = true, style, ...host }: ChannelSwitchProps) {
  const feedRef = useRef<HTMLElement | null>(null);
  const signalRef = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState<Channel>(channel);
  const held = useRef<ReactNode>(children);
  // Idempotent: the content of the channel on screen, held while another folds in.
  if (channel === shown) held.current = children;
  const opts = useRef<Options>({ signal, mediaTimeout, mediaSelector, ready });
  const engine = useRef<ReturnType<typeof createSwitch> | null>(null);

  useLayoutEffect(() => {
    opts.current = { signal, mediaTimeout, mediaSelector, ready };
  }, [signal, mediaTimeout, mediaSelector, ready]);

  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const e = createSwitch(feed, () => signalRef.current, opts, setShown, shown);
    engine.current = e;
    return () => {
      e.dispose();
      engine.current = null;
    };
    // Created once: from here the engine owns which channel is shown.
  }, []);

  useLayoutEffect(() => engine.current?.request(channel), [channel]);
  useLayoutEffect(() => engine.current?.committed(shown), [shown]);
  useLayoutEffect(() => {
    if (ready) engine.current?.released();
  }, [ready]);

  return (
    <Tag {...host} style={{ position: "relative", ...style }}>
      <Tag ref={(node: HTMLElement | null) => void (feedRef.current = node)} className={feedClassName} style={feedStyle}>
        {held.current}
      </Tag>
      {signal && <Tag ref={(node: HTMLElement | null) => void (signalRef.current = node)} aria-hidden="true" style={signalStyle} />}
    </Tag>
  );
}
