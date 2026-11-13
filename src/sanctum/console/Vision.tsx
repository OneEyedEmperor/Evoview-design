/* Bring a vision, set it upon an element, move its gaze, or lift it. The
   lancet shows the window as the sight will crop it: the picture covers the
   window, is brought nearer by `zoom`, and keeps the focal point centred
   unless an edge of the picture would show. Revealed only once decoded. */

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { checkLocally, ops as op, slotsFor, visionSrcSet, visionUrl, type Choice } from "../data";
import { BUDGET, VISION_MAX_BYTES, ZOOM } from "../model/rules";
import type { Op, VisionFiles } from "../model/types";
import { Sentence, type Part } from "./Sentence";
import type { VerbProps } from "./verbs";

type Mode = "bring" | "set" | "gaze" | "lift";
const TYPES = ["image/png", "image/jpeg", "image/webp"];

export function VisionVerb({ store, state, brought, subject, compose }: VerbProps) {
  const subjectEl = subject?.type === "element" ? subject.id ?? "" : "";
  const subjectVision = subject?.type === "vision" ? subject.id ?? "" : "";
  const pending = Object.values(brought).filter((f) => !state.visions.some((v) => v.id === f.id));
  const [mode, setMode] = useState<Mode>(subjectVision ? "gaze" : "bring");
  const [visionId, setVisionId] = useState(subjectVision || pending[0]?.id || "");
  const [elementId, setElementId] = useState(subjectEl);
  const [title, setTitle] = useState("");
  const [gaze, setGaze] = useState({ x: 0.5, y: 0.5, zoom: 1 });
  const [bringing, setBringing] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const inMap = state.visions.find((v) => v.id === visionId);
  const files: VisionFiles | undefined = inMap ?? brought[visionId];
  const fresh = mode === "bring" && Boolean(files) && !inMap;
  const base = useMemo(() => (fresh ? checkLocally(state, [op.addVision(visionId, "A vision")], brought).state : state), [state, fresh, visionId, brought]);
  const assignSlots = useMemo(() => slotsFor(base, { op: mode === "bring" || mode === "set" ? "assignVision" : mode === "gaze" ? "setVisionSubject" : "unassignVision", visionId }), [base, mode, visionId]);
  const elementOk = assignSlots.slots.elementId?.some((c) => c.value === elementId && c.ok) ? elementId : "";

  /* When an existing gaze is chosen, start from where it rests. */
  useEffect(() => {
    if (mode !== "gaze" || !inMap || !elementOk) return;
    const s = inMap.subjects.find((x) => x.elementId === elementOk);
    if (s) setGaze({ x: s.x, y: s.y, zoom: s.zoom });
  }, [mode, visionId, elementOk]);

  let waiting: string | undefined;
  let ops: Op[] | null = null;
  const g = { x: round(gaze.x), y: round(gaze.y), zoom: round(gaze.zoom) };
  if (mode === "bring") {
    if (!files || inMap) waiting = "a picture to bring";
    else if (!title.trim()) waiting = "a title for the vision";
    else if (!elementOk) waiting = "the element it is set upon";
    else ops = [op.addVision(visionId, title.trim()), op.assignVision(visionId, elementOk, { ...g, primary: true })];
  } else if (mode === "set") {
    if (!inMap) waiting = "a vision";
    else if (!elementOk) waiting = "the element it is set upon";
    else ops = [op.assignVision(visionId, elementOk, g)];
  } else if (mode === "gaze") {
    const s = inMap?.subjects.find((x) => x.elementId === elementOk);
    if (!inMap) waiting = "a vision";
    else if (!elementOk || !s) waiting = "the element it rests upon";
    else if (s.x === g.x && s.y === g.y && s.zoom === g.zoom) waiting = "a new gaze";
    else ops = [op.setVisionSubject(visionId, elementOk, g.x, g.y, g.zoom)];
  } else {
    if (!inMap) waiting = "a vision";
    else if (!elementOk) waiting = "the element it rests upon";
    else ops = [op.unassignVision(visionId, elementOk)];
  }

  const key = JSON.stringify(ops) + (waiting ?? "");
  const last = useRef("");
  useEffect(() => {
    if (key === last.current) return;
    last.current = key;
    compose({ ops, waiting });
  }, [key]);

  const bring = async (file: File | undefined) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return setBringing("Only a still picture may be brought as a vision.");
    if (file.size > VISION_MAX_BYTES) return setBringing("This picture is too heavy to bring.");
    setBringing("The vision is being brought.");
    const got = await store.bringVision(file);
    if (got) {
      setVisionId(got.id);
      setMode("bring");
      setGaze({ x: 0.5, y: 0.5, zoom: 1 });
      setBringing("");
    } else setBringing(store.get().word || "The vision could not be brought.");
  };

  const modeChoices: Choice[] = [
    { value: "bring", title: "Bring a vision", ok: true },
    { value: "set", title: "Set a vision", ok: state.visions.length > 0, ...(state.visions.length ? {} : { why: "No vision stands in the map yet." }) },
    { value: "gaze", title: "Move the gaze of", ok: state.visions.length > 0, ...(state.visions.length ? {} : { why: "No vision stands in the map yet." }) },
    { value: "lift", title: "Lift the vision", ok: state.visions.length > 0, ...(state.visions.length ? {} : { why: "No vision stands in the map yet." }) },
  ];
  const visionChoices: Choice[] = state.visions.map((v) => ({ value: v.id, title: v.title, ok: true }));
  const modePart: Part = { slot: "choice", key: "mode", placeholder: "", value: mode, choices: modeChoices, onChoose: (v) => { setMode(v as Mode); setElementId(subjectEl); if (v !== "bring") setVisionId(subjectVision || state.visions[0]?.id || ""); } };
  const elementPart = (placeholder: string): Part => ({ slot: "choice", key: "element", placeholder, value: elementOk, choices: assignSlots.slots.elementId ?? [], onChoose: setElementId, onEye: true });
  const parts: Part[] =
    mode === "bring"
      ? [modePart, files && !inMap ? " named " : "", files && !inMap && { slot: "text", key: "title", placeholder: "its title", value: title, budget: BUDGET.visionTitle, onChange: setTitle, label: "The title of the vision" }, files && !inMap && ", and set it upon ", files && !inMap && elementPart("an element"), files && !inMap ? "." : ""]
      : mode === "set"
        ? [modePart, " ", { slot: "choice", key: "vision", placeholder: "which vision", value: visionId, choices: visionChoices, onChoose: setVisionId }, " upon ", elementPart("an element"), "."]
        : mode === "gaze"
          ? [modePart, " ", { slot: "choice", key: "vision", placeholder: "which vision", value: visionId, choices: visionChoices, onChoose: setVisionId }, " upon ", elementPart("an element"), "."]
          : [modePart, " ", { slot: "choice", key: "vision", placeholder: "which vision", value: visionId, choices: visionChoices, onChoose: setVisionId }, " from ", elementPart("an element"), "."];

  return (
    <>
      <Sentence store={store} parts={parts} />
      {mode === "bring" && (!files || inMap) && (
        <div
          className="sanctum-console__bring"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void bring(e.dataTransfer.files[0]);
          }}
        >
          <input ref={input} type="file" accept={TYPES.join(",")} hidden onChange={(e) => void bring(e.target.files?.[0])} />
          <button type="button" className="sx-plate" data-jelly="" disabled={store.get().busy} onClick={() => input.current?.click()}>
            Bring a picture
          </button>
          <p className="sx-small" role="status">{bringing || "Or lay a picture here."}</p>
        </div>
      )}
      {files && mode !== "lift" && (mode === "bring" ? !inMap : true) && (
        <Gaze files={files} gaze={gaze} onGaze={setGaze} disabled={mode === "gaze" && !elementOk} />
      )}
    </>
  );
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** The crop the sight makes: cover, nearer by zoom, focal centred, edges kept. */
export function lancetCrop(iw: number, ih: number, ww: number, wh: number, x: number, y: number, zoom: number) {
  const s = Math.max(ww / iw, wh / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  return { width: dw, height: dh, left: clamp(ww / 2 - x * dw, ww - dw, 0), top: clamp(wh / 2 - y * dh, wh - dh, 0) };
}

function useDecoded(files: VisionFiles, width: number) {
  const [src, setSrc] = useState<{ src: string; srcSet: string } | null>(null);
  useEffect(() => {
    let live = true;
    setSrc(null);
    const fmt = files.formats.includes("avif") ? "avif" : files.formats[0];
    const w = files.sizes.find((s) => s >= width) ?? files.sizes[files.sizes.length - 1];
    const img = new Image();
    img.srcset = visionSrcSet(files, fmt);
    img.sizes = `${width}px`;
    img.src = visionUrl(files.id, w, fmt);
    img.decode().then(
      () => live && setSrc({ src: img.currentSrc || img.src, srcSet: img.srcset }),
      () => live && setSrc({ src: img.src, srcSet: "" }),
    );
    return () => {
      live = false;
    };
  }, [files.id, width]);
  return src;
}

function Gaze({ files, gaze, onGaze, disabled }: { files: VisionFiles; gaze: { x: number; y: number; zoom: number }; onGaze: (g: { x: number; y: number; zoom: number }) => void; disabled: boolean }) {
  const pic = useRef<HTMLDivElement>(null);
  const decoded = useDecoded(files, 640);
  const ratio = files.width / files.height;
  const LW = 120, LH = 200;
  const crop = lancetCrop(files.width, files.height, LW, LH, gaze.x, gaze.y, gaze.zoom);
  /* The window's share of the picture, drawn on the whole. */
  const view = { left: -crop.left / crop.width, top: -crop.top / crop.height, width: LW / crop.width, height: LH / crop.height };

  const at = (e: ReactPointerEvent) => {
    const r = pic.current!.getBoundingClientRect();
    onGaze({ ...gaze, x: round(clamp((e.clientX - r.left) / r.width, 0, 1)), y: round(clamp((e.clientY - r.top) / r.height, 0, 1)) });
  };
  const words = `${gaze.x < 0.34 ? "to the left" : gaze.x > 0.66 ? "to the right" : "at the middle"}, ${gaze.y < 0.34 ? "high" : gaze.y > 0.66 ? "low" : "midway"}`;

  return (
    <div className={`sanctum-console__gaze${disabled ? " is-still" : ""}`}>
      <div className="sanctum-console__gaze-pic">
        <span className="sx-field__label">Where the gaze rests</span>
        <div
          ref={pic}
          className="sanctum-console__picture"
          style={{ aspectRatio: String(ratio), backgroundColor: files.tone, backgroundImage: `url(${files.placeholder})` }}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-label="Where the gaze rests"
          aria-valuetext={words}
          aria-valuenow={Math.round(gaze.x * 100)}
          onPointerDown={(e) => {
            if (disabled) return;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            at(e);
          }}
          onPointerMove={(e) => {
            if (!disabled && e.buttons) at(e);
          }}
          onKeyDown={(e) => {
            const d = e.shiftKey ? 0.1 : 0.02;
            const next = { ...gaze };
            if (e.key === "ArrowLeft") next.x = clamp(gaze.x - d, 0, 1);
            else if (e.key === "ArrowRight") next.x = clamp(gaze.x + d, 0, 1);
            else if (e.key === "ArrowUp") next.y = clamp(gaze.y - d, 0, 1);
            else if (e.key === "ArrowDown") next.y = clamp(gaze.y + d, 0, 1);
            else return;
            e.preventDefault();
            onGaze({ ...next, x: round(next.x), y: round(next.y) });
          }}
        >
          {decoded && <img className="is-shown" src={decoded.src} alt="" draggable={false} />}
          <span className="sanctum-console__view" style={{ left: `${view.left * 100}%`, top: `${view.top * 100}%`, width: `${view.width * 100}%`, height: `${view.height * 100}%` }} />
          <span className="sanctum-console__focal" style={{ left: `${gaze.x * 100}%`, top: `${gaze.y * 100}%` }} />
        </div>
        <label className="sanctum-console__near">
          <span className="sx-field__label">How near</span>
          <input type="range" min={ZOOM.min} max={ZOOM.max} step={0.05} value={gaze.zoom} disabled={disabled} onChange={(e) => onGaze({ ...gaze, zoom: Number(e.target.value) })} aria-valuetext={gaze.zoom < 1.3 ? "the whole" : gaze.zoom < 2.2 ? "near" : "very near"} />
        </label>
      </div>
      <div className="sanctum-console__lancet" style={{ width: LW, height: LH, backgroundColor: files.tone }} aria-hidden="true">
        <span className="sanctum-console__veil" style={{ backgroundImage: `url(${files.placeholder})` }} />
        {decoded && (
          <img
            className="is-shown"
            src={decoded.src}
            alt=""
            draggable={false}
            style={{ width: crop.width, height: crop.height, transform: `translate(${crop.left}px, ${crop.top}px)` }}
          />
        )}
      </div>
    </div>
  );
}
