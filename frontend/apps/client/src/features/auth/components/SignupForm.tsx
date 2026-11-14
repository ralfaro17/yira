import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'

import { signupSchema, type SignupFormValues } from '../schemas/signup-schema'
import { useSignupMutation } from '../hooks/use-auth-queries'
import { PasswordRequirements } from './PasswordRequirements'
import { AllauthApiError } from '@/lib/auth/auth-api'
import type { SignupResult } from '../types'

interface SignupFormProps {
  onSuccess: (result: SignupResult) => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [serverGeneralError, setServerGeneralError] = useState<string | null>(null)

  const signupMutation = useSignupMutation()

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
    mode: 'onTouched',
  })

  const watchedPassword = useWatch({ control, name: 'password' }) || ''
  const watchedPasswordConfirm = useWatch({ control, name: 'passwordConfirm' }) || ''

  const onSubmit = async (values: SignupFormValues) => {
    setServerGeneralError(null)

    signupMutation.mutate(
      {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      },
      {
        onSuccess: (result) => {
          onSuccess(result)
        },
        onError: (err) => {
          if (err instanceof AllauthApiError) {
            let hasMappedFieldError = false

            // Map field-specific errors
            err.errors.forEach((fieldError) => {
              if (fieldError.param === 'username') {
                setError('username', { type: 'server', message: fieldError.message })
                hasMappedFieldError = true
              } else if (fieldError.param === 'email') {
                setError('email', { type: 'server', message: fieldError.message })
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
              'No se pudo completar el registro. Verifica tu conexión e intenta nuevamente.'
            )
          }
        },
      }
    )
  }

  const isPending = signupMutation.isPending || isSubmitting

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

      {/* Username Field */}
      <Field>
        <FieldLabel htmlFor="signup-username" className="font-semibold text-neutral-800">
          {t('auth.usernameLabel', 'Nombre de Usuario')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="signup-username"
            type="text"
            autoComplete="username"
            placeholder={t('auth.usernamePlaceholder', 'ej. viajero_nica')}
            disabled={isPending}
            aria-invalid={!!errors.username}
            {...register('username')}
          />
        </InputGroup>
        {errors.username?.message && (
          <FieldError errors={[{ message: errors.username.message }]} />
        )}
      </Field>

      {/* Email Field */}
      <Field>
        <FieldLabel htmlFor="signup-email" className="font-semibold text-neutral-800">
          {t('auth.emailLabel', 'Correo Electrónico')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="signup-email"
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

      {/* Password Field */}
      <Field>
        <FieldLabel htmlFor="signup-password" className="font-semibold text-neutral-800">
          {t('auth.passwordLabel', 'Contraseña')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="signup-password"
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
        <FieldLabel htmlFor="signup-password-confirm" className="font-semibold text-neutral-800">
          {t('auth.passwordConfirmLabel', 'Confirmar Contraseña')}
        </FieldLabel>
        <InputGroup className="h-12 border-2 border-[#e5bdaa] rounded-xl focus-within:border-[#e51422] focus-within:ring-2 focus-within:ring-[#e51422]/20 bg-white transition-colors">
          <InputGroupInput
            id="signup-password-confirm"
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
            <span>{t('auth.submittingSignup', 'Creando cuenta...')}</span>
          </>
        ) : (
          <>
            <span>{t('auth.submitSignup', 'Crear cuenta')}</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}
