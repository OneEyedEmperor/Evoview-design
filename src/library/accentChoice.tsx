import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { CUSTOM_SWATCH } from "./AccentPalette";

/* The reader's accent, kept across page changes (in memory, per visit).
   Stored as a colour, not a swatch id: page palettes differ (each showcase
   puts its own default first), so a pick is matched back by colour and
   falls to the custom swatch when the page has no such swatch. */

type Choice = { color: string; custom: string; isCustom: boolean };
type Ctx = { choice: Choice | null; setChoice: Dispatch<SetStateAction<Choice | null>> };

const AccentChoiceContext = createContext<Ctx>({ choice: null, setChoice: () => {} });

export function AccentChoiceProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const value = useMemo(() => ({ choice, setChoice }), [choice]);
  return <AccentChoiceContext.Provider value={value}>{children}</AccentChoiceContext.Provider>;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const DEFAULT_CUSTOM = "#7c3aed";

/** Palette state for one page: `initialId` until the reader picks, then the
    shared pick. `picked` is true once a colour was chosen on any page. */
export function useAccentChoice(swatches: { id: string; color: string }[], initialId: string) {
  const { choice, setChoice } = useContext(AccentChoiceContext);

  let accentId = initialId;
  let custom = choice?.custom ?? DEFAULT_CUSTOM;
  if (choice) {
    const match = choice.isCustom ? undefined : swatches.find((s) => same(s.color, choice.color));
    if (match) accentId = match.id;
    else {
      accentId = CUSTOM_SWATCH;
      custom = choice.color;
    }
  }
  const accent = accentId === CUSTOM_SWATCH ? custom : (swatches.find((s) => s.id === accentId) ?? swatches[0]).color;

  const onChange = useCallback(
    (id: string) => {
      // Functional: the palette's colour input calls onCustom then onChange in
      // one tick, so the custom colour must come from the pending state.
      if (id === CUSTOM_SWATCH) setChoice((prev) => ({ color: prev?.custom ?? custom, custom: prev?.custom ?? custom, isCustom: true }));
      else {
        const s = swatches.find((x) => x.id === id);
        if (s) setChoice((prev) => ({ color: s.color, custom: prev?.custom ?? custom, isCustom: false }));
      }
    },
    [swatches, custom, setChoice],
  );
  const onCustom = useCallback(
    (hex: string) => setChoice({ color: hex, custom: hex, isCustom: true }),
    [setChoice],
  );

  return { accentId, custom, accent, picked: choice !== null, onChange, onCustom };
}
