import { defineConfig } from "vite"

import { yiraViteConfig } from "@yira/app/vite"

// https://vite.dev/config/
export default defineConfig(yiraViteConfig({ port: 5173 }))
