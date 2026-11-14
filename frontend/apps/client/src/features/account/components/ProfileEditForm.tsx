import { useForm } from 'react-hook-form'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { useUpdateProfileMutation } from '@/features/auth/hooks/use-auth-queries'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import type { UserProfile, UpdateProfilePayload } from '@/features/auth/types'

interface ProfileEditFormProps {
  profile: UserProfile
  onCancel: () => void
  onSuccess: () => void
}

interface FormValues {
  first_name: string
  last_name: string
  biography: string
  gender: string
  date_of_birth: string
}

export function ProfileEditForm({
  profile,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateProfileMutation()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      biography: profile.biography || '',
      gender: profile.gender || 'OTHER',
      date_of_birth: profile.date_of_birth || '',
    },
  })

  const onSubmit = (values: FormValues) => {
    const payload: UpdateProfilePayload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      biography: values.biography.trim(),
      gender: values.gender,
      date_of_birth: values.date_of_birth ? values.date_of_birth : null,
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.add({
          type: 'success',
          title: t('account.toastSuccessTitle', 'Perfil actualizado'),
          description: t('account.toastSuccessDesc', 'Tus cambios han sido guardados exitosamente.'),
        })
        onSuccess()
      },
      onError: (err) => {
        toast.add({
          type: 'error',
          title: t('account.toastErrorTitle', 'Error al actualizar'),
          description: err.message || 'No se pudieron guardar los cambios.',
        })
      },
    })
  }

  const isPending = updateMutation.isPending || isSubmitting

  return (
    <div className="space-y-6">
      {/* Profile Picture Section (AWS S3) */}
      <ProfilePictureUpload
        currentImageUrl={profile.profile_picture_url}
        hasProfilePicture={profile.has_profile_picture}
        displayName={profile.display || profile.username}
      />

      {/* Profile Details Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="edit-first-name" className="font-semibold text-neutral-800">
              {t('account.firstName', 'Nombre')}
            </FieldLabel>
            <Input
              id="edit-first-name"
              placeholder={t('account.firstNamePlaceholder', 'Tu nombre')}
              disabled={isPending}
              className="border-2 border-[#e5bdaa] rounded-xl focus-visible:border-[#e51422] focus-visible:ring-2 focus-visible:ring-[#e51422]/20 bg-white transition-colors h-11"
              {...register('first_name')}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-last-name" className="font-semibold text-neutral-800">
              {t('account.lastName', 'Apellido')}
            </FieldLabel>
            <Input
              id="edit-last-name"
              placeholder={t('account.lastNamePlaceholder', 'Tu apellido')}
              disabled={isPending}
              className="border-2 border-[#e5bdaa] rounded-xl focus-visible:border-[#e51422] focus-visible:ring-2 focus-visible:ring-[#e51422]/20 bg-white transition-colors h-11"
              {...register('last_name')}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="edit-biography" className="font-semibold text-neutral-800">
            {t('account.bio', 'Biografía')}
          </FieldLabel>
          <textarea
            id="edit-biography"
            rows={3}
            placeholder={t('account.bioPlaceholder', 'Cuéntanos un poco sobre tus intereses turísticos...')}
            disabled={isPending}
            className="w-full rounded-xl border-2 border-[#e5bdaa] bg-white px-3 py-2 text-sm shadow-xs placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-[#e51422] focus-visible:ring-2 focus-visible:ring-[#e51422]/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-colors"
            {...register('biography')}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="edit-gender" className="font-semibold text-neutral-800">
              {t('account.gender', 'Género')}
            </FieldLabel>
            <select
              id="edit-gender"
              disabled={isPending}
              className="w-full rounded-xl border-2 border-[#e5bdaa] bg-white px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:border-[#e51422] focus-visible:ring-2 focus-visible:ring-[#e51422]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors h-11"
              {...register('gender')}
            >
              <option value="MALE">{t('account.genders.male', 'Masculino')}</option>
              <option value="FEMALE">{t('account.genders.female', 'Femenino')}</option>
              <option value="OTHER">{t('account.genders.other', 'Otro / Prefiero no decir')}</option>
            </select>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-dob" className="font-semibold text-neutral-800">
              {t('account.dob', 'Fecha de Nacimiento')}
            </FieldLabel>
            <Input
              id="edit-dob"
              type="date"
              disabled={isPending}
              className="border-2 border-[#e5bdaa] rounded-xl focus-visible:border-[#e51422] focus-visible:ring-2 focus-visible:ring-[#e51422]/20 bg-white transition-colors h-11"
              {...register('date_of_birth')}
            />
          </Field>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f5cfb9]">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-full border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold px-5 h-11 cursor-pointer transition-all"
          >
            <X className="size-4 mr-1.5" />
            <span>{t('account.cancel', 'Cancelar')}</span>
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[#e51422] hover:bg-[#cf101c] text-white font-bold px-6 h-11 shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
          >
            {isPending ? (
              <>
                <Spinner className="size-4 mr-1.5" />
                <span>{t('account.saving', 'Guardando...')}</span>
              </>
            ) : (
              <>
                <Check className="size-4 mr-1.5" />
                <span>{t('account.save', 'Guardar cambios')}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
