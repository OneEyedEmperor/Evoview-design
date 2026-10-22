import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Reservation } from "../../components/reservation/src";
import { buildReservationConfig, type Locale } from "../../components/reservation/src/reservation.config";
import AccentPicker, { inkFor } from "./AccentPicker";

/* Showcase of the reservation package: the reference config on a neutral
   client page, with a live accent picker standing in for the host's
   --primary token. Submissions are mocked. */

const HEAD: Record<Locale, { kicker: string; language: string }> = {
  fr: { kicker: "Composant dynamique", language: "Langue" },
  en: { kicker: "Dynamic component", language: "Language" },
};

const DEFAULT_ACCENT = "#e9e6df";

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
  const [locale, setLocale] = useState<Locale>("fr");
  const config = useMemo(() => buildReservationConfig(locale), [locale]);
  const head = HEAD[locale];
  const [accentId, setAccentId] = useState("default");
  const [custom, setCustom] = useState("#7c3aed");
  const copy = PICKER_COPY[locale];
  const swatches = useMemo(
    () => [
      { id: "default", color: DEFAULT_ACCENT, label: copy.default },
      ...SWATCHES.map((s) => ({ id: s.id, color: s.color, label: s.label[locale] })),
    ],
    [locale, copy],
  );
  const accent = accentId === "custom" ? custom : (swatches.find((s) => s.id === accentId) ?? swatches[0]).color;
  const ink = useMemo(() => inkFor(accent), [accent]);

  return (
    <div
      className="showcase-accent relative min-h-screen overflow-hidden px-6 pb-24 pt-20 text-white"
      style={{
        background: "#0b0b0c",
        fontFamily: "Inter, sans-serif",
        ["--foreground" as string]: "oklch(0.98 0 0)",
        ["--muted-foreground" as string]: "oklch(0.60 0 0)",
        ["--font-heading" as string]: "'Overused Grotesk', Inter, sans-serif",
        // The host's accent tokens (--primary / --primary-foreground, mapped in accent-picker.css); the component reads them.
        ["--showcase-accent" as string]: accent,
        ["--showcase-ink" as string]: ink,
      }}
    >



      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em]" style={{ color: "var(--primary)" }}>{head.kicker}</p>
          <h1
            className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.035em] md:text-6xl"
            style={{ fontFamily: "'Overused Grotesk', Inter, sans-serif" }}
          >
            Evoview <span style={{ color: "var(--primary)" }}>Reservation</span> System
          </h1>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">{head.language}</span>
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
        </div>
        <Reservation key={locale} config={config} />
        <p className="mt-16 text-center">
          <Link to="/" className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100">← navbar</Link>
        </p>
      </div>
    </div>
  );
}
