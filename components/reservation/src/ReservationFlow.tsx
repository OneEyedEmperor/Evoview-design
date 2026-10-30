import { useState } from "react";
import { ArrowLeft, cn, EvoviewMark, EVOVIEW_URL } from "../foundation";
import { buildControlsConfig, ChipGroup, ControlsProvider, GhostAction, PrimaryPlate, SegmentedProgress, Switch, UnderlineField } from "../controls";
import type { ReservationFlowConfig, ReservationFlowRequest } from "./types";
import "./reservation-flow.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The short booking form: a few chip questions, then an e-mail, on a paper
 * chassis in the shared controls language (segmented progress with captions,
 * large chips, underline field, white → ink plate). One question per step;
 * answered steps can be revisited from the progress.
 */
export function ReservationFlow({ config }: { config: ReservationFlowConfig }) {
  const { copy, steps, contact, tone = "paper", attribution = true } = config;
  const count = steps.length;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [sms, setSms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = step >= count;
  const current = done ? null : steps[step];
  const emailValid = EMAIL_RE.test(email.trim());
  const canContinue = current?.kind === "choice" ? answers[current.id] !== undefined : emailValid;
  const href = typeof attribution === "object" && attribution.href !== undefined ? attribution.href : EVOVIEW_URL;

  const send = async () => {
    const request: ReservationFlowRequest = { answers, email: email.trim(), ...(contact?.sms ? { sms } : {}) };
    setBusy(true);
    setError(null);
    try {
      const result = await config.submit(request);
      config.onResult?.(result, request);
      if (result.ok) setStep(count);
      else setError(result.fieldErrors?.email ?? result.error ?? copy.errorGeneric);
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setEmail("");
    setEmailTouched(false);
    setSms(false);
    setError(null);
  };

  return (
    <ControlsProvider config={buildControlsConfig(config.locale)}>
      <div className={cn("ev-root", `ev-tone-${tone}`, "evrf", config.className)}>
        {attribution !== false && (
          <div className="evrf__strip">
            <EvoviewMark label={copy.signatureAriaLabel} href={href} />
          </div>
        )}
        <SegmentedProgress
          label={copy.label}
          count={count}
          current={step}
          labels={steps.map((s) => s.short)}
          captions
          onSelect={setStep}
          canSelect={(i) => !done && !busy && i < step}
        />
        <div className="evrf__step" key={step}>
          {current?.kind === "choice" && (
            <>
              <h3 className="ev-t-question">{current.question}</h3>
              <ChipGroup
                size="lg"
                label={current.question}
                value={answers[current.id] ?? null}
                onChange={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))}
                options={current.options}
              />
            </>
          )}
          {current?.kind === "contact" && (
            <>
              <h3 className="ev-t-question">{current.question}</h3>
              <div className="evrf__contact">
                <UnderlineField
                  label={copy.emailLabel}
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => (setEmail(e.target.value), setError(null))}
                  onBlur={() => setEmailTouched(true)}
                  error={error ?? (emailTouched && email.trim() && !emailValid ? copy.errorInvalidEmail : undefined)}
                />
                {contact?.sms && <Switch checked={sms} onCheckedChange={setSms} label={contact.sms.label} description={contact.sms.description} />}
              </div>
            </>
          )}
          {done && (
            <div role="status">
              <h3 className="ev-t-question">{copy.doneTitle}</h3>
              <p className="ev-t-body evrf__body">{copy.doneBody}</p>
            </div>
          )}
        </div>
        <div className="evrf__actions">
          {done ? (
            <GhostAction icon={<ArrowLeft />} onClick={restart}>{copy.again}</GhostAction>
          ) : (
            <>
              <GhostAction icon={<ArrowLeft />} disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>{copy.back}</GhostAction>
              <PrimaryPlate disabled={!canContinue} busy={busy} onClick={() => (current?.kind === "contact" ? void send() : setStep((s) => s + 1))}>
                {current?.kind === "contact" ? copy.send : copy.next}
              </PrimaryPlate>
            </>
          )}
        </div>
      </div>
    </ControlsProvider>
  );
}
