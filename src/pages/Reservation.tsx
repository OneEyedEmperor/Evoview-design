import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Reservation } from "../../components/reservation/src";
import { buildReservationConfig, type Locale } from "../../components/reservation/src/reservation.config";
import { buildTchinReservationConfig } from "../../components/reservation/examples/tchin.config";

/* Showcase of the reservation package. "Tchin Tchin" reproduces the live
   client page around the component (its --primary accent, page header);
   "Référence" is the same page, neutral: reference config, off-white accent.
   Submissions are mocked. */

type Variant = "tchin" | "reference";

const HEAD: Record<Variant, Record<Locale, { kicker: string; title: string; subtitle: string }>> = {
  tchin: {
    fr: { kicker: "Reservation", title: "Envoyez une Demande", subtitle: "Envoyez votre demande et le propriétaire vous contactera pour confirmer." },
    en: { kicker: "Reservation", title: "Send a Request", subtitle: "Send your request and the owner will contact you to confirm." },
  },
  reference: {
    fr: { kicker: "Réservation", title: "Envoyez une demande", subtitle: "Envoyez votre demande et l'établissement vous contactera pour confirmer." },
    en: { kicker: "Reservation", title: "Send a request", subtitle: "Send your request and the venue will contact you to confirm." },
  },
};

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-full border border-white/15 bg-black/50 p-1 backdrop-blur">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition ${value === key ? "bg-white text-black" : "text-white/70 hover:text-white"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ReservationShowcase() {
  const [variant, setVariant] = useState<Variant>("reference");
  const [locale, setLocale] = useState<Locale>("fr");
  const config = useMemo(() => (variant === "tchin" ? buildTchinReservationConfig(locale) : buildReservationConfig(locale)), [variant, locale]);
  const head = HEAD[variant][locale];
  const tchin = variant === "tchin";

  return (
    <div
      data-variant={variant}
      className="relative min-h-screen overflow-hidden px-6 py-24 text-white"
      style={{
        background: tchin ? "oklch(0.115 0.006 75)" : "#0b0b0c",
        fontFamily: "Inter, sans-serif",
        ["--foreground" as string]: "oklch(0.98 0 0)",
        ["--muted-foreground" as string]: "oklch(0.60 0 0)",
        ["--font-heading" as string]: "'Overused Grotesk', Inter, sans-serif",
        // The host's accent tokens; the component reads them.
        // Neutral reference: an off-white accent standing in for the client's colour.
        ["--primary" as string]: tchin ? "oklch(0.88 0.18 90)" : "#e9e6df",
        ["--primary-foreground" as string]: tchin ? "oklch(0.07 0 0)" : "#101011",
      }}
    >

      <div className="fixed left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2">
        <Toggle value={variant} options={[["reference", "Référence"], ["tchin", "Tchin Tchin"]]} onChange={setVariant} />
        <Toggle value={locale} options={[["fr", "FR"], ["en", "EN"]]} onChange={setLocale} />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl pt-16">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>{head.kicker}</p>
          <h1 className="mb-3 text-3xl font-bold md:text-4xl" style={{ fontFamily: "'Overused Grotesk', Inter, sans-serif" }}>{head.title}</h1>
          <p className="mx-auto max-w-lg text-white/70">{head.subtitle}</p>
        </div>
        <Reservation key={`${variant}-${locale}`} config={config} />
        <p className="mt-16 text-center">
          <Link to="/" className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100">← navbar</Link>
        </p>
      </div>
    </div>
  );
}
