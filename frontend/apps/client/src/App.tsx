// React imports
// import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Style imports
import './App.css';

// UI imports
import { Toaster } from '@/components/ui/toast';
import { Navbar } from './components/Navbar';
import { ActiveRouteBanner } from './components/routes/ActiveRouteBanner';

// Page imports
import { ReverseProxyTest } from './pages/ReverseProxyTest';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AccountPage } from './pages/AccountPage';
import { LogoutPage } from './pages/LogoutPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { PaquiProvider } from './context/PaquiContext';
import { Home } from './pages/Home';
import { CreateRouteWizard } from './pages/routes/CreateRouteWizard';
import { GroupRouteView } from './pages/routes/GroupRouteView';
import { JoinGroupRoutePage } from './pages/routes/JoinGroupRoutePage';
import { PaquiStore } from './pages/gamification/PaquiStore';
import PricingCards from './pages/billing/PricingCards';
import CheckoutSuccess from './pages/billing/CheckoutSuccess';
import CheckoutCancel from './pages/billing/CheckoutCancel';
import { FigmaUI } from './figma-ui/FigmaUI';
import { MembershipsScreen } from './figma-ui/screens/MembershipsScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <PaquiProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </PaquiProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <ActiveRouteBanner />
      <div className="flex-1">
        <Routes>
          <Route path="/reverse-proxy-test" element={<ReverseProxyTest />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/account/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-email/:key" element={<VerifyEmailPage />} />
          <Route path="/account/verify-email" element={<VerifyEmailPage />} />
          <Route path="/account/verify-email/:key" element={<VerifyEmailPage />} />

          {/* Password Recovery & Reset routes */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/account/password/reset" element={<ForgotPasswordPage />} />
          <Route path="/account/password/reset/key/:key" element={<ResetPasswordPage />} />
          <Route path="/reset-password/:key" element={<ResetPasswordPage />} />

          {/* Account, Profile & Logout routes */}
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/edit" element={<AccountPage />} />
          <Route path="/account/:idOrUsername" element={<AccountPage />} />
          <Route path="/profile/:idOrUsername" element={<AccountPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/account/logout" element={<LogoutPage />} />

          <Route path="/" element={<FigmaUI />} />
          <Route path="/memberships" element={<MembershipsScreen />} />
          <Route path="/figma-ui/*" element={<FigmaUI />} />
          <Route path="/figma-ui" element={<FigmaUI />} />
          <Route path="/rutas/crear" element={<CreateRouteWizard />} />
          <Route path="/rutas/grupal/:codeOrId" element={<GroupRouteView />} />
          <Route path="/rutas/mapa/:codeOrId" element={<GroupRouteView />} />
          <Route path="/rutas/unirse" element={<JoinGroupRoutePage />} />
          <Route path="/paquipoints" element={<PaquiStore />} />
          <Route path="/tienda" element={<PaquiStore />} />
          <Route path="/test" element={<Home />} />
          <Route path="/billing/pricing" element={<PricingCards />} />
          <Route path="/billing/success" element={<CheckoutSuccess />} />
          <Route path="/billing/cancel" element={<CheckoutCancel />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

