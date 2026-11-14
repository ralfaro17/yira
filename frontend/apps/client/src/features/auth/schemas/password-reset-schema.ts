import { z } from 'zod'

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido.')
    .email('Ingresa una dirección de correo electrónico válida.'),
})

export type RequestPasswordResetFormValues = z.infer<typeof requestPasswordResetSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    passwordConfirm: z
      .string()
      .min(1, 'Debes confirmar la contraseña.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirm'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
