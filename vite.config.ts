import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";

const DEV_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: blob: https:; " +
  "connect-src 'self' data: https://*.supabase.co wss://*.supabase.co ws://localhost:* https://viacep.com.br https://accounts.google.com https://maps.googleapis.com https://nominatim.openstreetmap.org; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "frame-src 'self' blob:; " +
  "base-uri 'self'; form-action 'self';";

const PROD_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'wasm-unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: blob: https:; " +
  "connect-src 'self' data: https://*.supabase.co wss://*.supabase.co https://viacep.com.br https://accounts.google.com https://maps.googleapis.com https://nominatim.openstreetmap.org; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "frame-src 'self' blob:; " +
  "base-uri 'self'; form-action 'self';";

function cspPlugin(isDev: boolean): Plugin {
  const csp = isDev ? DEV_CSP : PROD_CSP;
  return {
    name: "csp-inject",
    transformIndexHtml(html) {
      return html.replace(
        /<!--\s*\[CSP_PLACEHOLDER\]\s*-->/,
        `<meta http-equiv="Content-Security-Policy" content="${csp}" />`
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    cspPlugin(mode === "development"),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env": {},
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
}));
