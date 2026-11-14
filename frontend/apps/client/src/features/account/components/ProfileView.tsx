import { useTranslation } from 'react-i18next'
import { Calendar, User as UserIcon, Edit3, Tag, ShieldCheck } from 'lucide-react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { UserProfile } from '@/features/auth/types'

interface ProfileViewProps {
  profile: UserProfile
  onEdit?: () => void
}

export function ProfileView({ profile, onEdit }: ProfileViewProps) {
  const { t, i18n } = useTranslation()
  const isEn = (i18n.resolvedLanguage || i18n.language || 'es').startsWith('en')

  const initials = (profile.display || profile.username)
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'U'

  const formattedDateJoined = profile.date_joined
    ? new Date(profile.date_joined).toLocaleDateString(isEn ? 'en-US' : 'es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const genderLabels: Record<string, string> = {
    MALE: t('account.genders.male', 'Masculino'),
    FEMALE: t('account.genders.female', 'Femenino'),
    OTHER: t('account.genders.other', 'Otro / No especificado'),
  }

  return (
    <div className="space-y-6">
      {/* Header Profile Hero Card */}
      <Card className="border-2 border-[#e5bdaa] shadow-xl bg-white rounded-3xl overflow-hidden">
        <div className="h-32 bg-[#da1311] bg-[url('/banner-figma-red-navs.png')] bg-cover bg-center border-b border-[#f5cfb9]" />

        <CardContent className="relative pt-0 pb-8 px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 mb-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar size="lg" className="size-28 ring-4 ring-white shadow-xl border-2 border-[#e5bdaa]">
                {profile.has_profile_picture && profile.profile_picture_url ? (
                  <AvatarImage
                    src={profile.profile_picture_url}
                    alt={profile.display || profile.username}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-[#fff9ef] text-[#e51422] font-heading font-bold text-3xl">
                  {initials ? initials : <UserIcon className="size-12 text-[#e51422]" />}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Edit Profile CTA (Only on own profile) */}
            {profile.is_own_profile && onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-2 rounded-full border-2 border-[#e51422] text-[#e51422] hover:bg-red-50 font-bold px-4 py-2 cursor-pointer shadow-xs transition-all"
              >
                <Edit3 className="size-4" />
                <span>{t('account.editProfile', 'Editar perfil')}</span>
              </Button>
            )}
          </div>

          {/* User Details */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-3xl font-heading font-normal tracking-tight text-neutral-900">
                {profile.display || profile.username}
              </h2>
              <Badge className="text-xs px-2.5 py-0.5 capitalize bg-[#ffc900] text-neutral-950 font-bold border-0">
                {profile.user_type === 'BUSINESS'
                  ? (isEn ? 'Business' : 'Negocio')
                  : (isEn ? 'Tourist' : 'Turista')}
              </Badge>
              {profile.is_own_profile && (
                <Badge variant="outline" className="text-xs font-bold text-[#e51422] border-[#e51422]/50 bg-red-50/50">
                  {isEn ? 'Your account' : 'Tu cuenta'}
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-500 font-sans">
              @{profile.username}
            </p>
          </div>

          {/* Biography */}
          <div className="mt-6 pt-5 border-t border-[#f5cfb9]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1457b8] mb-1.5 font-sans">
              {isEn ? 'About me' : 'Sobre mí'}
            </h4>
            <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed font-sans">
              {profile.biography ? profile.biography : (isEn ? 'No bio added yet.' : 'Este usuario aún no ha agregado una biografía.')}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-neutral-700 font-sans">
            {formattedDateJoined && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fff9ef] border border-[#e5bdaa]">
                <Calendar className="size-4 text-[#e51422] shrink-0" />
                <span className="font-medium">{t('account.dateJoined', 'Miembro desde')} {formattedDateJoined}</span>
              </div>
            )}

            {profile.gender && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fff9ef] border border-[#e5bdaa]">
                <UserIcon className="size-4 text-[#e51422] shrink-0" />
                <span className="font-medium">{t('account.gender', 'Género')}: {genderLabels[profile.gender] || profile.gender}</span>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fff9ef] border border-[#e5bdaa]">
              <ShieldCheck className="size-4 text-[#1457b8] shrink-0" />
              <span className="font-semibold text-neutral-800">{isEn ? 'Verified account' : 'Cuenta verificada'}</span>
            </div>
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#f5cfb9]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1457b8] mb-2.5 flex items-center gap-1.5 font-sans">
                <Tag className="size-3.5" />
                <span>{isEn ? 'Travel interests' : 'Intereses turísticos'}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest.id}
                    className="text-xs px-3 py-1 font-bold bg-white border-2 border-[#e5bdaa] text-neutral-800 rounded-full shadow-2xs"
                  >
                    {interest.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
