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

interface SignupCardProps {
  children: React.ReactNode
}

export function SignupCard({ children }: SignupCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-md border-2 border-[#e5bdaa] shadow-2xl backdrop-blur-sm bg-white/95 rounded-3xl">
      <CardHeader className="text-center pb-3 items-center">
        <span className="text-xs uppercase tracking-widest text-[#e51422] font-bold">
          Taguer Nicaragua
        </span>

        <CardTitle className="text-3xl sm:text-4xl font-normal font-heading tracking-tight text-neutral-900 mt-1">
          {t('auth.signupTitle', 'Crea tu cuenta')}
        </CardTitle>

        <CardDescription className="text-sm text-neutral-600 text-balance font-sans">
          {t('auth.signupSubtitle', 'Descubre sitios turísticos, conecta con negocios locales y crea itinerarios únicos.')}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">{children}</CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-[#f5cfb9] bg-[#fff9ef]/60 py-4 text-center rounded-b-3xl">
        <p className="text-sm text-neutral-600">
          {t('auth.haveAccountQuestion', '¿Ya tienes una cuenta?')}{' '}
          <Link
            to="/login"
            className="font-bold text-[#e51422] underline underline-offset-4 hover:text-[#cf101c] transition-colors"
          >
            {t('auth.loginHere', 'Inicia sesión')}
          </Link>
        </p>
        <p className="text-[11px] text-neutral-500 leading-relaxed max-w-xs">
          {t('auth.termsNoticeSignup', 'Al registrarte, aceptas nuestros términos de servicio y política de privacidad turística.')}
        </p>
      </CardFooter>
    </Card>
  )
}
