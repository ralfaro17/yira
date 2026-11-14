import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router'
import { ArrowLeft, UserX, Compass } from 'lucide-react'

import {
  useAuthSessionQuery,
  useCurrentUserProfileQuery,
  useUserProfileQuery,
} from '@/features/auth/hooks/use-auth-queries'
import { ProfileView } from '@/features/account/components/ProfileView'
import { ProfileEditForm } from '@/features/account/components/ProfileEditForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useTranslation } from 'react-i18next'

export function AccountPage() {
  const { t } = useTranslation()
  const { idOrUsername } = useParams<{ idOrUsername?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const sessionQuery = useAuthSessionQuery()
  const isAuthenticated = sessionQuery.data?.meta?.is_authenticated === true
  const currentSessionUser = sessionQuery.data?.data?.user

  // Check if explicit edit mode requested via query param e.g. ?edit=true
  const [isEditing, setIsEditing] = useState<boolean>(searchParams.get('edit') === 'true')

  useEffect(() => {
    setIsEditing(searchParams.get('edit') === 'true')
  }, [searchParams])

  // Determine if viewing own profile without params, or viewing by param
  const isViewingSpecificTarget = Boolean(idOrUsername)

  // Query by param if provided, otherwise fetch /api/users/me/
  const targetUserQuery = useUserProfileQuery(isViewingSpecificTarget ? idOrUsername : undefined)
  const currentUserQuery = useCurrentUserProfileQuery({
    enabled: !isViewingSpecificTarget && isAuthenticated,
  })

  // Redirect to login if user visits /account but is unauthenticated
  useEffect(() => {
    if (!isViewingSpecificTarget && sessionQuery.isSuccess && !isAuthenticated) {
      navigate('/login?next=/account', { replace: true })
    }
  }, [isViewingSpecificTarget, sessionQuery.isSuccess, isAuthenticated, navigate])

  const activeQuery = isViewingSpecificTarget ? targetUserQuery : currentUserQuery
  const profile = activeQuery.data

  const isLoading = sessionQuery.isLoading || activeQuery.isLoading

  // If viewing specific target, check if that target happens to be the logged in user
  const isOwnAccount = Boolean(
    profile?.is_own_profile ||
    (!isViewingSpecificTarget && isAuthenticated) ||
    (currentSessionUser && (
      String(currentSessionUser.id) === String(profile?.id) ||
      currentSessionUser.username?.toLowerCase() === profile?.username?.toLowerCase()
    ))
  )

  const handleToggleEdit = (editing: boolean) => {
    setIsEditing(editing)
    if (editing) {
      searchParams.set('edit', 'true')
    } else {
      searchParams.delete('edit')
    }
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className="relative min-h-screen w-full p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#fff9ef] via-white to-[#ffe8df] font-sans">
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#e51422]/10 rounded-full blur-3xl opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 w-[450px] h-[300px] bg-[#ffc900]/15 rounded-full blur-3xl opacity-40"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-[#e51422] transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>{t('account.backHome', 'Volver al inicio')}</span>
          </Link>

          {isOwnAccount && !isEditing && (
            <span className="text-xs font-bold text-[#c98224] bg-[#ffc900]/20 px-3 py-1 rounded-full border border-[#ffc900]/40">
              {t('account.panel', 'Panel de Cuenta')}
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-20 text-neutral-500">
            <Spinner className="size-8" />
            <p className="text-sm font-medium">{t('account.loading', 'Cargando perfil...')}</p>
          </div>
        ) : activeQuery.isError || !profile ? (
          /* Not Found / Error State */
          <Card className="border-2 border-[#e5bdaa] text-center py-12 shadow-xl bg-white rounded-3xl">
            <CardHeader className="items-center pb-2">
              <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                <UserX className="size-7" />
              </div>
              <CardTitle className="text-2xl font-heading font-normal text-neutral-900">{t('account.userNotFound', 'Usuario no encontrado')}</CardTitle>
              <CardDescription className="text-sm max-w-sm mx-auto text-neutral-600">
                {t('account.userNotFoundDesc', 'No pudimos encontrar la cuenta solicitada. Es posible que el enlace sea incorrecto o el usuario ya no exista.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                onClick={() => navigate('/')}
                className="gap-2 rounded-full min-h-11 px-6 font-bold bg-[#e51422] hover:bg-[#cf101c] text-white shadow-md cursor-pointer transition-all"
              >
                <Compass className="size-4" />
                <span>{t('account.exploreTaguer', 'Explorar Taguer')}</span>
              </Button>
            </CardContent>
          </Card>
        ) : isEditing && isOwnAccount ? (
          /* Edit Mode */
          <Card className="border-2 border-[#e5bdaa] shadow-xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-[#f5cfb9] bg-[#fff9ef]/50 pb-4">
              <CardTitle className="text-2xl font-heading font-normal text-neutral-900">{t('account.editTitle', 'Editar Perfil')}</CardTitle>
              <CardDescription className="text-xs text-neutral-600 font-sans">
                {t('account.editSubtitle', 'Actualiza tu información personal y administra tu foto de perfil.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ProfileEditForm
                profile={profile}
                onCancel={() => handleToggleEdit(false)}
                onSuccess={() => handleToggleEdit(false)}
              />
            </CardContent>
          </Card>
        ) : (
          /* Public / Self View Mode */
          <ProfileView
            profile={{ ...profile, is_own_profile: isOwnAccount }}
            onEdit={() => handleToggleEdit(true)}
          />
        )}
      </div>
    </div>
  )
}

