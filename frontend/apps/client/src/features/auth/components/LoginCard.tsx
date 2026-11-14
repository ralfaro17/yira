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

interface LoginCardProps {
  children: React.ReactNode
}

export function LoginCard({ children }: LoginCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-md border-2 border-[#e5bdaa] shadow-2xl backdrop-blur-sm bg-white/95 rounded-3xl">
      <CardHeader className="text-center pb-3 items-center">
        <span className="text-xs uppercase tracking-widest text-[#e51422] font-bold">
          Taguer Nicaragua
        </span>

        <CardTitle className="text-3xl sm:text-4xl font-normal font-heading tracking-tight text-neutral-900 mt-1">
          {t('auth.loginTitle', 'Inicia sesión')}
        </CardTitle>

        <CardDescription className="text-sm text-neutral-600 text-balance font-sans">
          {t('auth.loginSubtitle', 'Accede a tu cuenta para descubrir sitios turísticos y gestionar tus favoritos.')}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">{children}</CardContent>

      <CardFooter className="flex flex-col gap-2.5 border-t border-[#f5cfb9] bg-[#fff9ef]/60 py-4 text-center rounded-b-3xl">
        <p className="text-sm text-neutral-600">
          {t('auth.forgotPasswordLink', '¿Olvidaste tu contraseña?')}{' '}
          <Link
            to="/forgot-password"
            className="font-bold text-[#e51422] underline underline-offset-4 hover:text-[#cf101c] transition-colors"
          >
            {t('auth.recoverHere', 'Recupérala aquí')}
          </Link>
        </p>
        <p className="text-sm text-neutral-600">
          {t('auth.noAccountQuestion', '¿No tienes una cuenta aún?')}{' '}
          <Link
            to="/signup"
            className="font-bold text-[#e51422] underline underline-offset-4 hover:text-[#cf101c] transition-colors"
          >
            {t('auth.signupHere', 'Regístrate aquí')}
          </Link>
        </p>
        <p className="text-[11px] text-neutral-500 leading-relaxed max-w-xs pt-0.5">
          {t('auth.termsNoticeLogin', 'Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad turística.')}
        </p>
      </CardFooter>
    </Card>
  )
}

