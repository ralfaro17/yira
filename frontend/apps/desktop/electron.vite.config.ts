import { resolve } from "node:path"

import { defineConfig, loadEnv } from "electron-vite"
import { mergeConfig, type Plugin } from "vite"

import { yiraViteConfig } from "@yira/app/vite"

const appDir = import.meta.dirname

/** Strict CSP for the packaged renderer (dev needs Vite's inline HMR preamble, so build only). */
function contentSecurityPolicy(apiUrl: string): Plugin {
  const api = new URL(apiUrl).origin
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${api}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ")
  return {
    name: "yira-desktop-csp",
    apply: "build",
    transformIndexHtml: (html) =>
      html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appDir, "VITE_")
  const apiUrl = env.VITE_API_URL || "http://127.0.0.1:8000"
  return {
    main: {
      build: { rollupOptions: { input: resolve(appDir, "src/main/index.ts") } },
      define: { __YIRA_API_URL__: JSON.stringify(apiUrl) },
    },
    preload: {
      // Sandboxed preload scripts must be CommonJS.
      build: {
        rollupOptions: {
          input: resolve(appDir, "src/preload/index.ts"),
          output: { format: "cjs", entryFileNames: "[name].cjs" },
        },
      },
    },
    renderer: mergeConfig(yiraViteConfig({ port: 5176, proxy: false, plugins: [contentSecurityPolicy(apiUrl)] }), {
      root: resolve(appDir, "src/renderer"),
      envDir: appDir,
      build: {
        minify: true,
        cssMinify: true,
        rollupOptions: { input: resolve(appDir, "src/renderer/index.html") },
      },
    }),
  }
})
