import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SignupClosedNotice() {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-md border-border/80 shadow-xl bg-card">
      <CardHeader className="text-center pb-2 items-center">
        <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
          <AlertTriangle className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold text-foreground">
          {t('auth.signupClosed.title', 'Registro no disponible')}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          {t(
            'auth.signupClosed.desc',
            'El registro de nuevos usuarios en Taguer se encuentra cerrado temporalmente.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 text-center">
        <p className="text-xs text-muted-foreground mb-4">
          {t(
            'auth.signupClosed.notice',
            'Si ya posees una cuenta, puedes acceder utilizando tus credenciales existentes.'
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 cursor-pointer"
          onClick={() => {
            window.location.href = '/login'
          }}
        >
          <ArrowLeft className="size-4" />
          <span>{t('auth.signupClosed.backToLogin', 'Volver al inicio de sesión')}</span>
        </Button>
      </CardContent>
    </Card>
  )
}
