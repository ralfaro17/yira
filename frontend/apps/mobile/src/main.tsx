import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@/index.css"
import { AppProviders } from "@/AppProviders"
import { AppRoutes } from "@/AppRoutes"
import { configureApi } from "@/api/config"
import { MobileLayout } from "@/components/yira/MobileLayout"

import { UpdatePrompt } from "./UpdatePrompt"

// Mobile PWA / Android TWA: served from its own HTTPS origin with /api and /_allauth
// proxied to Django (Vite proxy in dev, Vercel rewrites in production) → cookie session.
configureApi({ mode: "browser" })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders extra={<UpdatePrompt />}>
      <AppRoutes Layout={MobileLayout} />
    </AppProviders>
  </StrictMode>,
)
