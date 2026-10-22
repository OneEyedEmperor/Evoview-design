import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Reservation } from "../../components/reservation/src";
import { buildReservationConfig, type Locale } from "../../components/reservation/src/reservation.config";
import { buildTchinReservationConfig } from "../../components/reservation/examples/tchin.config";
import AccentPicker, { inkFor } from "./AccentPicker";

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

const DEFAULT_ACCENT: Record<Variant, string> = { reference: "#e9e6df", tchin: "oklch(0.88 0.18 90)" };

const SWATCHES: { id: string; color: string; label: Record<Locale, string> }[] = [
  { id: "indigo", color: "#818cf8", label: { fr: "Indigo Evoview", en: "Evoview indigo" } },
  { id: "chili", color: "#d83a2c", label: { fr: "Rouge piment", en: "Chili red" } },
  { id: "orange", color: "#fb923c", label: { fr: "Orange", en: "Orange" } },
  { id: "emerald", color: "#34d399", label: { fr: "Émeraude", en: "Emerald" } },
  { id: "sky", color: "#38bdf8", label: { fr: "Bleu ciel", en: "Sky blue" } },
  { id: "rose", color: "#fb7185", label: { fr: "Rose", en: "Rose" } },
];

const PICKER_COPY: Record<Locale, { strong: string; rest: string; custom: string; default: string }> = {
  fr: { strong: "Accent client", rest: "le composant s'adapte à chaque marque", custom: "Couleur personnalisée", default: "Par défaut" },
  en: { strong: "Client accent", rest: "the component adapts to every brand", custom: "Custom colour", default: "Default" },
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
  const [accentId, setAccentId] = useState("default");
  const [custom, setCustom] = useState("#7c3aed");
  const copy = PICKER_COPY[locale];
  const swatches = useMemo(
    () => [
      { id: "default", color: DEFAULT_ACCENT[variant], label: `${copy.default} — ${tchin ? "Tchin Tchin" : "Référence"}` },
      ...SWATCHES.map((s) => ({ id: s.id, color: s.color, label: s.label[locale] })),
    ],
    [variant, locale, copy, tchin],
  );
  const accent = accentId === "custom" ? custom : (swatches.find((s) => s.id === accentId) ?? swatches[0]).color;
  const ink = useMemo(() => inkFor(accent), [accent]);

  return (
    <div
      data-variant={variant}
      className="showcase-accent relative min-h-screen overflow-hidden px-6 pb-40 pt-24 text-white"
      style={{
        background: tchin ? "oklch(0.115 0.006 75)" : "#0b0b0c",
        fontFamily: "Inter, sans-serif",
        ["--foreground" as string]: "oklch(0.98 0 0)",
        ["--muted-foreground" as string]: "oklch(0.60 0 0)",
        ["--font-heading" as string]: "'Overused Grotesk', Inter, sans-serif",
        // The host's accent tokens (--primary / --primary-foreground, mapped in accent-picker.css); the component reads them.
        ["--showcase-accent" as string]: accent,
        ["--showcase-ink" as string]: ink,
      }}
    >

      <div className="fixed left-1/2 top-4 z-20 flex -translate-x-1/2 gap-2">
        <Toggle
          value={variant}
          options={[["reference", "Référence"], ["tchin", "Tchin Tchin"]]}
          onChange={(v) => {
            setVariant(v);
            setAccentId("default");
          }}
        />
        <Toggle value={locale} options={[["fr", "FR"], ["en", "EN"]]} onChange={setLocale} />
      </div>

      <AccentPicker
        swatches={swatches}
        value={accentId}
        custom={custom}
        caption={{ strong: copy.strong, rest: copy.rest }}
        customLabel={copy.custom}
        onChange={setAccentId}
        onCustom={setCustom}
      />

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
