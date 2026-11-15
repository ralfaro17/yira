/**
 * Thin platform layer so shared code doesn't care whether it runs in a browser,
 * an installed PWA/TWA (mobile) or the Electron shell (desktop).
 */

export interface DesktopBridge {
  platform: string
  tokens: {
    get(): Promise<string | null>
    set(token: string, persist: boolean): Promise<void>
    clear(): Promise<void>
  }
  openExternal(url: string): Promise<void>
  copyText(text: string): Promise<void>
}

declare global {
  interface Window {
    /** Exposed by the Electron preload script (apps/desktop). */
    yiraDesktop?: DesktopBridge
  }
}

export type PlatformKind = "desktop" | "standalone" | "browser"

export function desktopBridge(): DesktopBridge | undefined {
  return typeof window === "undefined" ? undefined : window.yiraDesktop
}

/** Running as an installed app (PWA/TWA display-mode standalone). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function platformKind(): PlatformKind {
  if (desktopBridge()) return "desktop"
  return isStandalone() ? "standalone" : "browser"
}

export async function copyText(text: string): Promise<void> {
  const bridge = desktopBridge()
  if (bridge) return bridge.copyText(text)
  await navigator.clipboard.writeText(text)
}

export async function openExternal(url: string): Promise<void> {
  const bridge = desktopBridge()
  if (bridge) return bridge.openExternal(url)
  window.open(url, "_blank", "noopener,noreferrer")
}
