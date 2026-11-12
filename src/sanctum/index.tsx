/* /sanctum route entry. Only the gate and the data layer live in this
   chunk; the sight and the console (every renderer) load after entry. */

import { Suspense, lazy, useEffect, useState } from "react";
import Gate from "./Gate";
import { createSanctumStore, useSanctum } from "./data";

const Sight = lazy(() => import("./sight"));
const Console = lazy(() => import("./console"));

const GATHERING = "The sight is gathering.";

export default function SanctumRoute() {
  const [store] = useState(createSanctumStore);
  const status = useSanctum(store, (s) => s.status);

  useEffect(() => {
    void store.check();
  }, [store]);

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
      {status === "gate" && <Gate store={store} />}
      {status === "gathering" && <p className="sanctum-gathering" role="status">{GATHERING}</p>}
      {status === "open" && (
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
