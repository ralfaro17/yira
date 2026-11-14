import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllauthConfig,
  fetchAuthSession,
  fetchEmailVerificationInfo,
  loginUser,
  logoutUser,
  signupUser,
  verifyEmail,
  requestPasswordReset,
  fetchPasswordResetInfo,
  resetPassword,
  type AllauthApiError,
} from '@/lib/auth/auth-api'
import {
  type AllauthConfigResponse,
  type AuthSessionResponse,
  type EmailVerificationInfoResponse,
  type LoginPayload,
  type LoginResult,
  type PasswordResetInfoResponse,
  type ResetPasswordPayload,
  type ResetPasswordResult,
  type SignupPayload,
  type SignupResult,
  type UpdateProfilePayload,
  type UploadProfilePictureResult,
  type UserProfile,
  type VerifyEmailResult,
} from '@/features/auth/types'
import {
  fetchUserProfile,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from '@/lib/api/user-api'

export const authQueryKeys = {
  all: ['auth'] as const,
  config: () => [...authQueryKeys.all, 'config'] as const,
  session: () => [...authQueryKeys.all, 'session'] as const,
  emailVerificationInfo: (key: string) =>
    [...authQueryKeys.all, 'emailVerificationInfo', key] as const,
  passwordResetInfo: (key: string) =>
    [...authQueryKeys.all, 'passwordResetInfo', key] as const,
}

/**
 * Hook to retrieve allauth server configuration.
 * Fetched at initial load to initialize CSRF cookies and discover signup options.
 */
export function useAuthConfigQuery() {
  return useQuery<AllauthConfigResponse, AllauthApiError>({
    queryKey: authQueryKeys.config(),
    queryFn: fetchAllauthConfig,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  })
}

/**
 * Hook to check current authentication session status.
 */
export function useAuthSessionQuery() {
  return useQuery<AuthSessionResponse, AllauthApiError>({
    queryKey: authQueryKeys.session(),
    queryFn: fetchAuthSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
}

/**
 * Hook to perform user registration.
 */
export function useSignupMutation() {
  const queryClient = useQueryClient()

  return useMutation<SignupResult, AllauthApiError, SignupPayload>({
    mutationFn: (payload: SignupPayload) => signupUser(payload),
    onSuccess: () => {
      // Invalidate session cache so queries reflect new authentication status
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session() })
    },
  })
}

/**
 * Hook to look up metadata for an email verification key before confirming.
 * Only runs when a non-empty key is provided.
 */
export function useEmailVerificationInfoQuery(key?: string) {
  return useQuery<EmailVerificationInfoResponse, AllauthApiError>({
    queryKey: authQueryKeys.emailVerificationInfo(key ?? ''),
    queryFn: () => fetchEmailVerificationInfo(key!),
    enabled: Boolean(key),
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}

/**
 * Hook to confirm an email verification key.
 */
export function useVerifyEmailMutation() {
  const queryClient = useQueryClient()

  return useMutation<VerifyEmailResult, AllauthApiError, string>({
    mutationFn: (key: string) => verifyEmail(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session() })
    },
  })
}

/**
 * Hook to perform user login using TanStack Query mutation.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation<LoginResult, AllauthApiError, LoginPayload>({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (data) => {
      if (data.type === 'authenticated') {
        queryClient.invalidateQueries({ queryKey: authQueryKeys.session() })
      }
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, AllauthApiError, void>({
    mutationFn: () => logoutUser(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session() })
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
    },
  })
}

/**
 * Hook to request a password reset email.
 */
export function useRequestPasswordResetMutation() {
  return useMutation<void, AllauthApiError, string>({
    mutationFn: (email: string) => requestPasswordReset(email),
  })
}

/**
 * Hook to fetch password reset info and validate reset key.
 */
export function usePasswordResetInfoQuery(key?: string) {
  return useQuery<PasswordResetInfoResponse, AllauthApiError>({
    queryKey: authQueryKeys.passwordResetInfo(key ?? ''),
    queryFn: () => fetchPasswordResetInfo(key!),
    enabled: Boolean(key),
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}

/**
 * Hook to reset password using the key.
 */
export function useResetPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation<ResetPasswordResult, AllauthApiError, ResetPasswordPayload>({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
    onSuccess: (data) => {
      if (data.type === 'authenticated') {
        queryClient.invalidateQueries({ queryKey: authQueryKeys.session() })
      }
    },
  })
}

export const userQueryKeys = {
  all: ['users'] as const,
  me: () => [...userQueryKeys.all, 'me'] as const,
  profile: (idOrUsername: string) => [...userQueryKeys.all, 'profile', idOrUsername] as const,
}

/**
 * Hook to retrieve any user's public profile by ID or username.
 */
export function useUserProfileQuery(idOrUsername?: string) {
  return useQuery<UserProfile, Error>({
    queryKey: userQueryKeys.profile(idOrUsername || ''),
    queryFn: () => fetchUserProfile(idOrUsername!),
    enabled: Boolean(idOrUsername),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  })
}

/**
 * Hook to retrieve the current authenticated user's profile.
 */
export function useCurrentUserProfileQuery(options?: { enabled?: boolean }) {
  return useQuery<UserProfile, Error>({
    queryKey: userQueryKeys.me(),
    queryFn: fetchCurrentUserProfile,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  })
}

/**
 * Hook to update the current user's profile.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: (payload: UpdateProfilePayload) => updateCurrentUserProfile(payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userQueryKeys.me(), updatedProfile)
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
    },
  })
}

/**
 * Hook to upload a new profile picture to AWS S3.
 */
export function useUploadProfilePictureMutation() {
  const queryClient = useQueryClient()

  return useMutation<UploadProfilePictureResult, Error, File>({
    mutationFn: (file: File) => uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
    },
  })
}

/**
 * Hook to delete profile picture from AWS S3.
 */
export function useDeleteProfilePictureMutation() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean; has_profile_picture: boolean }, Error, void>({
    mutationFn: () => deleteProfilePicture(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
    },
  })
}
