import axios from "axios"

/**
 * Same-origin client: Vite proxies `/api` and `/_allauth` to Django in dev,
 * so the session and CSRF cookies just work. Django expects the CSRF token
 * from the `csrftoken` cookie in the `X-CSRFToken` header on unsafe methods.
 */
export const api = axios.create({
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: { "Content-Type": "application/json" },
})

let csrfReady: Promise<unknown> | null = null

/** Make sure the `csrftoken` cookie exists before the first unsafe request. */
export function ensureCsrf() {
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
export function errorMessage(error: unknown, fallback = "Algo salió mal. Inténtalo de nuevo.") {
  if (!axios.isAxiosError(error)) return fallback
  const data = error.response?.data as
    | { errors?: { message: string }[]; detail?: string }
    | undefined
  return data?.errors?.[0]?.message ?? data?.detail ?? fallback
}
