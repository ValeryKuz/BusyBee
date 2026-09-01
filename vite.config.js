import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Emits an additional legacy bundle (Babel-transpiled + polyfilled,
    // loaded via <script nomodule>) so old Chrome/Safari get a working
    // fallback instead of a blank page when they can't run the modern build.
    // Explicit targets: the "defaults" browserslist query only reflects
    // current real-world usage and no longer includes genuinely old
    // browsers, so it wouldn't transpile far enough down on its own.
    // (IE is intentionally excluded — React 18+ no longer supports it,
    // regardless of transpilation/polyfills.)
    //
    // modernPolyfills fills in runtime API gaps (not just syntax) for
    // browsers right at the modern/legacy boundary. (modernTargets can't
    // be pushed below the ES-module baseline itself — the modern chunk is
    // emitted as real ESM, so esbuild can't downlevel its syntax further;
    // browsers below that baseline are routed to the legacy chunk instead
    // via runtime feature detection, not a version check.)
    legacy({
      targets: ['chrome >= 49', 'safari >= 10', 'firefox >= 54', 'edge >= 15'],
      modernPolyfills: true,
    }),
  ],
  base: '/BusyBee/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
})
