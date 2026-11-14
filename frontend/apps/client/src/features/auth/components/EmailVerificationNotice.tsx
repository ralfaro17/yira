import { MailCheck, ArrowRight, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EmailVerificationNoticeProps {
  email: string
  onReset: () => void
}

export function EmailVerificationNotice({ email, onReset }: EmailVerificationNoticeProps) {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-md border-border/80 shadow-xl backdrop-blur-sm bg-card/95 animate-in fade-in-50 zoom-in-95 duration-300">
      <CardHeader className="text-center pb-2 items-center">
        <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-inner">
          <MailCheck className="size-7" />
        </div>
        <CardTitle className="text-xl font-bold text-foreground">
          {t('auth.emailNotice.title', '¡Casi listo! Verifica tu correo')}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1 text-balance">
          {t('auth.emailNotice.desc', 'Hemos enviado un enlace de verificación a:')}
        </CardDescription>
        <div className="mt-1 px-3 py-1 bg-muted rounded-full text-xs font-mono font-medium text-foreground max-w-full truncate">
          {email}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-2">
        <div className="rounded-xl bg-muted/50 border border-border/60 p-4 text-xs text-muted-foreground space-y-2.5">
          <p className="font-semibold text-foreground/90">
            {t('auth.emailNotice.nextStepsTitle', 'Siguientes pasos:')}
          </p>
          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
            <li>{t('auth.emailNotice.step1', 'Abre tu bandeja de entrada en tu proveedor de correo.')}</li>
            <li>{t('auth.emailNotice.step2', 'Busca el correo de confirmación de Taguer.')}</li>
            <li>{t('auth.emailNotice.step3', 'Haz clic en el enlace de confirmación para activar tu cuenta.')}</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            className="w-full h-10 gap-2 cursor-pointer"
            onClick={() => {
              window.location.href = '/login'
            }}
          >
            <span>{t('auth.emailNotice.goToLogin', 'Ir a Iniciar Sesión')}</span>
            <ArrowRight className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full h-9 gap-1.5 text-xs text-muted-foreground cursor-pointer"
            onClick={onReset}
          >
            <RotateCcw className="size-3.5" />
            <span>{t('auth.emailNotice.useOtherEmail', 'Registrar con otro correo')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
