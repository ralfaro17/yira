export interface AccountConfiguration {
  login_methods: string[]
  is_open_for_signup: boolean
  email_verification_by_code_enabled: boolean
  login_by_code_enabled: boolean
  password_reset_by_code_enabled: boolean
  authentication_method?: string
}

export interface AllauthConfigResponse {
  status: 200
  data: {
    account: AccountConfiguration
    socialaccount?: {
      providers: Array<{
        id: string
        name: string
        flows?: string[]
        client_id?: string
      }>
    }
    mfa?: {
      supported_types: string[]
      passkey_login_enabled?: boolean
    }
    usersessions?: {
      track_activity: boolean
    }
  }
}

export interface User {
  id: number | string
  display: string
  has_usable_password: boolean
  email?: string
  username?: string
}

export interface Flow {
  id:
    | 'login'
    | 'login_by_code'
    | 'mfa_authenticate'
    | 'mfa_reauthenticate'
    | 'provider_redirect'
    | 'provider_signup'
    | 'provider_token'
    | 'reauthenticate'
    | 'signup'
    | 'verify_email'
    | 'verify_phone'
  is_pending?: boolean
  types?: string[]
}

export interface AuthSessionData {
  user?: User
  flows?: Flow[]
  methods?: Array<{
    method: string
    at: number
    email?: string
    username?: string
  }>
}

export interface AuthSessionResponse {
  status: number
  data?: AuthSessionData
  meta: {
    is_authenticated: boolean
    session_token?: string
  }
}

export interface AllauthFieldError {
  message: string
  code: string
  param?: string
}

export interface AllauthErrorResponse {
  status: number
  errors?: AllauthFieldError[]
}

export interface SignupPayload {
  username: string
  email: string
  password: string
  phone?: string
}

export type SignupResult =
  | {
      type: 'authenticated'
      user: User
      status: 200
    }
  | {
      type: 'pending_email_verification'
      flows: Flow[]
      status: 401
      email: string
    }

// ---------- Login ----------

export interface LoginPayload {
  email?: string
  username?: string
  password: string
}

export type LoginResult =
  | {
      type: 'authenticated'
      user: User
      status: 200
    }
  | {
      type: 'pending_email_verification'
      flows: Flow[]
      status: 401
      email?: string
    }
  | {
      type: 'pending_2fa'
      flows: Flow[]
      status: 401
    }

// ---------- Password Reset ----------

export interface RequestPasswordResetPayload {
  email: string
}

export interface PasswordResetInfo {
  user: User
}

export interface PasswordResetInfoResponse {
  status: 200
  data: PasswordResetInfo
}

export interface ResetPasswordPayload {
  key: string
  password: string
}

export type ResetPasswordResult =
  | {
      type: 'authenticated'
      user: User
      status: 200
    }
  | {
      type: 'reset_success_login_required'
      status: 401 | 200
    }

// ---------- Email Verification ----------

export interface EmailVerificationInfo {
  email: string
  user?: User
}

export interface EmailVerificationInfoResponse {
  status: 200
  data: EmailVerificationInfo
}

export type VerifyEmailResult =
  | {
      type: 'verified_and_logged_in'
      user: User
      status: 200
    }
  | {
      type: 'verified_pending_login'
      /** Session created but email-confirmation alone doesn't auto-login */
      status: 401
    }

// ---------- User Profiles & Accounts ----------

export interface Interest {
  id: number
  name: string
  description?: string | null
}

export interface UserProfile {
  id: number | string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  display: string
  user_type: 'TOURIST' | 'BUSINESS' | string
  biography?: string | null
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string
  date_of_birth?: string | null
  date_joined?: string
  interests?: Interest[]
  has_profile_picture: boolean
  profile_picture_url?: string | null
  is_own_profile?: boolean
  is_premium?: boolean
  ai_generations_used?: number
  can_use_ai?: boolean
  can_host_group?: boolean
  free_trials_left?: number
}

export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  biography?: string
  gender?: string
  date_of_birth?: string | null
  interest_ids?: number[]
}

export interface UploadProfilePictureResult {
  success: boolean
  has_profile_picture: boolean
  profile_picture_url: string
  message: string
}
