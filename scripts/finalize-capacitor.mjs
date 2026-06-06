// Post-process the TanStack Start SPA build into a Capacitor-ready bundle.
//
// TanStack Start's SPA prerender writes the static shell to
// `dist/client/_shell.html`. Capacitor needs `index.html` at the root of
// `webDir`, so we:
//   1. Rename `dist/client/_shell.html` -> `dist/client/index.html`.
//   2. Drop the server bundle in `dist/server/` (not used on device).
//
// `capacitor.config.ts` points `webDir` at `dist/client`.

import { existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "dist");
const shell = resolve(root, "client/_shell.html");
const index = resolve(root, "client/index.html");
const serverDir = resolve(root, "server");

if (!existsSync(shell)) {
  console.error(
    `[finalize-capacitor] Expected SPA shell at ${shell} but it does not exist.\n` +
      "Did the build run with BUILD_TARGET=capacitor?",
  );
  process.exit(1);
}

renameSync(shell, index);
console.log(`[finalize-capacitor] ${shell} -> ${index}`);

if (existsSync(serverDir)) {
  rmSync(serverDir, { recursive: true, force: true });
  console.log(`[finalize-capacitor] removed ${serverDir}`);
}

console.log("[finalize-capacitor] Capacitor bundle ready at dist/client/");
