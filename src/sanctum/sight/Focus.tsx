/* Focus: the element's vision rises as a lancet window beside the eye (never
   in the pupil), with its sheet: purpose, nature, cords and their functions,
   explanation. A vision is revealed only once decoded; its subject moves in
   one continuous pan when the shown state changes (the picture's axis is the
   state's axis). */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { visionSrcSet } from "../data";
import { BEYOND, type Id, type SanctumState, type Vision, type VisionSubject } from "../model/types";
import { cordsOf, realmColour, stateShown, type KindInfo } from "./derive";
import { Glyph } from "./Glyph";
import { SwitchRow } from "./Panel";

/** A gothic lancet: two arcs meeting at a point, as a % polygon for the box. */
function lancetPath(w: number, h: number) {
  const s = Math.min(h, w * 0.866);
  const pts: string[] = [`0% 100%`];
  for (let i = 0; i <= 18; i++) { const f = Math.PI + (i / 18) * (Math.PI / 3); pts.push(`${(((w + w * Math.cos(f)) / w) * 100).toFixed(2)}% ${(((s + w * Math.sin(f)) / h) * 100).toFixed(2)}%`); }
  for (let i = 18; i >= 0; i--) { const f = -(i / 18) * (Math.PI / 3); pts.push(`${(((w * Math.cos(f)) / w) * 100).toFixed(2)}% ${(((s + w * Math.sin(f)) / h) * 100).toFixed(2)}%`); }
  pts.push(`100% 100%`);
  return `polygon(${pts.join(",")})`;
}

export function Lancet({ vision, subject, tone }: { vision: Vision; subject: VisionSubject; tone: string }) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setReady(false);
    const el = img.current;
    if (!el) return;
    let live = true;
    const reveal = () => el.decode().then(() => live && setReady(true), () => live && setReady(true));
    if (el.complete && el.naturalWidth) void reveal();
    else el.addEventListener("load", reveal, { once: true });
    return () => { live = false; el.removeEventListener("load", reveal); };
  }, [vision.id, size.w > 0]);

  const { w, h } = size;
  const base = w && h ? Math.max(w / vision.width, h / vision.height) : 0;
  const bw = vision.width * base, bh = vision.height * base;
  const z = Math.max(1, subject.zoom);
  const x = Math.min(0, Math.max(w - bw * z, w / 2 - subject.x * bw * z));
  const y = Math.min(0, Math.max(h - bh * z, h / 2 - subject.y * bh * z));
  /* one candidate for the whole family, so the pan between subjects never swaps the source */
  const zMax = Math.max(z, ...vision.subjects.map((s) => s.zoom));
  const sizes = `${Math.ceil(w * zMax)}px`;
  const formats = vision.formats;

  return (
    <div ref={box} className="sx-lancet" style={{ clipPath: w ? lancetPath(w, h) : undefined, backgroundColor: vision.tone, ["--sx-lancet-tone" as string]: tone }}>
      <div className="sx-lancet__veil" style={{ backgroundImage: `url(${vision.placeholder})`, opacity: ready ? 0 : 1 }} />
      {w > 0 && (
        <picture>
          {!formats.includes("webp") && formats.includes("avif") && <source type="image/avif" srcSet={visionSrcSet(vision, "avif")} sizes={sizes} />}
          <img
            ref={img}
            alt={vision.title}
            srcSet={visionSrcSet(vision, formats.includes("webp") ? "webp" : formats[0])}
            sizes={sizes}
            decoding="async"
            className="sx-lancet__img"
            style={{ width: bw, height: bh, transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${z})`, opacity: ready ? 1 : 0 }}
          />
        </picture>
      )}
      <div className="sx-lancet__shade" />
    </div>
  );
}

interface FocusProps {
  state: SanctumState;
  id: Id;
  condition: Id;
  foresee: boolean;
  infos: KindInfo[];
  layout: "side" | "stack";
  onClose(): void;
  onShape(): void;
  onForesee(): void;
  onPick(id: Id): void;
}

export function visionOf(state: SanctumState, id: Id, condition: Id): { vision: Vision; subject: VisionSubject } | null {
  if (state.roles.unseen.includes(id)) return null;
  const shown = stateShown(state, id, condition);
  for (const candidate of [shown?.id, id]) {
    const el = state.elements.find((e) => e.id === candidate);
    const v = el && state.visions.find((x) => x.id === el.visions[0]);
    const s = v?.subjects.find((x) => x.elementId === candidate);
    if (v && s) return { vision: v, subject: s };
  }
  return null;
}

export function Focus({ state, id, condition, foresee, infos, layout, onClose, onShape, onForesee, onPick }: FocusProps) {
  const el = state.elements.find((e) => e.id === id);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => { sheet.current?.scrollTo({ top: 0 }); sheet.current?.focus({ preventScroll: true }); }, [id]);
  if (!el) return null;
  const shown = stateShown(state, id, condition) ?? el;
  const realms = [...state.layers].sort((a, b) => a.order - b.order);
  const hasStates = state.elements.some((e) => e.parent === id && e.condition) || Boolean(el.condition);
  const other = state.conditions.find((c) => c.id !== state.sight.condition);
  const rows = cordsOf(state, el.condition ? el.parent ?? id : id, condition, infos);
  const v = visionOf(state, id, condition);
  const tone = realmColour(state, shown.realm);
  const nature = shown.nature.length ? shown.nature : el.nature;
  const arrow = (d: string) => (d === "in" ? "←" : d === "both" ? "↔" : "→");

  return (
    <div className="sx-focus" data-layout={layout} data-vision={v ? "" : undefined}>
      {v && (
        <div className="sx-focus__window">
          <Lancet vision={v.vision} subject={v.subject} tone={tone} />
        </div>
      )}
      <div ref={sheet} className="sx-focus__sheet" role="dialog" aria-labelledby="sx-focus-title" tabIndex={-1}>
        <div className="sx-focus__inner">
          <div className="sx-focus__titles">
            <h2 id="sx-focus-title" className="sx-title" style={{ fontSize: layout === "stack" ? 34 : 44 }}>{el.condition ? state.elements.find((e) => e.id === el.parent)?.title ?? el.title : el.title}</h2>
            <div className="sx-bars" aria-hidden="true">
              <i className={shown.realm === BEYOND ? "lit apart" : "apart"} style={shown.realm === BEYOND ? { background: realmColour(state, BEYOND) } : undefined} />
              {realms.map((l) => <i key={l.id} className={shown.realm === l.id ? "lit" : undefined} style={shown.realm === l.id ? { background: realmColour(state, l.id) } : undefined} />)}
            </div>
          </div>
          {hasStates && other && (
            <div className="sx-tiles">
              <SwitchRow on={foresee} label={`Foresee ${other.title.toLowerCase()}`} onToggle={onForesee} />
            </div>
          )}
          {foresee && hasStates && <p className="sx-small sx-foreseen">Foreseen, not sealed.</p>}
          <p className="sx-lead">{shown.purpose}</p>
          {nature.length > 0 && (
            <div className="sx-tiles">
              {nature.map((n, i) => <div key={i} className="sx-tile sx-tile--text"><span className="sx-body" style={{ color: "var(--sx-fg-90)" }}>{n}</span></div>)}
            </div>
          )}
          {rows.length > 0 && (
            <>
              <h3 className="sx-head">Its cords</h3>
              <div className="sx-rows sx-cordrows">
                {rows.map((r) => (
                  <button key={r.thread.id} type="button" className="sx-cordrow" data-latent={r.latent || undefined} onClick={() => { const o = r.dir === "in" ? r.thread.from : r.thread.to; if (!o.startsWith("layer:")) onPick(o); }}>
                    <Glyph role={r.info.role} colour={r.info.colour} dim={r.latent} size={34} />
                    <span className="sx-txt">
                      <span className="sx-label" style={{ fontSize: 12.5 }}>{r.thread.label} {arrow(r.dir)} {r.end}</span>
                      <span className="sx-small">{r.thread.purpose}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {shown.explanation && shown.explanation !== shown.purpose && <p className="sx-body">{shown.explanation}</p>}
          <div className="sx-focus__acts">
            <button type="button" className="sx-plate" data-jelly="" onClick={onShape}>Shape this</button>
          </div>
        </div>
      </div>
      <button type="button" className="sx-orb-button sx-focus__close" data-jelly="" aria-label="Close" onClick={onClose}>
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}
