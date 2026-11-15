/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Django backend origin, e.g. https://yira.onrender.com */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
