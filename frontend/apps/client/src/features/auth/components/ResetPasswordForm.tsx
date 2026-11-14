import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  UserCheck,
} from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '../schemas/password-reset-schema'
import {
  usePasswordResetInfoQuery,
  useResetPasswordMutation,
} from '../hooks/use-auth-queries'
import { PasswordRequirements } from './PasswordRequirements'
import { AllauthApiError } from '@/lib/auth/auth-api'

interface ResetPasswordFormProps {
  resetKey?: string
}

export function ResetPasswordForm({ resetKey }: ResetPasswordFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [serverGeneralError, setServerGeneralError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Query to validate key and retrieve user metadata
  const infoQuery = usePasswordResetInfoQuery(resetKey)
  const resetMutation = useResetPasswordMutation()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      passwordConfirm: '',
    },
    mode: 'onTouched',
  })

  const watchedPassword = useWatch({ control, name: 'password' }) || ''
  const watchedPasswordConfirm = useWatch({ control, name: 'passwordConfirm' }) || ''

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!resetKey) return
    setServerGeneralError(null)

    resetMutation.mutate(
      {
        key: resetKey,
        password: values.password,
      },
      {
        onSuccess: () => {
          setIsSuccess(true)
        },
        onError: (err) => {
          if (err instanceof AllauthApiError) {
            const passwordError = err.getParamError('password')
            if (passwordError) {
              setError('password', { type: 'server', message: passwordError })
            } else {
              setServerGeneralError(err.message)
            }
          } else {
            setServerGeneralError(
              t(
                'auth.resetPasswordForm.errorGeneric',
                'No se pudo restablecer la contraseña. Verifica tu conexión e intenta nuevamente.'
              )
            )
          }
        },
      }
    )
  }

  // 1. If no resetKey provided
  if (!resetKey) {
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-base">
            {t('auth.resetPasswordForm.invalidKeyTitle', 'Falta la clave de recuperación')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed text-balance">
            {t(
              'auth.resetPasswordForm.invalidKeyDesc',
              'No se encontró un token válido en el enlace. Por favor utiliza el enlace que recibiste en tu correo o solicita uno nuevo.'
            )}
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="size-4" />
          <span>{t('auth.resetPasswordForm.requestNewLink', 'Solicitar nuevo enlace')}</span>
        </Link>
      </div>
    )
  }

  // 2. Loading state while checking resetKey
  if (infoQuery.isLoading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
        <Spinner className="size-8 text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">
          {t('common.loading', 'Validando enlace de recuperación...')}
        </p>
      </div>
    )
  }

  // 3. Key is invalid or expired
  if (infoQuery.isError) {
    const errorMsg =
      infoQuery.error instanceof AllauthApiError
        ? infoQuery.error.message
        : t('auth.resetPasswordForm.invalidKeyDesc', 'El enlace de recuperación es inválido o ha expirado.')

    return (
      <div className="space-y-4 py-2 text-center animate-in fade-in-50 duration-200">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-base">
            {t('auth.resetPasswordForm.invalidKeyTitle', 'Enlace inválido o expirado')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed text-balance">
            {errorMsg}
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="size-4" />
            <span>{t('auth.resetPasswordForm.requestNewLink', 'Solicitar un nuevo enlace')}</span>
          </Link>
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
          >
            {t('auth.loginHere', 'Volver al inicio de sesión')}
          </Link>
        </div>
      </div>
    )
  }

  // 4. Success state after changing password
  if (isSuccess) {
    return (
      <div className="space-y-4 py-2 text-center animate-in fade-in-50 duration-200">
        <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-base">
            {t('auth.resetPasswordForm.successTitle', '¡Contraseña restablecida!')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed text-balance">
            {t('auth.resetPasswordForm.successDesc', 'Tu contraseña ha sido actualizada exitosamente.')}
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors mt-2"
        >
          <span>{t('auth.resetPasswordForm.goToLogin', 'Iniciar sesión ahora')}</span>
          <ArrowRight className="size-4" />
        </Link>
      </div>
    )
  }

  const user = infoQuery.data?.data?.user
  const isPending = resetMutation.isPending || isSubmitting

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Account Info Notice */}
      {user && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground flex items-center gap-2">
          <UserCheck className="size-4 text-primary shrink-0" />
          <span className="truncate">
            Restableciendo contraseña para:{' '}
            <strong className="font-medium text-primary">
              {user.display || user.email || user.username}
            </strong>
          </span>
        </div>
      )}

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

      {/* New Password Field */}
      <Field>
        <FieldLabel htmlFor="reset-new-password" className="font-semibold text-neutral-800">
          {t('auth.resetPasswordForm.newPasswordLabel', 'Nueva Contraseña')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="reset-new-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

      {/* Confirm Password Field */}
      <Field>
        <FieldLabel htmlFor="reset-new-password-confirm" className="font-semibold text-neutral-800">
          {t('auth.resetPasswordForm.confirmPasswordLabel', 'Confirmar Nueva Contraseña')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="reset-new-password-confirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-invalid={!!errors.passwordConfirm}
            {...register('passwordConfirm')}
          />
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={
              showPasswordConfirm ? t('auth.hidePassword', 'Ocultar contraseña') : t('auth.showPassword', 'Ver contraseña')
            }
            aria-pressed={showPasswordConfirm}
            onClick={() => setShowPasswordConfirm((prev) => !prev)}
            disabled={isPending}
          >
            {showPasswordConfirm ? (
              <EyeOff className="size-3.5 text-muted-foreground" />
            ) : (
              <Eye className="size-3.5 text-muted-foreground" />
            )}
          </InputGroupButton>
        </InputGroup>
        {errors.passwordConfirm?.message && (
          <FieldError errors={[{ message: errors.passwordConfirm.message }]} />
        )}
      </Field>

      {/* Password criteria visual feedback */}
      <PasswordRequirements
        password={watchedPassword}
        passwordConfirm={watchedPasswordConfirm}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full min-h-12 gap-2 mt-4 font-bold text-base rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner className="size-4" />
            <span>{t('auth.resetPasswordForm.submitting', 'Actualizando contraseña...')}</span>
          </>
        ) : (
          <>
            <KeyRound className="size-4" />
            <span>{t('auth.resetPasswordForm.submitBtn', 'Guardar nueva contraseña')}</span>
          </>
        )}
      </Button>
    </form>
  )
}
