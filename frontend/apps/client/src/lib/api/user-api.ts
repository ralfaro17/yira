import axios, { isAxiosError } from 'axios'
import { getCsrfToken } from '@/lib/auth/csrf'
import type {
  UserProfile,
  UpdateProfilePayload,
  UploadProfilePictureResult,
} from '@/features/auth/types'

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

// Attach Django CSRF token to modifying requests
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken()
  if (csrfToken && config.headers) {
    config.headers['X-CSRFToken'] = csrfToken
  }
  return config
})

/**
 * Fetch a user's public profile by numeric ID or username.
 */
export async function fetchUserProfile(idOrUsername: string): Promise<UserProfile> {
  try {
    const response = await apiClient.get<UserProfile>(`/users/${encodeURIComponent(idOrUsername)}/`)
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.detail || `Error al obtener el perfil (HTTP ${error.response.status})`)
    }
    throw error
  }
}

/**
 * Fetch the authenticated user's profile.
 */
export async function fetchCurrentUserProfile(): Promise<UserProfile> {
  try {
    const response = await apiClient.get<UserProfile>('/users/me/')
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.detail || `Error al obtener tu perfil (HTTP ${error.response.status})`)
    }
    throw error
  }
}

/**
 * Update the authenticated user's profile information.
 */
export async function updateCurrentUserProfile(
  payload: UpdateProfilePayload
): Promise<UserProfile> {
  try {
    const response = await apiClient.patch<UserProfile>('/users/me/', payload)
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errors = error.response.data
      const firstError = typeof errors === 'object' && errors !== null
        ? Object.values(errors).flat()[0]
        : null
      throw new Error(
        typeof firstError === 'string' && firstError
          ? firstError
          : 'No se pudo actualizar el perfil.'
      )
    }
    throw error
  }
}

/**
 * Upload a profile picture to AWS S3.
 */
export async function uploadProfilePicture(
  file: File
): Promise<UploadProfilePictureResult> {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await apiClient.post<UploadProfilePictureResult>(
      '/users/me/profile-picture/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.detail || 'No se pudo subir la foto de perfil.')
    }
    throw error
  }
}

/**
 * Delete the current user's profile picture from AWS S3.
 */
export async function deleteProfilePicture(): Promise<{ success: boolean; has_profile_picture: boolean }> {
  try {
    const response = await apiClient.delete<{ success: boolean; has_profile_picture: boolean }>(
      '/users/me/profile-picture/'
    )
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.detail || 'No se pudo eliminar la foto de perfil.')
    }
    throw error
  }
}

