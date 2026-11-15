// Generates the PWA/TWA icon set from the shared YIRA logo (white wordmark on transparent).
// Output: public/pwa/*.png and public/favicon.png. Run: pnpm --filter mobile icons
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const here = path.dirname(fileURLToPath(import.meta.url))
const logo = path.resolve(here, "../../../packages/yira-app/public/yira/common/logo-yira.png")
const out = path.resolve(here, "../public/pwa")
const BG = "#000f15"

/** Square icon: background + trimmed logo scaled to `logoWidth` of the side. */
async function icon(size, logoWidth, file) {
  const mark = await sharp(logo).trim().resize({ width: Math.round(size * logoWidth) }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(path.join(out, file))
}

await mkdir(out, { recursive: true })
await icon(192, 0.72, "pwa-192x192.png")
await icon(512, 0.72, "pwa-512x512.png")
await icon(512, 0.56, "maskable-icon-512x512.png") // keep inside the 80% safe zone
await icon(180, 0.7, "apple-touch-icon-180x180.png")
await icon(64, 0.8, "favicon-64x64.png")
console.log("icons written to", out)
