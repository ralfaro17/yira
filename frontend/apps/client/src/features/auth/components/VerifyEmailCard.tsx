import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'

interface VerifyEmailCardProps {
  children: React.ReactNode
}

export function VerifyEmailCard({ children }: VerifyEmailCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="w-full max-w-md border-2 border-[#e5bdaa] shadow-2xl backdrop-blur-sm bg-white/95 rounded-3xl">
      <CardHeader className="text-center pb-3 items-center">
        <span className="text-xs uppercase tracking-widest text-[#e51422] font-bold">
          {t('auth.verifyEmail.cardBrand', 'Taguer Nicaragua')}
        </span>
      </CardHeader>

      <CardContent className="pt-2">{children}</CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-[#f5cfb9] bg-[#fff9ef]/60 py-4 text-center rounded-b-3xl">
        <p className="text-sm text-neutral-600">
          {t('auth.verifyEmail.cardFooterQuestion', '¿Ya verificaste tu correo?')}{' '}
          <Link
            to="/login"
            className="font-bold text-[#e51422] underline underline-offset-4 hover:text-[#cf101c] transition-colors"
          >
            {t('auth.verifyEmail.loginLink', 'Inicia sesión')}
          </Link>
        </p>
        <p className="text-[11px] text-neutral-500 leading-relaxed max-w-xs">
          {t('auth.verifyEmail.spamNotice', 'Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.')}
        </p>
      </CardFooter>
    </Card>
  )
}
