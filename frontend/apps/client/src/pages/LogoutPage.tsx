import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useLogoutMutation } from '@/features/auth/hooks/use-auth-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'

export function LogoutPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logoutMutation = useLogoutMutation()

  useEffect(() => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        toast.add({
          type: 'info',
          title: t('auth.logoutPage.toastTitle', 'Sesión finalizada'),
          description: t('auth.logoutPage.toastDesc', 'Has cerrado sesión exitosamente.'),
          timeout: 4000,
        })
        navigate('/login', { replace: true })
      },
    })
  }, [t, navigate, logoutMutation])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/80 shadow-lg text-center p-8 bg-card/95">
        <CardContent className="pt-2 flex flex-col items-center gap-4">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <LogOut className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">
              {t('auth.logoutPage.title', 'Cerrando sesión')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('auth.logoutPage.desc', 'Por favor espera un momento...')}
            </p>
          </div>
          <Spinner className="size-6 text-primary mt-2" />
        </CardContent>
      </Card>
    </div>
  )
}
