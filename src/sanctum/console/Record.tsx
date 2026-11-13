/* The record as a knotted cord: each sealed change is a knot, newest at the
   top. A past knot can be foreseen on the eye, then restored (a new knot). */

import { useEffect } from "react";
import { useSanctum, type SanctumStore } from "../data";
import { SurfaceFill } from "../motion";
import type { RecordEntry } from "../model/types";
import { knotKind, whenInWords, type KnotKind } from "./voice";

const KNOT_WORD: Record<KnotKind, string> = {
  raise: "Raised",
  cord: "Bound",
  draw: "Drawn back",
  words: "Rewritten",
  vision: "A vision",
  order: "Ordered",
  sight: "The sight",
  reading: "A reading",
  turn: "The turn",
  bind: "Bound into the ring",
  restore: "Restored",
  canon: "The canon",
};

export function Record({ store }: { store: SanctumStore }) {
  const record = useSanctum(store, (s) => s.record);
  const restoring = useSanctum(store, (s) => s.draft.restoring);
  const version = useSanctum(store, (s) => s.state?.meta.version ?? 0);

  useEffect(() => {
    if (!record) void store.loadRecord();
  }, [record, version]);

  if (!record) return <p className="sx-small" role="status">The record is being unrolled.</p>;
  const pointed = (e: RecordEntry) => record.find((x) => x.version === e.restoredFrom);

  return (
    <ol className="sanctum-console__record" aria-label="The record">
      {record.map((e, i) => {
        const kind = knotKind(e.opNames, Boolean(e.restoredFrom), e.trusted);
        const current = i === 0;
        const foreseen = restoring === e.version;
        return (
          <li key={e.version} className={`sanctum-console__knot is-${kind}${current ? " is-current" : ""}${foreseen ? " is-foreseen" : ""}`}>
            <Knot kind={kind} label={KNOT_WORD[kind]} />
            <div className="sanctum-console__knot-words">
              <span className="sanctum-console__knot-summary">{e.summary}</span>
              <span className="sx-small">
                {current ? `The map as it stands, sealed ${lower(whenInWords(e.at))}` : whenInWords(e.at)}
                {e.restoredFrom && pointed(e) ? `. A return to the knot tied ${lower(whenInWords(pointed(e)!.at))}` : ""}
              </span>
            </div>
            {!current && (
              <button
                type="button"
                className={`sx-chip sanctum-console__foresee${foreseen ? " is-on" : ""}`}
                data-jelly=""
                aria-pressed={foreseen}
                onClick={() => (foreseen ? store.closeDraft() : void store.restore(e.version))}
              >
                {foreseen ? "Stop foreseeing" : "Foresee"}
                <SurfaceFill on={foreseen} lit="var(--sx-ivory)" litInk="var(--sx-ink)">{foreseen ? "Stop foreseeing" : "Foresee"}</SurfaceFill>
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** One knot shape per family of change, tied on the record's cord. */
function Knot({ kind, label }: { kind: KnotKind; label: string }) {
  const paths: Record<KnotKind, string> = {
    raise: "M5 13c0-4 3-7 6-7s6 3 6 7-3 5-6 5-6-1-6-5zM11 6v-3",
    cord: "M11 3c-3 0-5 2-5 4.5S8 12 11 12s5 2 5 4.5S14 21 11 21s-5-2-5-4.5S8 12 11 12s5-2 5-4.5S14 3 11 3z",
    draw: "M7 18c-2-2-2-6 0-9s7-4 9-1-1 7-4 8",
    words: "M6 9c0-3 2-5 5-5s5 2 5 5-2 5-5 5-5-2-5-5zM11 14v6M8 18h6",
    vision: "M11 3l7 9-7 9-7-9z",
    order: "M7 8a4 4 0 108 0 4 4 0 10-8 0M7 17a4 4 0 108 0 4 4 0 10-8 0",
    sight: "M4 12a7 7 0 1014 0 7 7 0 10-14 0",
    reading: "M4 7a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M13 7a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0M8.5 16a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0",
    turn: "M5 6c4 0 8 12 12 12M5 18c4 0 8-12 12-12",
    bind: "M4 12c0-3 3-5 7-5s7 2 7 5-3 5-7 5-7-2-7-5zM11 7v10",
    restore: "M16 8a6 6 0 10 1 6M16 3v5h-5",
    canon: "M5 12a6 6 0 1012 0 6 6 0 10-12 0z",
  };
  return (
    <svg className="sanctum-console__knot-mark" width="22" height="24" viewBox="0 0 22 24" role="img" aria-label={label}>
      <path d={paths[kind]} fill={kind === "canon" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
