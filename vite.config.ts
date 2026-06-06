// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Set BUILD_TARGET=capacitor to produce a static SPA bundle suitable for
// wrapping with Capacitor (Android/iOS). The default build remains the
// Lovable / Cloudflare SSR build used by the live preview.
const isCapacitor = process.env.BUILD_TARGET === "capacitor";

export default defineConfig(
  isCapacitor
    ? {
        // No Cloudflare/Nitro bundling for native wrappers — plain Vite SPA.
        nitro: false,
        tanstackStart: {
          // SPA mode: TanStack Start emits a single static index.html shell
          // that hydrates the whole router on the client.
          spa: { enabled: true },
        },
        vite: {
          // Use relative asset URLs so the bundle works from file:// /
          // capacitor:// origins on device.
          base: "./",
        },
      }
    : undefined,
);
