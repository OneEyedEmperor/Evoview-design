import { useEffect, useState, type FormEvent } from "react";
import type { SanctumStore } from "./data";
import "./Gate.css";

type GateState = "listening" | "weighing" | "refused" | "resting" | "unequal" | "weak" | "unknown";

const WORDS: Record<GateState, string> = {
  listening: "",
  weighing: "The gate weighs the watchword.",
  refused: "The watchword is not received.",
  resting: "The gate rests. Return in a moment.",
  unequal: "The two do not agree.",
  weak: "A watchword needs at least twenty letters, or four words.",
  unknown: "The gate does not know this summons.",
};

/** Reveals nothing of what lies behind it. With a summons, the watchword is chosen here. */
export default function Gate({
  store,
  summons,
  onSealed,
  onSpent,
}: {
  store: SanctumStore;
  summons?: string | null;
  onSealed?: () => void;
  /** The summons was refused (unknown, used or lapsed): it is forgotten. */
  onSpent?: () => void;
}) {
  const [word, setWord] = useState("");
  const [again, setAgain] = useState("");
  const [state, setState] = useState<GateState>("listening");
  const [restUntil, setRestUntil] = useState(0);

  useEffect(() => {
    if (!restUntil) return;
    const id = window.setTimeout(() => {
      setRestUntil(0);
      setState("listening");
    }, Math.max(0, restUntil - Date.now()));
    return () => window.clearTimeout(id);
  }, [restUntil]);

  const rest = (seconds: number) => {
    setRestUntil(Date.now() + seconds * 1000);
    setState("resting");
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!word || state === "weighing" || state === "resting") return;
    if (summons) {
      if (word !== again) return setState("unequal");
      setState("weighing");
      const answer = await store.setup(summons, word);
      if (answer.entered) return onSealed?.();
      if (answer.weak) return setState("weak");
      setWord("");
      setAgain("");
      if (answer.rest) rest(answer.rest);
      else {
        setState("unknown");
        onSpent?.();
      }
      return;
    }
    setState("weighing");
    const answer = await store.enter(word);
    if (answer.entered) return;
    setWord("");
    if (answer.rest) rest(answer.rest);
    else setState("refused");
  }

  const closed = state === "weighing" || state === "resting";
  return (
    <main className="sanctum-gate">
      <form className="sanctum-gate__form" onSubmit={onSubmit}>
        <label className="sanctum-gate__label" htmlFor="sanctum-watchword">
          {summons ? "Choose the watchword" : "Watchword"}
        </label>
        <input
          id="sanctum-watchword"
          className="sanctum-gate__field"
          type="password"
          autoComplete={summons ? "new-password" : "current-password"}
          autoFocus
          required
          value={word}
          onChange={(e) => setWord(e.target.value)}
          disabled={state === "resting"}
        />
        {summons && (
          <>
            <label className="sanctum-gate__label" htmlFor="sanctum-watchword-again">
              Speak it again
            </label>
            <input
              id="sanctum-watchword-again"
              className="sanctum-gate__field"
              type="password"
              autoComplete="new-password"
              required
              value={again}
              onChange={(e) => setAgain(e.target.value)}
              disabled={state === "resting"}
            />
          </>
        )}
        <button className="sanctum-gate__enter" type="submit" disabled={!word || (Boolean(summons) && !again) || closed}>
          {summons ? "Seal the watchword" : "Enter"}
        </button>
        <p className="sanctum-gate__words" role="status" aria-live="polite">
          {WORDS[state]}
        </p>
      </form>
    </main>
  );
}
