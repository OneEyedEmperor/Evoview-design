import type { ModalRoutes, ViewHead } from "../foundation";
import { isVideo } from "./media";
import type { ProcessSequenceConfig, ProcessSequenceView, ProcessStep } from "./types";

/* Crawlable step dossier (docs/CRAWLABLE-MODALS.md): one view per step that
   carries `detail`, keyed by the step id. Pure functions of the config. */

/** The dossier's h1 lines. */
export const headingLines = (step: ProcessStep): string[] => (step.detail?.heading.length ? step.detail.heading : [step.title]);

const DESCRIPTION_MAX = 160;

function clip(text: string, max = DESCRIPTION_MAX): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.!?…-]+$/, "")}…`;
}

const stepOf = (config: ProcessSequenceConfig, view: ProcessSequenceView) => config.steps.find((s) => s.id === view.step && s.detail);

export const processSequenceRoutes: ModalRoutes<ProcessSequenceConfig, ProcessSequenceView> = {
  views: (config) => config.steps.filter((s) => s.detail).map((s) => ({ step: s.id })),
  parent: () => null,
  key: (view) => view.step,
  parse: (config, key) => {
    const id = key.replace(/^\/+|\/+$/g, "");
    return config.steps.some((s) => s.id === id && s.detail) ? { step: id } : null;
  },
  head: (config, view): ViewHead => {
    const step = stepOf(config, view);
    if (!step) return { title: config.copy.dossier.label, description: config.copy.dossier.label, breadcrumb: [config.copy.dossier.label] };
    const heading = headingLines(step).join(" ");
    const title = heading.toLowerCase() === step.title.toLowerCase() ? heading : `${heading} — ${step.title}`;
    const src = step.media.poster ?? (isVideo(step.media) ? undefined : step.media.src);
    return {
      title,
      description: clip(step.detail?.intro ?? step.summary),
      breadcrumb: [step.title],
      // Inline placeholders are not shareable images.
      ...(src && !src.startsWith("data:") ? { image: { src, alt: step.media.alt || heading } } : {}),
    };
  },
};
