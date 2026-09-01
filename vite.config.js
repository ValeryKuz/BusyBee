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
    legacy({
      targets: ['chrome >= 49', 'safari >= 10', 'firefox >= 54', 'edge >= 15'],
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
