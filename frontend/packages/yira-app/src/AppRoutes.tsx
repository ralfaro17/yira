import type { ComponentType } from "react"
import { Navigate, Route, Routes } from "react-router"

import { CrewDetailPage } from "@/components/pages/CrewDetailPage"
import { CrewPage } from "@/components/pages/CrewPage"
import { EvaluationDetailPage } from "@/components/pages/EvaluationDetailPage"
import { EvaluationPage } from "@/components/pages/EvaluationPage"
import { HomePage } from "@/components/pages/HomePage"
import { LoginPage } from "@/components/pages/LoginPage"
import { NotificationsPage } from "@/components/pages/NotificationsPage"
import { ProfilePage } from "@/components/pages/ProfilePage"
import { ProtocolDetailPage } from "@/components/pages/ProtocolDetailPage"
import { ProtocolsPage } from "@/components/pages/ProtocolsPage"
import { ScanPage } from "@/components/pages/ScanPage"
import { WelcomePage } from "@/components/pages/WelcomePage"
import { RequireAuth } from "@/components/yira/RequireAuth"

/**
 * The YIRA route tree, shared by every app. Each app injects its own shell
 * (`DesktopLayout` for web/desktop, `MobileLayout` for the PWA); the layout must
 * render an `<Outlet />`. Must be rendered inside a router.
 */
export function AppRoutes({ Layout }: { Layout: ComponentType }) {
  return (
    <Routes>
      <Route path="/iniciar-sesion" Component={LoginPage} />
      <Route Component={RequireAuth}>
        {/* Full-bleed intro after login (own layout). */}
        <Route path="/bienvenida" Component={WelcomePage} />
        <Route Component={Layout}>
          <Route index Component={HomePage} />
          <Route path="/tripulacion" Component={CrewPage} />
          <Route path="/tripulacion/:id" Component={CrewDetailPage} />
          <Route path="/tripulacion/:id/escaneo" Component={ScanPage} />
          <Route path="/protocolos" Component={ProtocolsPage} />
          <Route path="/protocolos/:slug" Component={ProtocolDetailPage} />
          <Route path="/evaluacion" Component={EvaluationPage} />
          <Route path="/evaluacion/:id" Component={EvaluationDetailPage} />
          <Route path="/perfil" Component={ProfilePage} />
          <Route path="/notificaciones" Component={NotificationsPage} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
