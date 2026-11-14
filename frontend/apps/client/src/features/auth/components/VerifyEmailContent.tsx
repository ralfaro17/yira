import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod/v4'
import {
  MailCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

import {
  useEmailVerificationInfoQuery,
  useVerifyEmailMutation,
} from '../hooks/use-auth-queries'
import { AllauthApiError } from '@/lib/auth/auth-api'

// ---- Schema for manual key input ----
const manualKeySchema = z.object({
  key: z.string().min(1, 'Por favor ingresa el código de verificación.'),
})
type ManualKeyValues = z.infer<typeof manualKeySchema>

type VerifyState =
  | { type: 'idle' }
  | { type: 'success_login' }
  | { type: 'success_verify' }
  | { type: 'error'; message: string }

interface VerifyEmailContentProps {
  /** Key extracted from the URL (may be undefined if the user navigated without one) */
  verificationKey?: string
}

export function VerifyEmailContent({ verificationKey }: VerifyEmailContentProps) {
  const { t } = useTranslation()
  const [verifyState, setVerifyState] = useState<VerifyState>({ type: 'idle' })

  const infoQuery = useEmailVerificationInfoQuery(verificationKey)
  const verifyMutation = useVerifyEmailMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManualKeyValues>({
    resolver: zodResolver(manualKeySchema),
    defaultValues: { key: '' },
  })

  // ---- Confirm key (used by both the auto-key button and the manual form) ----
  const handleConfirm = (key: string) => {
    verifyMutation.mutate(key, {
      onSuccess: (result) => {
        if (result.type === 'verified_and_logged_in') {
          setVerifyState({ type: 'success_login' })
        } else {
          setVerifyState({ type: 'success_verify' })
        }
      },
      onError: (err) => {
        const message =
          err instanceof AllauthApiError
            ? err.message
            : t('auth.verifyEmail.errorTitle', 'No se pudo verificar el correo. Intenta de nuevo.')
        setVerifyState({ type: 'error', message })
      },
    })
  }

  const onManualSubmit = (values: ManualKeyValues) => handleConfirm(values.key.trim())

  const isPending = verifyMutation.isPending

  // Shared link-as-button class (matches base Button default variant)
  const linkButtonCls = cn(
    'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent',
    'bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all',
    'hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
  )
  const linkOutlineCls = cn(
    'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border',
    'bg-background px-3 py-2 text-sm font-medium text-foreground transition-all',
    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
  )
  const linkGhostCls = cn(
    'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent',
    'px-3 py-2 text-sm font-medium text-foreground transition-all',
    'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
  )

  // ---- Success states ----
  if (verifyState.type === 'success_login' || verifyState.type === 'success_verify') {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="size-16 rounded-full bg-green-500/10 flex items-center justify-center ring-1 ring-green-500/30">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">
            {t('auth.verifyEmail.successVerifyTitle', '¡Correo verificado!')}
          </h2>
          {verifyState.type === 'success_login' ? (
            <p className="text-sm text-muted-foreground text-balance">
              {t(
                'auth.verifyEmail.successLoginDesc',
                'Tu cuenta ha sido activada y ya iniciaste sesión. ¡Bienvenido a Taguer!'
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-balance">
              {t(
                'auth.verifyEmail.successVerifyDesc',
                'Tu correo electrónico fue verificado exitosamente. Ahora puedes iniciar sesión.'
              )}
            </p>
          )}
        </div>
        <Link
          to={verifyState.type === 'success_login' ? '/' : '/login'}
          className={linkButtonCls}
        >
          {verifyState.type === 'success_login'
            ? t('auth.alreadyAuthenticated.goHome', 'Ir al inicio')
            : t('auth.loginHere', 'Iniciar sesión')}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  // ---- Key from URL: show info and confirm button ----
  if (verificationKey) {
    const email = infoQuery.data?.data?.email

    return (
      <div className="flex flex-col gap-5 py-2">
        {/* Loading key info */}
        {infoQuery.isLoading && (
          <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">{t('common.loading', 'Validando enlace de verificación...')}</p>
          </div>
        )}

        {/* Key info loaded successfully */}
        {infoQuery.isSuccess && (
          <>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <MailCheck className="size-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  {t('auth.verifyEmail.confirmHeaderTitle', 'Confirma tu correo')}
                </h2>
                {email && (
                  <p className="text-sm text-muted-foreground">
                    Verificarás la dirección:{' '}
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Error from mutation */}
            {verifyState.type === 'error' && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2.5"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>{verifyState.message}</div>
              </div>
            )}

            <Button
              className="w-full min-h-12 gap-2 font-bold text-base rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
              disabled={isPending}
              onClick={() => handleConfirm(verificationKey)}
            >
              {isPending ? (
                <>
                  <Spinner className="size-4" />
                  <span>{t('auth.verifyEmail.confirming', 'Verificando...')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.verifyEmail.confirmButtonText', 'Confirmar dirección de correo')}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </>
        )}

        {/* Key invalid / expired */}
        {infoQuery.isError && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center ring-1 ring-destructive/20">
              <AlertCircle className="size-7 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                {t('auth.verifyEmail.errorTitle', 'Enlace no válido')}
              </h2>
              <p className="text-sm text-muted-foreground text-balance">
                {infoQuery.error?.message ||
                  'El enlace de verificación es inválido o ya expiró. Solicita uno nuevo desde tu perfil.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Link to="/signup" className={linkOutlineCls}>
                <RefreshCw className="size-4" />
                {t('auth.signupHere', 'Crear una nueva cuenta')}
              </Link>
              <Link to="/login" className={linkGhostCls}>
                {t('auth.loginHere', 'Iniciar sesión')}
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---- No key in URL: show manual key input ----
  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
          <MailCheck className="size-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">
            {t('auth.verifyEmail.manualHeaderTitle', 'Verifica tu correo')}
          </h2>
          <p className="text-sm text-muted-foreground text-balance">
            {t(
              'auth.verifyEmail.manualHeaderSubtitle',
              'Ingresa el código de verificación que te enviamos por correo electrónico.'
            )}
          </p>
        </div>
      </div>

      {verifyState.type === 'error' && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2.5"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>{verifyState.message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-4" noValidate>
        <Field>
          <FieldLabel htmlFor="verify-key" className="font-semibold text-neutral-800">
            {t('auth.verifyEmail.manualHeaderTitle', 'Código de verificación')}
          </FieldLabel>
          <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
            <InputGroupInput
              id="verify-key"
              type="text"
              autoComplete="one-time-code"
              placeholder={t('auth.verifyEmail.manualKeyPlaceholder', 'Pega tu código aquí')}
              disabled={isPending}
              aria-invalid={!!errors.key}
              {...register('key')}
            />
          </InputGroup>
          {errors.key?.message && <FieldError errors={[{ message: errors.key.message }]} />}
        </Field>

        <Button
          type="submit"
          className="w-full min-h-12 gap-2 mt-4 font-bold text-base rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Spinner className="size-4" />
              <span>{t('auth.verifyEmail.confirming', 'Verificando...')}</span>
            </>
          ) : (
            <>
              <span>{t('auth.verifyEmail.verifyButtonText', 'Confirmar correo')}</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
