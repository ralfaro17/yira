import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ResetPasswordCardProps {
  children: React.ReactNode
}

export function ResetPasswordCard({ children }: ResetPasswordCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-md border-2 border-[#e5bdaa] shadow-2xl backdrop-blur-sm bg-white/95 rounded-3xl">
      <CardHeader className="text-center pb-3 items-center">
        <span className="text-xs uppercase tracking-widest text-[#e51422] font-bold">
          {t('auth.resetPasswordCard.brand', 'Taguer Nicaragua')}
        </span>

        <CardTitle className="text-3xl sm:text-4xl font-normal font-heading tracking-tight text-neutral-900 mt-1">
          {t('auth.resetPasswordCard.title', 'Restablece tu contraseña')}
        </CardTitle>

        <CardDescription className="text-sm text-neutral-600 text-balance font-sans">
          {t(
            'auth.resetPasswordCard.desc',
            'Crea una nueva contraseña segura para recuperar el acceso a tu cuenta.'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">{children}</CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-[#f5cfb9] bg-[#fff9ef]/60 py-4 text-center rounded-b-3xl">
        <p className="text-sm text-neutral-600">
          {t('auth.resetPasswordCard.rememberedPassword', '¿Recordaste tu contraseña anterior?')}{' '}
          <Link
            to="/login"
            className="font-bold text-[#e51422] underline underline-offset-4 hover:text-[#cf101c] transition-colors"
          >
            {t('auth.resetPasswordCard.loginLink', 'Inicia sesión')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
