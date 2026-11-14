import { useNavigate } from 'react-router'
import {
  useAuthConfigQuery,
  useAuthSessionQuery,
} from '@/features/auth/hooks/use-auth-queries'
import { SignupCard } from '@/features/auth/components/SignupCard'
import { SignupForm } from '@/features/auth/components/SignupForm'
import { SignupClosedNotice } from '@/features/auth/components/SignupClosedNotice'
import { AlreadyAuthenticatedNotice } from '@/features/auth/components/AlreadyAuthenticatedNotice'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { getCsrfToken } from '@/lib/auth/csrf'
import type { SignupResult } from '@/features/auth/types'

export function SignupPage() {
  const navigate = useNavigate()

  const configQuery = useAuthConfigQuery()
  const sessionQuery = useAuthSessionQuery()

  // If already authenticated according to session
  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true
  const authenticatedUser = sessionQuery.data?.data?.user

  // Check if signups are open
  const isOpenForSignup = configQuery.data?.data?.account?.is_open_for_signup !== false

  // Handle logout from already authenticated state
  const handleLogout = async () => {
    try {
      const csrfToken = getCsrfToken()
      await fetch('/_allauth/browser/v1/auth/session', {
        method: 'DELETE',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRFToken': csrfToken } : {},
      })
      window.location.reload()
    } catch {
      window.location.reload()
    }
  }

  const handleSignupSuccess = (result: SignupResult) => {
    if (result.type === 'pending_email_verification') {
      // Show a success toast, then redirect to home
      toast.add({
        type: 'success',
        title: '¡Cuenta creada con éxito!',
        description: `Te enviamos un correo a ${result.email}. Verifica tu dirección para activar tu cuenta.`,
        timeout: 8000,
      })
    } else {
      // Directly authenticated
      toast.add({
        type: 'success',
        title: '¡Bienvenido a Taguer!',
        description: 'Tu cuenta ha sido creada y ya iniciaste sesión.',
        timeout: 5000,
      })
    }
    // Always redirect to home
    navigate('/', { replace: true })
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#fff9ef] via-white to-[#ffe8df] overflow-x-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#e51422]/10 rounded-full blur-3xl opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 w-[450px] h-[300px] bg-[#ffc900]/15 rounded-full blur-3xl opacity-50"
        aria-hidden="true"
      />

      <main className="relative z-10 w-full flex items-center justify-center">
        {/* Loading initial configuration */}
        {configQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-muted-foreground">
            <Spinner className="size-8" />
            <p className="text-sm font-medium">Cargando Taguer...</p>
          </div>
        ) : isAuthenticated ? (
          /* User is already signed in */
          <AlreadyAuthenticatedNotice
            user={authenticatedUser}
            onLogout={handleLogout}
          />
        ) : !isOpenForSignup ? (
          /* Registration is temporarily closed */
          <SignupClosedNotice />
        ) : (
          /* Main signup form */
          <SignupCard>
            <SignupForm onSuccess={handleSignupSuccess} />
          </SignupCard>
        )}
      </main>
    </div>
  )
}
