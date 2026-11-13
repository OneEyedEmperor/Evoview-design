/* The console's voice. Every name comes from the state; the words here are
   the console's own (pure, no map content). */

import { BEYOND, LEXICON, type Element, type Id, type OpName, type SanctumState } from "../model/types";
import { numberWord, realmTitle } from "../model/rules";

/** The keeper: the element tied to the lexicon. He examines every change. */
export function keeperOf(state: SanctumState): Element | undefined {
  const tie = state.ties.find((t) => t.to === LEXICON);
  return tie ? state.elements.find((e) => e.id === tie.from) : undefined;
}

export function keeperName(state: SanctumState): string {
  return keeperOf(state)?.title ?? "The keeper";
}

export function turnerOf(state: SanctumState): Element | undefined {
  return state.elements.find((e) => e.id === state.roles.turner);
}

export const titleOf = (state: SanctumState, id: Id) => state.elements.find((e) => e.id === id)?.title ?? "";

export const realmName = (state: SanctumState, realm: Id) => (realm === BEYOND ? state.beyond.title : realmTitle(state, realm));

export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "a stone" / "an arch": the article for a kind title. */
export function aOrAn(word: string): string {
  return /^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`;
}

/** Possessive of a title: "Stone's", "Stones'". */
export function possessive(title: string): string {
  return /s$/i.test(title) ? `${title}'` : `${title}'s`;
}

const ORDINALS = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ordinal(n: number): string {
  if (n <= 20) return ORDINALS[n];
  if (n === 30) return "thirtieth";
  const tens = n < 30 ? "twenty" : "thirty";
  return `${tens}-${ORDINALS[n % 10]}`;
}

/** When a knot was tied, in words: never a timestamp. */
export function whenInWords(iso: string, now = new Date()): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(at)) / 86400000);
  const h = at.getHours();
  const part = h < 5 ? "in the night" : h < 12 ? "in the morning" : h < 18 ? "in the afternoon" : "in the evening";
  if (days === 0) return part === "in the night" ? "Tonight" : `This ${part.slice(7)}`;
  if (days === 1) return `Yesterday, ${part}`;
  if (days < 7) return `${upper(numberWord(days))} days ago`;
  const year = at.getFullYear() === now.getFullYear() ? "" : `, ${at.getFullYear()}`;
  return `The ${ordinal(at.getDate())} of ${MONTHS[at.getMonth()]}${year}`;
}

/** The family of a change, for the knot it ties in the record. */
export type KnotKind = "raise" | "cord" | "draw" | "words" | "vision" | "order" | "sight" | "reading" | "turn" | "bind" | "restore" | "canon";

export function knotKind(opNames: OpName[] | undefined, restored: boolean, trusted?: string): KnotKind {
  if (restored) return "restore";
  if (trusted) return "canon";
  const first = opNames?.[0];
  switch (first) {
    case "turn": return "turn";
    case "firstBinding": return "bind";
    case "addElement": return "raise";
    case "addThread": return "cord";
    case "removeElement":
    case "removeThread":
    case "removeReading":
    case "removeVision": return "draw";
    case "setText": return "words";
    case "addVision":
    case "assignVision":
    case "unassignVision":
    case "setVisionSubject": return "vision";
    case "reorderWithinLayer":
    case "setEmphasis": return "order";
    case "setSight": return "sight";
    case "addReading":
    case "setReadingLights": return "reading";
    default: return "canon";
  }
}
