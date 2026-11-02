import { defineConfig, loadEnv } from "vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from "vite";

const DEV_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: blob: https:; " +
  "connect-src 'self' data: https://*.supabase.co wss://*.supabase.co ws://localhost:* https://viacep.com.br https://accounts.google.com https://maps.googleapis.com https://nominatim.openstreetmap.org https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "frame-src 'self' blob:; " +
  "base-uri 'self'; form-action 'self';";

const PROD_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'wasm-unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "img-src 'self' data: blob: https:; " +
  "connect-src 'self' data: https://*.supabase.co wss://*.supabase.co https://viacep.com.br https://accounts.google.com https://maps.googleapis.com https://nominatim.openstreetmap.org https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io; " +
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const sentryBuildEnv = loadEnv("sentry-build-plugin", process.cwd(), "SENTRY_");
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN || sentryBuildEnv.SENTRY_AUTH_TOKEN;
  const sentryProject = env.SENTRY_PROJECT || sentryBuildEnv.SENTRY_PROJECT;
  const release = env.VITE_SENTRY_RELEASE || env.CF_PAGES_COMMIT_SHA;
  const uploadSourceMaps = mode === "production" && Boolean(sentryAuthToken && sentryProject);

  return {
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
      uploadSourceMaps && sentryVitePlugin({
        org: env.SENTRY_ORG || sentryBuildEnv.SENTRY_ORG || "icuide",
        project: sentryProject,
        authToken: sentryAuthToken,
        release: { name: release },
        sourcemaps: {
          filesToDeleteAfterUpload: ["./dist/**/*.map"],
        },
        telemetry: false,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env": {},
      "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(release || ""),
    },
    build: {
      sourcemap: uploadSourceMaps ? "hidden" : false,
    },
    optimizeDeps: {
      include: ["buffer", "process"],
    },
  };
});
