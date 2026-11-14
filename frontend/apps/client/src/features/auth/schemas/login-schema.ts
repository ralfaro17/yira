import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'El correo electrónico o nombre de usuario es requerido.'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

