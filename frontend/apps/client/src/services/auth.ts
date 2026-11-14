/**
 * Central Authentication Service
 *
 * Exposes authentication operations communicating with the django-allauth headless API
 * via Axios, with session and CSRF token management.
 */

export {
  authApiClient,
  AllauthApiError,
  fetchAllauthConfig,
  fetchAuthSession,
  loginUser,
  signupUser,
  logoutUser,
  fetchEmailVerificationInfo,
  verifyEmail,
  requestPasswordReset,
  fetchPasswordResetInfo,
  resetPassword,
} from '@/lib/auth/auth-api'

export {
  apiClient,
  fetchUserProfile,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from '@/lib/api/user-api'

export { getCsrfToken } from '@/lib/auth/csrf'

export type {
  AccountConfiguration,
  AllauthConfigResponse,
  AllauthErrorResponse,
  AllauthFieldError,
  AuthSessionData,
  AuthSessionResponse,
  EmailVerificationInfo,
  EmailVerificationInfoResponse,
  Flow,
  Interest,
  LoginPayload,
  LoginResult,
  PasswordResetInfo,
  PasswordResetInfoResponse,
  ResetPasswordPayload,
  ResetPasswordResult,
  SignupPayload,
  SignupResult,
  UpdateProfilePayload,
  UploadProfilePictureResult,
  User,
  UserProfile,
  VerifyEmailResult,
} from '@/features/auth/types'

