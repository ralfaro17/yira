import { useEffect } from "react"
import { toast } from "@/lib/toast"
import { useRegisterSW } from "virtual:pwa-register/react"

/** Registers the service worker and offers to reload when a new version is deployed. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for a new deploy every hour while the app stays open.
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast("Nueva versión disponible", {
      id: "pwa-update",
      duration: Infinity,
      action: { label: "Actualizar", onClick: () => updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  useEffect(() => {
    if (offlineReady) toast.success("YIRA está lista para usarse sin conexión", { id: "pwa-offline" })
  }, [offlineReady])

  return null
}
