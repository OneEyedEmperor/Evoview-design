import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../../../components/navbar/src";
import { navbarConfig } from "../../../components/navbar/examples/evoview.config";

/* The one-page example: tall sections whose ids and tones match the config,
   so the bar can be watched re-toning and recolouring its pupil while
   scrolling. Tray selections are echoed in the readout at the bottom. */

const SECTIONS: { id: string; title: string; dark: boolean; accent: string }[] = [
  { id: "hero", title: "Hero", dark: true, accent: "#c84a4a" },
  { id: "processus", title: "Processus", dark: false, accent: "#151515" },
  { id: "services", title: "Services", dark: false, accent: "#3f51b5" },
  { id: "intro", title: "Méthode", dark: true, accent: "#ffffff" },
  { id: "partners", title: "Portfolio", dark: false, accent: "#a94f16" },
  { id: "contact", title: "Contact", dark: true, accent: "#3f51b5" },
];

export default function Evoview() {
  const [last, setLast] = useState<string>("—");

  useEffect(() => {
    const onSelect = (event: Event) => setLast(JSON.stringify((event as CustomEvent).detail));
    window.addEventListener("navbar:select", onSelect);
    return () => window.removeEventListener("navbar:select", onSelect);
  }, []);

  return (
    <>
      <Navbar config={navbarConfig} />
      <main>
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            data-nav-tone={section.dark ? "dark" : undefined}
            className="flex min-h-screen flex-col items-center justify-center gap-4 px-6"
            style={{ background: section.dark ? "#101011" : "#efefef", color: section.dark ? "#fff" : "#151515" }}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: section.accent, boxShadow: section.accent === "#ffffff" ? "0 0 0 1px rgba(0,0,0,.2)" : undefined }} />
            <h2 className="text-4xl font-bold tracking-tight">{section.title}</h2>
            <p className="text-sm opacity-60">
              #{section.id} · {section.dark ? "data-nav-tone=\"dark\"" : "light"}
            </p>
          </section>
        ))}
      </main>
      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full bg-black/80 px-4 py-2 text-xs text-white backdrop-blur">
        <span>last navbar:select → {last}</span>
        <Link to="/navbar" className="opacity-60 hover:opacity-100">← library · navbar</Link>
      </div>
    </>
  );
}
