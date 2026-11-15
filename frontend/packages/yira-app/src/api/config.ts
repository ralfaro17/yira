/**
 * Runtime API configuration, set once by each app's entry point.
 *
 * - `browser` (web + mobile PWA/TWA): same-origin requests, Django session cookie
 *   and CSRF token, allauth headless *browser* client.
 * - `app` (desktop/Electron): absolute `baseURL`, allauth headless *app* client;
 *   the session token travels in the `X-Session-Token` header.
 */
export type ApiMode = "browser" | "app"

export interface TokenStore {
  get(): Promise<string | null> | string | null
  /** `persist=false` keeps the token for this run only ("Recordarme" unchecked). */
  set(token: string, persist: boolean): Promise<void> | void
  clear(): Promise<void> | void
}

export interface ApiConfig {
  mode: ApiMode
  baseURL: string
  tokenStore: TokenStore
}

export function memoryTokenStore(): TokenStore {
  let token: string | null = null
  return {
    get: () => token,
    set: (value) => {
      token = value
    },
    clear: () => {
      token = null
    },
  }
}

let config: ApiConfig = { mode: "browser", baseURL: "", tokenStore: memoryTokenStore() }
const listeners = new Set<(config: ApiConfig) => void>()

export function configureApi(next: Partial<ApiConfig>) {
  config = { ...config, ...next }
  listeners.forEach((listener) => listener(config))
}

export function getApiConfig(): ApiConfig {
  return config
}

export function onApiConfigChange(listener: (config: ApiConfig) => void) {
  listeners.add(listener)
  listener(config)
  return () => listeners.delete(listener)
}

/** allauth headless auth endpoints for the current client type. */
export function authBase() {
  return `/_allauth/${config.mode}/v1/auth`
}
