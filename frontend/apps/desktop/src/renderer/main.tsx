import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@/index.css"
import { AppProviders } from "@/AppProviders"
import { AppRoutes } from "@/AppRoutes"
import { configureApi, memoryTokenStore } from "@/api/config"
import { DesktopLayout } from "@/components/yira/DesktopLayout"
import { desktopBridge } from "@/platform"

// Desktop: the renderer runs on app://yira (or the dev server), so it talks to Django
// cross-origin with the allauth "app" client and an X-Session-Token kept by the main process.
configureApi({
  mode: "app",
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
  tokenStore: desktopBridge()?.tokens ?? memoryTokenStore(),
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRoutes Layout={DesktopLayout} />
    </AppProviders>
  </StrictMode>,
)
