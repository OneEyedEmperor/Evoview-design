/* Placeholder for the Render builder (owner of src/sanctum/sight/**):
   replace freely. Contract: default export, receives { store }. */

import type { SanctumStore } from "../data";
import { useSanctum } from "../data";

export default function Sight({ store }: { store: SanctumStore }) {
  const state = useSanctum(store, (s) => s.state);
  if (!state) return null;
  const realms = [...state.layers].sort((a, b) => a.order - b.order);
  return (
    <main style={{ minHeight: "100svh", padding: 24, background: "#07080b", color: "#e9e6df" }}>
      {realms.map((layer) => (
        <section key={layer.id} style={{ marginBottom: 24 }}>
          <h2 style={{ color: layer.colour.hex }}>{layer.title}</h2>
          {state.elements
            .filter((e) => e.realm === layer.id)
            .sort((a, b) => a.order - b.order)
            .map((e) => (
              <p key={e.id}>{e.title}</p>
            ))}
        </section>
      ))}
      <button type="button" onClick={() => void store.leave()}>
        Leave
      </button>
    </main>
  );
}
