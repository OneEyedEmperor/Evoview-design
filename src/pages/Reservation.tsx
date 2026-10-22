import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Reservation } from "../../components/reservation/src";
import { buildReservationConfig, type Locale } from "../../components/reservation/src/reservation.config";
import { buildTchinReservationConfig } from "../../components/reservation/examples/tchin.config";

/* Showcase of the reservation package. "Tchin Tchin" reproduces the live
   client page around the component (its --primary accent, page header);
   "Référence" is the reference config. Submissions are mocked. */

type Variant = "tchin" | "reference";

const HEAD: Record<Variant, Record<Locale, { kicker: string; title: string; subtitle: string }>> = {
  tchin: {
    fr: { kicker: "Reservation", title: "Envoyez une Demande", subtitle: "Envoyez votre demande et le propriétaire vous contactera pour confirmer." },
    en: { kicker: "Reservation", title: "Send a Request", subtitle: "Send your request and the owner will contact you to confirm." },
  },
  reference: {
    fr: { kicker: "Réservation", title: "Réservez votre table", subtitle: "Choisissez votre moment, nous vous recontactons pour confirmer." },
    en: { kicker: "Reservation", title: "Book your table", subtitle: "Pick your moment, we will contact you to confirm." },
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
  const [variant, setVariant] = useState<Variant>("tchin");
  const [locale, setLocale] = useState<Locale>("fr");
  const config = useMemo(() => (variant === "tchin" ? buildTchinReservationConfig(locale) : buildReservationConfig(locale)), [variant, locale]);
  const head = HEAD[variant][locale];
  const tchin = variant === "tchin";

  return (
    <div
      data-variant={variant}
      className="relative min-h-screen overflow-hidden px-6 py-24 text-white"
      style={{
        background: tchin ? "oklch(0.115 0.006 75)" : "#0c0c10",
        fontFamily: tchin ? "Inter, sans-serif" : "Montserrat, sans-serif",
        ["--foreground" as string]: "oklch(0.98 0 0)",
        ["--muted-foreground" as string]: tchin ? "oklch(0.60 0 0)" : "#a3a3a3",
        ["--font-heading" as string]: "'Overused Grotesk', Inter, sans-serif",
        // The host's accent tokens; the component reads them.
        ["--primary" as string]: tchin ? "oklch(0.88 0.18 90)" : "#818cf8",
        ["--primary-foreground" as string]: tchin ? "oklch(0.07 0 0)" : "#101011",
      }}
    >
      {!tchin && (
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(63,81,181,.35), transparent 70%), radial-gradient(40% 40% at 80% 90%, rgba(63,81,181,.18), transparent 70%)" }} />
      )}

      <div className="fixed left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2">
        <Toggle value={variant} options={[["tchin", "Tchin Tchin"], ["reference", "Référence"]]} onChange={setVariant} />
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
