import axios from "axios"

import i18n, { currentLanguage } from "@/i18n"

import { getApiConfig, onApiConfigChange } from "./config"

/**
 * Shared axios instance.
 *
 * Browser mode: same-origin (Vite proxy in dev, Vercel rewrites in production), so the
 * session and CSRF cookies just work; Django reads the token from `csrftoken` and
 * expects it in `X-CSRFToken` on unsafe methods.
 *
 * App mode (desktop): absolute base URL and the allauth session token in `X-Session-Token`.
 */
export const api = axios.create({
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: { "Content-Type": "application/json" },
})

onApiConfigChange(({ mode, baseURL }) => {
  api.defaults.baseURL = baseURL || undefined
  api.defaults.withCredentials = mode === "browser"
})

// --------------------------------------------------------------------- session token (app mode)

let token: string | null | undefined // undefined = not loaded from the store yet

export async function getSessionToken() {
  if (token === undefined) token = (await getApiConfig().tokenStore.get()) ?? null
  return token
}

export async function setSessionToken(value: string, persist: boolean) {
  token = value
  await getApiConfig().tokenStore.set(value, persist)
}

export async function clearSessionToken() {
  token = null
  await getApiConfig().tokenStore.clear()
}

api.interceptors.request.use(async (request) => {
  // Backend (allauth/DRF) error messages and emails follow the UI language.
  request.headers.set("Accept-Language", currentLanguage())
  if (getApiConfig().mode === "app") {
    const current = await getSessionToken()
    if (current) request.headers.set("X-Session-Token", current)
  }
  return request
})

// --------------------------------------------------------------------- CSRF (browser mode)

let csrfReady: Promise<unknown> | null = null

/** Make sure the `csrftoken` cookie exists before the first unsafe request (browser mode only). */
export function ensureCsrf() {
  if (getApiConfig().mode !== "browser") return Promise.resolve()
  csrfReady ??= api.get("/api/csrf/").catch((err) => {
    csrfReady = null
    throw err
  })
  return csrfReady
}

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)
}

/** Human-readable message from a DRF / allauth error response. */
export function errorMessage(error: unknown, fallback: string = i18n.t("common.errors.generic")) {
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) return i18n.t("common.errors.offline")
  const data = error.response.data as { errors?: { message: string }[]; detail?: string } | undefined
  return data?.errors?.[0]?.message ?? data?.detail ?? fallback
}
