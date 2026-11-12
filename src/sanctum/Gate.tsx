import { useEffect, useState, type FormEvent } from "react";
import type { SanctumStore } from "./data";
import "./Gate.css";

type GateState = "listening" | "weighing" | "refused" | "resting";

const WORDS: Record<GateState, string> = {
  listening: "",
  weighing: "The gate weighs the watchword.",
  refused: "The watchword is not received.",
  resting: "The gate rests. Return in a moment.",
};

/** Reveals nothing of what lies behind it. */
export default function Gate({ store }: { store: SanctumStore }) {
  const [word, setWord] = useState("");
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!word || state === "weighing" || state === "resting") return;
    setState("weighing");
    const answer = await store.enter(word);
    if (answer.entered) return;
    setWord("");
    if (answer.rest) {
      setRestUntil(Date.now() + answer.rest * 1000);
      setState("resting");
    } else setState("refused");
  }

  return (
    <main className="sanctum-gate">
      <form className="sanctum-gate__form" onSubmit={onSubmit}>
        <label className="sanctum-gate__label" htmlFor="sanctum-watchword">
          Watchword
        </label>
        <input
          id="sanctum-watchword"
          className="sanctum-gate__field"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          value={word}
          onChange={(e) => setWord(e.target.value)}
          disabled={state === "resting"}
        />
        <button className="sanctum-gate__enter" type="submit" disabled={!word || state === "weighing" || state === "resting"}>
          Enter
        </button>
        <p className="sanctum-gate__words" role="status" aria-live="polite">
          {WORDS[state]}
        </p>
      </form>
    </main>
  );
}
