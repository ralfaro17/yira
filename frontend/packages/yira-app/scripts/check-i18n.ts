/**
 * Verifies that every literal key passed to `t("…")` exists in the Spanish source locale.
 * (English is checked against Spanish at compile time: `const en: typeof es`.)
 *
 *   node scripts/check-i18n.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import es from "../src/i18n/locales/es/index.ts"

const root = join(import.meta.dirname, "../src")
const keys = new Set<string>()
const walk = (obj: object, prefix = "") => {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === "object") walk(v, path)
    else keys.add(path.replace(/_(zero|one|two|few|many|other)$/, ""))
  }
}
walk(es)

const files: string[] = []
const collect = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (!p.includes(join("i18n", "locales"))) collect(p)
    } else if (/\.tsx?$/.test(name)) files.push(p)
  }
}
collect(root)

const call = /\bt\(\s*["'`]([\w.]+)["'`]/g
let missing = 0
for (const file of files) {
  const text = readFileSync(file, "utf8")
  for (const m of text.matchAll(call)) {
    if (!keys.has(m[1]) && ![...keys].some((k) => k.startsWith(`${m[1]}.`))) {
      const line = text.slice(0, m.index).split("\n").length
      console.error(`${relative(process.cwd(), file)}:${line}  missing key "${m[1]}"`)
      missing++
    }
  }
}
if (missing) process.exit(1)
console.log(`i18n: ${keys.size} keys, all t() references resolve.`)
