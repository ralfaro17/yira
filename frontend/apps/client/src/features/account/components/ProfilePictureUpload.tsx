import { useState, useRef } from 'react'
import { Camera, Trash2, Upload, User as UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import {
  useUploadProfilePictureMutation,
  useDeleteProfilePictureMutation,
} from '@/features/auth/hooks/use-auth-queries'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  hasProfilePicture: boolean
  displayName: string
}

export function ProfilePictureUpload({
  currentImageUrl,
  hasProfilePicture,
  displayName,
}: ProfilePictureUploadProps) {
  const { t } = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadProfilePictureMutation()
  const deleteMutation = useDeleteProfilePictureMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        type: 'error',
        title: t('account.photoSizeErrorTitle', 'Archivo demasiado grande'),
        description: t('account.photoSizeError', 'La imagen no debe superar los 5MB de tamaño.'),
      })
      return
    }

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.add({
        type: 'error',
        title: t('account.photoFormatErrorTitle', 'Formato no compatible'),
        description: t('account.photoFormatError', 'Por favor selecciona un archivo PNG, JPEG o WebP.'),
      })
      return
    }

    setSelectedFile(file)
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
  }

  const handleUpload = () => {
    if (!selectedFile) return

    uploadMutation.mutate(selectedFile, {
      onSuccess: () => {
        toast.add({
          type: 'success',
          title: t('account.toastPhotoSuccessTitle', 'Foto actualizada'),
          description: t('account.toastPhotoSuccessDesc', 'Tu foto de perfil se guardó correctamente.'),
        })
        setSelectedFile(null)
        setPreviewUrl(null)
      },
      onError: (err) => {
        toast.add({
          type: 'error',
          title: t('account.toastPhotoErrorTitle', 'Error al subir'),
          description: err.message || 'No se pudo subir la foto de perfil.',
        })
      },
    })
  }

  const handleDelete = () => {
    if (!confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?')) return

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.add({
          type: 'info',
          title: t('account.deletePhoto', 'Foto eliminada'),
          description: 'Tu foto de perfil ha sido eliminada.',
        })
        setSelectedFile(null)
        setPreviewUrl(null)
      },
      onError: (err) => {
        toast.add({
          type: 'error',
          title: t('account.toastPhotoErrorTitle', 'Error al eliminar'),
          description: err.message || 'No se pudo eliminar la foto de perfil.',
        })
      },
    })
  }

  const handleCancelPreview = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const isUploading = uploadMutation.isPending
  const isDeleting = deleteMutation.isPending

  const displayedImage = previewUrl || (hasProfilePicture ? currentImageUrl : null)

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || 'U'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-border/70 bg-card/60">
      {/* Avatar Container */}
      <div className="relative group">
        <Avatar size="lg" className="size-24 sm:size-28 border-2 border-primary/20 shadow-md">
          {displayedImage ? (
            <AvatarImage
              src={displayedImage}
              alt={displayName}
              className="object-cover"
            />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl sm:text-2xl flex flex-col items-center justify-center">
            {initials ? initials : <UserIcon className="size-10 text-muted-foreground" />}
          </AvatarFallback>
        </Avatar>

        {/* Change Picture Trigger Overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDeleting}
          className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
          title={t('account.changePhoto', 'Cambiar foto de perfil')}
        >
          <Camera className="size-6" />
          <span className="text-[10px] font-medium">{t('account.changePhoto', 'Cambiar')}</span>
        </button>
      </div>

      {/* Upload Controls */}
      <div className="flex-1 space-y-3 text-center sm:text-left">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {t('account.myProfile', 'Foto de perfil')}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('account.photoFormatError', 'Sube una imagen cuadrada en formato PNG, JPEG o WebP (máx. 5MB).')}
          </p>
        </div>

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || isDeleting}
        />

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {selectedFile ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={handleUpload}
                disabled={isUploading}
                className="gap-1.5 cursor-pointer shadow-xs"
              >
                {isUploading ? (
                  <>
                    <Spinner className="size-3.5" />
                    <span>{t('account.saving', 'Guardando...')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    <span>{t('account.save', 'Confirmar subida')}</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCancelPreview}
                disabled={isUploading}
                className="text-xs cursor-pointer"
              >
                {t('account.cancel', 'Cancelar')}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isDeleting}
                className="gap-1.5 cursor-pointer"
              >
                <Camera className="size-3.5" />
                <span>
                  {hasProfilePicture
                    ? t('account.changePhoto', 'Cambiar imagen')
                    : t('account.uploadPhoto', 'Subir imagen')}
                </span>
              </Button>

              {hasProfilePicture && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={isUploading || isDeleting}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Spinner className="size-3.5" />
                      <span>{t('common.loading', 'Eliminando...')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      <span>{t('account.deletePhoto', 'Eliminar foto')}</span>
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
