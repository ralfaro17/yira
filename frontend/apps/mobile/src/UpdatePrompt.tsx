import { useEffect } from "react"
import i18n from "@/i18n"
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
    toast(i18n.t("layout.pwa.updateAvailable"), {
      id: "pwa-update",
      duration: Infinity,
      action: { label: i18n.t("layout.pwa.update"), onClick: () => updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  useEffect(() => {
    if (offlineReady) toast.success(i18n.t("layout.pwa.offlineReady"), { id: "pwa-offline" })
  }, [offlineReady])

  return null
}
