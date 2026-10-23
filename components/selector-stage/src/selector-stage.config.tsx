/* Per-site file — the only one to edit. Labels (FR / EN) and the site's
   chapters. The reference content is a fictional renovation studio with its
   own lime-paint line; replace copy, media (./media) and the plan drawing,
   keep the shapes. Rename or add chapters freely: each entry is passed to
   <SelectorStage>, <CompareToggle> or <ProofAtlas>. */

import { useId } from "react";
import type { AtlasContent, CompareContent, Locale, SelectorStageContent, SelectorStageCopy } from "./types";
import roomChalk from "./media/room-chalk.webp";
import roomClay from "./media/room-clay.webp";
import roomSage from "./media/room-sage.webp";
import roomInk from "./media/room-ink.webp";
import kitchenBefore from "./media/kitchen-before.webp";
import kitchenAfter from "./media/kitchen-after.webp";
import atlasDetail from "./media/atlas-detail.webp";
import atlasStair from "./media/atlas-stair.webp";
import atlasBath from "./media/atlas-bath.webp";

export type { Locale };

export type SelectorStageConfig = {
  locale: Locale;
  copy: SelectorStageCopy;
  chapters: {
    finishes: SelectorStageContent;
    renovation: CompareContent;
    plans: CompareContent;
    atlas: AtlasContent;
  };
};

/** Language used when a component gets no `copy`. */
export const defaultSelectorStageLocale: Locale = "fr";

const COPY: Record<Locale, SelectorStageCopy> = {
  fr: {
    view: "Vue",
    frame: "Cadre",
    loading: "Préparation des images",
    failed: "Les images n'ont pas pu être chargées.",
    retry: "Réessayer",
    autoplayPause: "Mettre en pause",
    autoplayResume: "Reprendre le défilement",
    versus: "comparé à",
  },
  en: {
    view: "View",
    frame: "Frame",
    loading: "Preparing images",
    failed: "The images could not be loaded.",
    retry: "Try again",
    autoplayPause: "Pause",
    autoplayResume: "Resume autoplay",
    versus: "compared with",
  },
};

/* Reference specimen: a floor plan drawn as a node (any rendered node can be a
   stage). Two proposals for one kitchen; what each changes is drawn in the accent. */
function PlanDrawing({ variant, labels }: { variant: "glass" | "open"; labels: { kitchen: string; living: string; open: string } }) {
  const after = variant === "open";
  const grid = `ss-plan-grid-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 400 330" role="presentation" style={{ width: "100%", height: "100%", display: "block", background: "#0b0b0c" }}>
      <defs>
        <pattern id={grid} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="400" height="330" fill={`url(#${grid})`} />
      <g fill="none" stroke="rgba(255,255,255,.88)" strokeLinecap="square">
        {/* outer walls with the window (top) and the entrance (bottom right) left open */}
        <path d="M70 40H40V250H300M340 250H360V40H150" strokeWidth="6" />
        <path d="M70 37H150M70 43H150" strokeWidth="1.5" />
        <path d="M300 250A40 40 0 0 1 340 210" strokeWidth="1" strokeDasharray="3 3" />
        {after ? (
          <path d="M200 46V244" strokeWidth="2" strokeDasharray="6 6" stroke="var(--ss-on-media, #fff)" />
        ) : (
          <>
            {/* glazed screen on the old partition line, door kept */}
            <g stroke="var(--ss-on-media, #fff)">
              <path d="M197 40V190M203 40V190" strokeWidth="1.5" />
              <path d="M197 76H203M197 114H203M197 152H203" strokeWidth="1.5" />
            </g>
            <path d="M200 230V250" strokeWidth="5" />
            <path d="M200 190A40 40 0 0 0 160 230" strokeWidth="1" strokeDasharray="3 3" />
          </>
        )}
        {/* counters along the left wall */}
        <rect x="46" y="70" width="28" height="150" strokeWidth="1.5" />
        {after ? (
          <rect x="96" y="96" width="44" height="112" strokeWidth="2" stroke="var(--ss-on-media, #fff)" />
        ) : (
          <rect x="112" y="132" width="44" height="44" strokeWidth="1.5" />
        )}
        <rect x="262" y="196" width="80" height="30" strokeWidth="1.5" />
        <rect x="282" y="120" width="40" height="40" rx="20" strokeWidth="1.5" />
      </g>
      <g fill="rgba(255,255,255,.62)" fontFamily="var(--ev-font-readout, sans-serif)" fontSize="12" fontWeight="700" letterSpacing="2">
        {after ? (
          <text x="200" y="26" textAnchor="middle">{labels.open}</text>
        ) : (
          <>
            <text x="120" y="26" textAnchor="middle">{labels.kitchen}</text>
            <text x="280" y="26" textAnchor="middle">{labels.living}</text>
          </>
        )}
      </g>
    </svg>
  );
}

export function buildSelectorStageConfig(locale: Locale): SelectorStageConfig {
  const fr = locale === "fr";
  const planLabels = fr
    ? { kitchen: "CUISINE", living: "SÉJOUR", open: "CUISINE · SÉJOUR" }
    : { kitchen: "KITCHEN", living: "LIVING", open: "KITCHEN · LIVING" };

  return {
    locale,
    copy: COPY[locale],
    chapters: {
      finishes: {
        heading: fr ? ["Une pièce.", <>Quatre <em>teintes.</em></>] : ["One room.", <>Four <em>shades.</em></>],
        body: fr
          ? "Nos peintures à la chaux changent la lumière d'une pièce sans toucher au reste. Choisissez une teinte : le mur change, le décor reste."
          : "Our lime paints change the light in a room without touching anything else. Pick a shade: the wall changes, the room stays.",
        label: fr ? "Choisir une teinte" : "Choose a shade",
        note: fr ? "Rendus illustratifs · teintes indicatives" : "Illustrative renders · shades indicative",
        options: [
          {
            id: "chalk",
            label: fr ? "Craie" : "Chalk",
            caption: fr ? "Chaux craie · mat minéral" : "Chalk lime · mineral matt",
            detail: fr ? "Un blanc minéral qui garde la chaleur du jour : la pièce paraît plus grande, la lumière plus douce." : "A mineral white that keeps the warmth of daylight: the room feels larger, the light softer.",
            media: { src: roomChalk, alt: fr ? "Séjour au mur blanc craie, banc en chêne et vase en grès" : "Living room with a chalk-white wall, oak bench and stoneware vase" },
          },
          {
            id: "clay",
            label: fr ? "Argile" : "Clay",
            caption: fr ? "Chaux argile · terre cuite" : "Clay lime · terracotta",
            detail: fr ? "Une terre cuite profonde qui réchauffe le bois et fait vibrer la lumière rasante du soir." : "A deep terracotta that warms the oak and makes low evening light glow.",
            media: { src: roomClay, alt: fr ? "Le même séjour, mur peint en argile terre cuite" : "The same living room, wall painted in terracotta clay" },
          },
          {
            id: "sage",
            label: fr ? "Sauge" : "Sage",
            caption: fr ? "Chaux sauge · vert gris" : "Sage lime · grey green",
            detail: fr ? "Un vert gris calme, presque neutre, qui laisse le mobilier parler en premier." : "A calm grey green, almost neutral, that lets the furniture speak first.",
            media: { src: roomSage, alt: fr ? "Le même séjour, mur peint en vert sauge" : "The same living room, wall painted sage green" },
          },
          {
            id: "ink",
            label: fr ? "Encre" : "Ink",
            caption: fr ? "Chaux encre · bleu nuit" : "Ink lime · night blue",
            detail: fr ? "Un bleu nuit dense : la pièce se resserre, les objets clairs deviennent le sujet." : "A dense night blue: the room draws in and pale objects become the subject.",
            media: { src: roomInk, alt: fr ? "Le même séjour, mur peint en bleu encre" : "The same living room, wall painted ink blue" },
          },
        ],
      },
      renovation: {
        heading: fr ? ["Même cuisine.", "Autre maison."] : ["Same kitchen.", "Another house."],
        body: fr
          ? "Une cuisine des années 1980, rouverte sur sa fenêtre d'origine. Rien n'a bougé : ni la fenêtre, ni la porte, ni le cadre."
          : "A 1980s kitchen, reopened onto its original window. Nothing moved: not the window, not the door, not the frame.",
        label: fr ? "Comparer l'état de la cuisine" : "Compare the kitchen",
        note: fr ? "Cas fictif · images illustratives" : "Fictional case · illustrative images",
        states: [
          {
            id: "before",
            label: fr ? "Avant" : "Before",
            caption: fr ? "État existant" : "As found",
            detail: fr ? "Mélaminé, carrelage blanc, néon : la pièce tournait le dos à sa fenêtre." : "Laminate, white tiles, a strip light: the room turned its back on the window.",
            media: { src: kitchenBefore, alt: fr ? "Cuisine avant travaux : placards beiges brillants, carrelage blanc, petite table" : "Kitchen before works: glossy beige cupboards, white tiles, a small table" },
          },
          {
            id: "after",
            label: fr ? "Après" : "After",
            caption: fr ? "Livraison · îlot en travertin" : "Handover · travertine island",
            detail: fr ? "Chêne clair, travertin et enduit à la chaux : la fenêtre redevient le sujet de la pièce." : "Pale oak, travertine and lime plaster: the window is the subject of the room again.",
            media: { src: kitchenAfter, alt: fr ? "Cuisine après travaux : îlot en travertin, façades en chêne clair, murs à la chaux" : "Kitchen after works: travertine island, pale oak fronts, lime-plaster walls" },
          },
        ],
      },
      plans: {
        heading: fr ? ["Deux plans.", "Une décision."] : ["Two plans.", "One decision."],
        body: fr
          ? "Deux propositions pour la même cuisine, à lire ensemble : garder deux pièces sous la même lumière, ou n'en faire qu'une."
          : "Two proposals for the same kitchen, read together: keep two rooms under one light, or make them one.",
        label: fr ? "Choisir une proposition" : "Choose a proposal",
        note: fr ? "Plans illustratifs" : "Illustrative plans",
        states: [
          {
            id: "glass",
            label: fr ? "Verrière" : "Glazed screen",
            caption: fr ? "Deux pièces, une lumière" : "Two rooms, one light",
            detail: fr ? "La cloison devient une verrière : la cuisine reste fermée, le séjour reçoit le jour de la fenêtre." : "The partition becomes a glazed screen: the kitchen stays closed, the living room gets the window's daylight.",
            render: <PlanDrawing variant="glass" labels={planLabels} />,
          },
          {
            id: "open",
            label: fr ? "Ouverte" : "Open plan",
            caption: fr ? "Une seule pièce" : "One room",
            detail: fr ? "La cloison tombe, l'îlot prend l'axe de la fenêtre : cuisine et séjour ne font plus qu'un." : "The partition comes down and the island takes the window's axis: kitchen and living room become one.",
            render: <PlanDrawing variant="open" labels={planLabels} />,
          },
        ],
      },
      atlas: {
        heading: fr ? ["Une maison.", "Plusieurs cadres."] : ["One house.", "Many frames."],
        body: fr
          ? "La même matière d'une pièce à l'autre : chaux, chêne clair, travertin. Choisissez un cadre."
          : "The same materials from room to room: lime, pale oak, travertine. Pick a frame.",
        label: fr ? "Choisir une vue du chantier" : "Choose a view of the project",
        note: fr ? "Cas fictif · images illustratives" : "Fictional case · illustrative images",
        items: [
          { id: "kitchen", label: fr ? "Cuisine" : "Kitchen", note: fr ? "Îlot en travertin" : "Travertine island", media: { src: kitchenAfter, alt: fr ? "Cuisine rénovée, îlot en travertin" : "Renovated kitchen, travertine island" } },
          { id: "detail", label: fr ? "Détail" : "Detail", note: fr ? "Poignée en laiton brossé" : "Brushed brass pull", media: { src: atlasDetail, alt: fr ? "Angle d'îlot en travertin et façade en chêne avec poignée en laiton" : "Travertine island corner and oak front with a brass pull" } },
          { id: "stair", label: fr ? "Escalier" : "Stair", note: fr ? "Enduit courbe, marches en chêne" : "Curved plaster, oak treads", media: { src: atlasStair, alt: fr ? "Escalier courbe enduit à la chaux, marches en chêne, main courante en laiton" : "Curved lime-plaster stair, oak treads, brass handrail" } },
          { id: "bath", label: fr ? "Salle d'eau" : "Bathroom", note: fr ? "Vasque en travertin" : "Travertine basin", media: { src: atlasBath, alt: fr ? "Salle d'eau, vasque en travertin, miroir rond en laiton" : "Bathroom, travertine basin, round brass mirror" } },
        ],
      },
    },
  };
}
