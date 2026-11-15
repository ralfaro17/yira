import { useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import { ThemeProvider } from "./components/ThemeProvider"
import { CrewDetailPage } from "./components/pages/CrewDetailPage"
import { CrewPage } from "./components/pages/CrewPage"
import { EvaluationDetailPage } from "./components/pages/EvaluationDetailPage"
import { EvaluationPage } from "./components/pages/EvaluationPage"
import { HomePage } from "./components/pages/HomePage"
import { LoginPage } from "./components/pages/LoginPage"
import { NotificationsPage } from "./components/pages/NotificationsPage"
import { ProfilePage } from "./components/pages/ProfilePage"
import { ProtocolDetailPage } from "./components/pages/ProtocolDetailPage"
import { ProtocolsPage } from "./components/pages/ProtocolsPage"
import { ScanPage } from "./components/pages/ScanPage"
import { WelcomePage } from "./components/pages/WelcomePage"
import { AppLayout } from "./components/yira/AppLayout"
import { RequireAuth } from "./components/yira/RequireAuth"

function App() {
  useEffect(() => {
    document.title = "YIRA"
  }, [])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/iniciar-sesion" Component={LoginPage} />
          <Route Component={RequireAuth}>
            {/* Full-bleed intro after login (own layout). */}
            <Route path="/bienvenida" Component={WelcomePage} />
            <Route Component={AppLayout}>
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
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
