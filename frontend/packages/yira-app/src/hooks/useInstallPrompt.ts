import { useCallback, useEffect, useState } from "react"

import { isStandalone } from "@/platform"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * PWA install support (Chrome/Edge/Android): captures `beforeinstallprompt` so the
 * app can offer its own "Instalar app" button. `canInstall` is false once installed
 * or on browsers without the event (e.g. iOS Safari: use Share → Add to Home Screen).
 */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setEvent(null)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!event) return false
    await event.prompt()
    const { outcome } = await event.userChoice
    setEvent(null)
    return outcome === "accepted"
  }, [event])

  return { canInstall: !!event && !installed, installed, install }
}
