/**
 * Reads the Django CSRF token stored in cookies.
 * Django's default cookie name is 'csrftoken'.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

