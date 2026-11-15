import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@/index.css"
import { AppProviders } from "@/AppProviders"
import { AppRoutes } from "@/AppRoutes"
import { configureApi } from "@/api/config"
import { DesktopLayout } from "@/components/yira/DesktopLayout"

// Web: same-origin cookie session (Vite proxy in dev, Vercel rewrites in production).
configureApi({ mode: "browser" })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRoutes Layout={DesktopLayout} />
    </AppProviders>
  </StrictMode>,
)
