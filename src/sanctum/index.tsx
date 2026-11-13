/* /sanctum route entry. Only the gate and the data layer live in this
   chunk; the sight and the console (every renderer) load after entry. */

import { Suspense, lazy, useEffect, useState } from "react";
import Gate from "./Gate";
import { createSanctumStore, useSanctum } from "./data";

const Sight = lazy(() => import("./sight"));
const Console = lazy(() => import("./console"));

const GATHERING = "The sight is gathering.";

/* A summons arrives in the fragment (never sent to any server or log): when
   this chunk loads, or later into an open tab (hashchange). It is wiped from
   the address at once; this tab alone keeps it until it is sealed or refused,
   so a reload does not lose it. */
const SUMMONS_KEY = "sanctum-summons";
function summonsFromFragment(): string | null {
  const m = /(?:^#|&)setup=([A-Za-z0-9_-]{16,128})(?:&|$)/.exec(window.location.hash);
  if (!m) return null;
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  try {
    window.sessionStorage.setItem(SUMMONS_KEY, m[1]);
  } catch {
    /* storage refused: the summons lives in this page only */
  }
  return m[1];
}
function takeSummons(): string | null {
  const fromFragment = summonsFromFragment();
  if (fromFragment) return fromFragment;
  try {
    return window.sessionStorage.getItem(SUMMONS_KEY);
  } catch {
    return null;
  }
}
function forgetSummons() {
  SUMMONS = null;
  try {
    window.sessionStorage.removeItem(SUMMONS_KEY);
  } catch {
    /* nothing kept */
  }
}
let SUMMONS = takeSummons();

export default function SanctumRoute() {
  const [store] = useState(createSanctumStore);
  const status = useSanctum(store, (s) => s.status);
  const [summons, setSummons] = useState<string | null>(SUMMONS);

  useEffect(() => {
    if (!summons) void store.check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  /* A summons pasted into a tab already here. */
  useEffect(() => {
    const onHash = () => {
      const token = summonsFromFragment();
      if (!token) return;
      SUMMONS = token;
      setSummons(token);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = "Sanctum";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="sanctum-root" lang="en">
      <meta name="robots" content="noindex,nofollow" />
      {summons && (
        <Gate
          store={store}
          summons={summons}
          onSealed={() => {
            forgetSummons();
            setSummons(null);
          }}
          onSpent={forgetSummons}
        />
      )}
      {!summons && status === "gate" && <Gate store={store} />}
      {!summons && status === "gathering" && <p className="sanctum-gathering" role="status">{GATHERING}</p>}
      {!summons && status === "open" && (
        <Suspense fallback={<p className="sanctum-gathering" role="status">{GATHERING}</p>}>
          <Sight
            store={store}
            console={
              <Suspense fallback={null}>
                <Console store={store} />
              </Suspense>
            }
          />
        </Suspense>
      )}
    </div>
  );
}
