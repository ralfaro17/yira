import { z } from 'zod'

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(1, 'El nombre de usuario es requerido.')
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres.')
      .max(30, 'El nombre de usuario no puede exceder 30 caracteres.')
      .regex(
        /^[a-zA-Z0-9_.-]+$/,
        'El usuario solo puede contener letras, números, guiones y puntos.'
      ),
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido.')
      .email('Ingresa una dirección de correo electrónico válida.'),
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

export type SignupFormValues = z.infer<typeof signupSchema>

