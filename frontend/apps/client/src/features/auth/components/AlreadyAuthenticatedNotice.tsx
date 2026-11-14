import { UserCheck, ArrowRight, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '../types'

interface AlreadyAuthenticatedNoticeProps {
  user?: User
  onLogout?: () => void
}

export function AlreadyAuthenticatedNotice({
  user,
  onLogout,
}: AlreadyAuthenticatedNoticeProps) {
  const { t } = useTranslation()
  const displayName = user?.display || user?.email || 'Usuario'

  return (
    <Card className="w-full max-w-md border-2 border-[#e5bdaa] shadow-2xl bg-white/95 rounded-3xl">
      <CardHeader className="text-center pb-2 items-center">
        <div className="size-14 rounded-full bg-[#ffc900]/20 text-[#c98224] ring-4 ring-[#ffc900]/30 flex items-center justify-center mb-2">
          <UserCheck className="size-7" />
        </div>
        <CardTitle className="text-2xl font-heading font-normal text-neutral-900">
          {t('auth.alreadyAuthenticated.title', 'Sesión Activa')}
        </CardTitle>
        <CardDescription className="text-sm text-neutral-600 mt-1 font-sans">
          {t('auth.alreadyAuthenticated.desc', {
            name: displayName,
            defaultValue: `Ya has iniciado sesión como ${displayName}.`,
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3 space-y-4">
        <p className="text-xs text-neutral-500 text-center font-sans">
          {t(
            'auth.alreadyAuthenticated.notice',
            'Para crear una cuenta diferente o iniciar con otro usuario, primero debes cerrar tu sesión actual.'
          )}
        </p>

        <div className="flex flex-col gap-2.5 pt-1">
          <Button
            type="button"
            className="w-full min-h-12 gap-2 font-bold text-sm rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            <span>{t('auth.alreadyAuthenticated.goHome', 'Ir al inicio')}</span>
            <ArrowRight className="size-4" />
          </Button>

          {onLogout && (
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-12 gap-2 rounded-full border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold text-sm cursor-pointer transition-colors"
              onClick={onLogout}
            >
              <LogOut className="size-4" />
              <span>{t('auth.alreadyAuthenticated.logout', 'Cerrar sesión')}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
