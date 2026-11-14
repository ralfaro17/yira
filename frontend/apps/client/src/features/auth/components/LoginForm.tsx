import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle, ArrowRight, MailCheck } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'

import { loginSchema, type LoginFormValues } from '../schemas/login-schema'
import { useLoginMutation } from '../hooks/use-auth-queries'
import { AllauthApiError } from '@/lib/auth/auth-api'
import type { LoginResult } from '../types'

interface LoginFormProps {
  onSuccess: (result: LoginResult) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [serverGeneralError, setServerGeneralError] = useState<string | null>(null)
  const [pendingEmailVerification, setPendingEmailVerification] = useState<string | null>(null)

  const loginMutation = useLoginMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
    mode: 'onTouched',
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerGeneralError(null)
    setPendingEmailVerification(null)

    const trimmedIdentifier = values.identifier.trim()
    const isEmail = trimmedIdentifier.includes('@')
    const payload = isEmail
      ? { email: trimmedIdentifier, password: values.password }
      : { username: trimmedIdentifier, password: values.password }

    loginMutation.mutate(
      payload,
      {
        onSuccess: (result) => {
          if (result.type === 'pending_email_verification') {
            setPendingEmailVerification(
              isEmail ? trimmedIdentifier : result.email || trimmedIdentifier
            )
          }
          onSuccess(result)
        },
        onError: (err) => {
          if (err instanceof AllauthApiError) {
            let hasMappedFieldError = false

            // Map field-specific errors if returned
            err.errors.forEach((fieldError) => {
              if (fieldError.param === 'email' || fieldError.param === 'username') {
                setError('identifier', { type: 'server', message: fieldError.message })
                hasMappedFieldError = true
              } else if (fieldError.param === 'password') {
                setError('password', { type: 'server', message: fieldError.message })
                hasMappedFieldError = true
              }
            })

            // If no specific field matched or there are global errors, show general banner
            const nonFieldErrors = err.getNonFieldErrors()
            if (nonFieldErrors.length > 0) {
              setServerGeneralError(nonFieldErrors.join(' '))
            } else if (!hasMappedFieldError) {
              setServerGeneralError(err.message)
            }
          } else {
            setServerGeneralError(
              'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.'
            )
          }
        },
      }
    )
  }

  const isPending = loginMutation.isPending || isSubmitting

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* General Error Banner */}
      {serverGeneralError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in-50 duration-200"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{serverGeneralError}</div>
        </div>
      )}

      {/* Pending Email Verification Notice */}
      {pendingEmailVerification && (
        <div
          role="status"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex flex-col gap-2 animate-in fade-in-50 duration-200"
        >
          <div className="flex items-start gap-2.5">
            <MailCheck className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              Tu cuenta tiene la verificación de correo electrónico pendiente. Por favor revisa tu
              bandeja de entrada para confirmar tu correo antes de iniciar sesión.
            </div>
          </div>
          <Link
            to="/verify-email"
            className="self-end text-xs font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300"
          >
            Ir a verificar correo &rarr;
          </Link>
        </div>
      )}

      {/* Identifier (Email or Username) Field */}
      <Field>
        <FieldLabel htmlFor="login-identifier" className="font-semibold text-neutral-800">
          {t('auth.identifierLabel', 'Correo Electrónico o Usuario')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="login-identifier"
            type="text"
            autoComplete="username"
            placeholder={t('auth.identifierPlaceholder', 'viajero@ejemplo.com o nombre_usuario')}
            disabled={isPending}
            aria-invalid={!!errors.identifier}
            {...register('identifier')}
          />
        </InputGroup>
        {errors.identifier?.message && (
          <FieldError errors={[{ message: errors.identifier.message }]} />
        )}
      </Field>

      {/* Password Field */}
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="login-password" className="font-semibold text-neutral-800">
            {t('auth.passwordLabel', 'Contraseña')}
          </FieldLabel>
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-[#e51422] hover:underline underline-offset-2 transition-colors"
          >
            {t('auth.forgotPasswordLink', '¿Olvidaste tu contraseña?')}
          </Link>
        </div>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={showPassword ? t('auth.hidePassword', 'Ocultar contraseña') : t('auth.showPassword', 'Ver contraseña')}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isPending}
          >
            {showPassword ? (
              <EyeOff className="size-3.5 text-muted-foreground" />
            ) : (
              <Eye className="size-3.5 text-muted-foreground" />
            )}
          </InputGroupButton>
        </InputGroup>
        {errors.password?.message && (
          <FieldError errors={[{ message: errors.password.message }]} />
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
            <span>{t('auth.submittingLogin', 'Iniciando sesión...')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.submitLogin', 'Iniciar sesión')}</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}

