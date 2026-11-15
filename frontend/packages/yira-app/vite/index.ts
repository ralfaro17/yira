/**
 * Shared Vite configuration for every YIRA app (web, mobile, desktop renderer).
 *
 * - `@/` resolves to this package's `src/` (the shadcn/component code lives here).
 * - Shared static assets in `packages/yira-app/public` (`/yira/**`, `/crew/**`) are
 *   served in dev and copied into the build, *in addition to* the app's own `public/`.
 */
import { cp, stat } from "node:fs/promises"
import { createReadStream } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import type { Plugin, PluginOption, ProxyOptions, UserConfig } from "vite"

const here = path.dirname(fileURLToPath(import.meta.url))
export const packageRoot = path.resolve(here, "..")
export const packageSrc = path.join(packageRoot, "src")
export const sharedPublicDir = path.join(packageRoot, "public")

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
}

/** Serve `sharedPublicDir` in dev/preview and copy it into `outDir` on build. */
export function sharedPublic(): Plugin {
  let outDir = "dist"
  const serve = (prefix = "") =>
    async (req: { url?: string }, res: import("node:http").ServerResponse, next: () => void) => {
      const url = decodeURIComponent((req.url ?? "").split("?")[0]).replace(prefix, "")
      const file = path.join(sharedPublicDir, url)
      if (!file.startsWith(sharedPublicDir + path.sep)) return next()
      try {
        if (!(await stat(file)).isFile()) return next()
      } catch {
        return next()
      }
      res.setHeader("Content-Type", MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream")
      createReadStream(file).pipe(res)
    }
  return {
    name: "yira-shared-public",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use(serve())
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve())
    },
    async writeBundle() {
      await cp(sharedPublicDir, outDir, { recursive: true, force: false, errorOnExist: false })
    },
  }
}

export const backendProxy = (target = "http://127.0.0.1:8000"): Record<string, ProxyOptions> => ({
  "/api": { target, changeOrigin: true },
  "/_allauth": { target, changeOrigin: true },
})

/** Base config shared by all apps; spread it and add app-specific options. */
export function yiraViteConfig(options: { port?: number; proxy?: boolean; plugins?: PluginOption[] } = {}): UserConfig {
  return {
    plugins: [react(), tailwindcss(), sharedPublic(), ...(options.plugins ?? [])],
    resolve: {
      alias: { "@": packageSrc },
      dedupe: ["react", "react-dom"],
    },
    server: {
      port: options.port,
      strictPort: options.port !== undefined,
      proxy: options.proxy === false ? undefined : backendProxy(),
      fs: { allow: [packageRoot, process.cwd()] },
    },
    preview: { port: options.port, proxy: options.proxy === false ? undefined : backendProxy() },
  }
}
