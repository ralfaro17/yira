import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight, CheckCircle2, Mail, RotateCw } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'

import {
  requestPasswordResetSchema,
  type RequestPasswordResetFormValues,
} from '../schemas/password-reset-schema'
import { useRequestPasswordResetMutation } from '../hooks/use-auth-queries'
import { AllauthApiError } from '@/lib/auth/auth-api'

export function RequestPasswordResetForm() {
  const { t } = useTranslation()
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [serverGeneralError, setServerGeneralError] = useState<string | null>(null)

  const requestMutation = useRequestPasswordResetMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onTouched',
  })

  const onSubmit = async (values: RequestPasswordResetFormValues) => {
    setServerGeneralError(null)

    requestMutation.mutate(values.email.trim(), {
      onSuccess: () => {
        setSubmittedEmail(values.email.trim())
      },
      onError: (err) => {
        if (err instanceof AllauthApiError) {
          const emailError = err.getParamError('email')
          if (emailError) {
            setError('email', { type: 'server', message: emailError })
          } else {
            setServerGeneralError(err.message)
          }
        } else {
          setServerGeneralError(
            'No se pudo procesar la solicitud. Verifica tu conexión e intenta nuevamente.'
          )
        }
      },
    })
  }

  const isPending = requestMutation.isPending || isSubmitting

  if (submittedEmail) {
    return (
      <div className="space-y-4 text-center py-2 animate-in fade-in-50 duration-200">
        <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <CheckCircle2 className="size-6 text-primary" />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-base">
            ¡Correo enviado exitosamente!
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed text-balance">
            Si existe una cuenta asociada a{' '}
            <strong className="text-foreground">{submittedEmail}</strong>, hemos enviado
            un enlace para restablecer tu contraseña.
          </p>
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground text-left flex items-start gap-2">
          <Mail className="size-4 text-primary shrink-0 mt-0.5" />
          <span>
            Revisa tu bandeja de entrada y la carpeta de correo no deseado (spam). El enlace
            es válido por tiempo limitado.
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full text-xs h-9 gap-1.5 cursor-pointer"
            onClick={() => setSubmittedEmail(null)}
          >
            <RotateCw className="size-3.5" />
            <span>Probar con otro correo electrónico</span>
          </Button>

          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span>Volver a iniciar sesión</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverGeneralError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in-50 duration-200"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{serverGeneralError}</div>
        </div>
      )}

      {/* Email Field */}
      <Field>
        <FieldLabel htmlFor="reset-email" className="font-semibold text-neutral-800">
          {t('auth.emailLabel', 'Correo Electrónico')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder', 'viajero@ejemplo.com')}
            disabled={isPending}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </InputGroup>
        {errors.email?.message && (
          <FieldError errors={[{ message: errors.email.message }]} />
        )}
      </Field>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full min-h-12 gap-2 mt-4 font-bold text-base rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner className="size-4" />
            <span>{t('auth.sendingResetLink', 'Enviando enlace...')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.sendResetLink', 'Enviar enlace de recuperación')}</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}
