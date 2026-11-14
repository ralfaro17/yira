import { useNavigate, useSearchParams } from 'react-router'
import {
  useAuthConfigQuery,
  useAuthSessionQuery,
  useLogoutMutation,
} from '@/features/auth/hooks/use-auth-queries'
import { LoginCard } from '@/features/auth/components/LoginCard'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { AlreadyAuthenticatedNotice } from '@/features/auth/components/AlreadyAuthenticatedNotice'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import type { LoginResult } from '@/features/auth/types'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const configQuery = useAuthConfigQuery()
  const sessionQuery = useAuthSessionQuery()
  const logoutMutation = useLogoutMutation()

  // If already authenticated according to session query
  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true
  const authenticatedUser = sessionQuery.data?.data?.user

  // Destination to redirect after login (e.g. ?next=/dashboard)
  const nextParam = searchParams.get('next')
  const redirectTarget = nextParam && nextParam.startsWith('/') ? nextParam : '/'

  // Handle logout from already authenticated state
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.add({
          type: 'info',
          title: 'Sesión cerrada',
          description: 'Has cerrado sesión correctamente.',
          timeout: 4000,
        })
      },
    })
  }

  const handleLoginSuccess = (result: LoginResult) => {
    if (result.type === 'authenticated') {
      toast.add({
        type: 'success',
        title: '¡Bienvenido de nuevo!',
        description: `Has iniciado sesión correctamente como ${
          result.user.display || result.user.email || 'usuario'
        }.`,
        timeout: 5000,
      })
      navigate(redirectTarget, { replace: true })
    } else if (result.type === 'pending_email_verification') {
      toast.add({
        type: 'warning',
        title: 'Verificación de correo requerida',
        description:
          'Tu cuenta requiere validación de correo electrónico. Revisa tu bandeja de entrada.',
        timeout: 8000,
      })
    } else if (result.type === 'pending_2fa') {
      toast.add({
        type: 'info',
        title: 'Autenticación en dos pasos (2FA)',
        description: 'Se requiere completar la autenticación en dos pasos.',
        timeout: 6000,
      })
    }
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
        {configQuery.isLoading || sessionQuery.isLoading ? (
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
        ) : (
          /* Main login form */
          <LoginCard>
            <LoginForm onSuccess={handleLoginSuccess} />
          </LoginCard>
        )}
      </main>
    </div>
  )
}

