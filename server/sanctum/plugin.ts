import type { Plugin } from "vite";
import { createSanctumHandler } from "./http.ts";

/** Mounts the sanctum's endpoints on the dev and preview servers. */
export function sanctum(): Plugin {
  return {
    name: "evoview-sanctum",
    configureServer(server) {
      server.middlewares.use(createSanctumHandler());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createSanctumHandler());
    },
  };
}
