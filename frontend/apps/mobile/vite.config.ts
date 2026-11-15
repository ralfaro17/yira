import { defineConfig, mergeConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

import { yiraViteConfig } from "@yira/app/vite"

const SPACE = "#000f15"

// Mobile app: same shared pages + MobileLayout, shipped as an installable PWA.
// The Android APK is a Trusted Web Activity around the deployed PWA (see twa/README.md).
export default defineConfig(
  mergeConfig(yiraViteConfig({ port: 5175 }), {
    plugins: [
      VitePWA({
        registerType: "prompt",
        injectRegister: false, // registered from src/UpdatePrompt.tsx
        includeAssets: ["pwa/apple-touch-icon-180x180.png", "pwa/favicon-64x64.png"],
        manifest: {
          id: "/",
          name: "YIRA · Salud de la tripulación",
          short_name: "YIRA",
          description: "Monitoreo de salud de la tripulación desde la Tierra hasta Marte.",
          lang: "es",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: SPACE,
          theme_color: SPACE,
          categories: ["health", "medical"],
          icons: [
            { src: "/pwa/pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa/pwa-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "/pwa/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,woff2}", "pwa/*.png"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//, /^\/_allauth\//, /^\/admin/, /^\/\.well-known\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Login/session must always hit the server.
              urlPattern: ({ url }) => url.pathname.startsWith("/_allauth/") || url.pathname === "/api/csrf/",
              handler: "NetworkOnly",
            },
            {
              // Last known health data stays visible when the connection drops.
              urlPattern: ({ url, request }) => url.pathname.startsWith("/api/health/") && request.method === "GET",
              handler: "NetworkFirst",
              options: {
                cacheName: "yira-api",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 60, maxAgeSeconds: 24 * 60 * 60 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              // Shared artwork (mascots, crew photos, icons) served from the shared package.
              urlPattern: ({ url }) => url.pathname.startsWith("/yira/") || url.pathname.startsWith("/crew/"),
              handler: "CacheFirst",
              options: {
                cacheName: "yira-assets",
                expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  }),
)
