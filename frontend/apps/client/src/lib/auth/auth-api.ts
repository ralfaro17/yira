import axios, { isAxiosError } from 'axios'
import { getCsrfToken } from './csrf'
import type {
  AllauthConfigResponse,
  AllauthErrorResponse,
  AllauthFieldError,
  AuthSessionResponse,
  EmailVerificationInfoResponse,
  LoginPayload,
  LoginResult,
  PasswordResetInfoResponse,
  ResetPasswordPayload,
  ResetPasswordResult,
  SignupPayload,
  SignupResult,
  VerifyEmailResult,
} from '@/features/auth/types'

export class AllauthApiError extends Error {
  status: number
  errors: AllauthFieldError[]

  constructor(message: string, status: number, errors: AllauthFieldError[] = []) {
    super(message)
    this.name = 'AllauthApiError'
    this.status = status
    this.errors = errors
  }

  getParamError(param: string): string | undefined {
    return this.errors.find((err) => err.param === param)?.message
  }

  getNonFieldErrors(): string[] {
    return this.errors
      .filter((err) => !err.param || err.param === '__all__')
      .map((err) => err.message)
  }
}

const BASE_URL = '/_allauth/browser/v1'

/**
 * Axios instance configured for allauth headless browser client.
 * Includes credentials (cookies) and automatic CSRF header injection.
 */
export const authApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Request interceptor ensuring Django CSRF token is attached
authApiClient.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken()
  if (csrfToken && config.headers) {
    config.headers['X-CSRFToken'] = csrfToken
  }
  return config
})

/**
 * Ensures a CSRF cookie exists before mutating requests.
 */
async function ensureCsrfToken(): Promise<void> {
  if (!getCsrfToken()) {
    try {
      await fetchAllauthConfig()
    } catch {
      // Ignore error if config fetch fails
    }
  }
}

/**
 * Fetches allauth configuration for browser clients.
 * This also triggers Django's CSRF cookie generation.
 */
export async function fetchAllauthConfig(): Promise<AllauthConfigResponse> {
  try {
    const response = await authApiClient.get<AllauthConfigResponse>('/config')
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new AllauthApiError(
        `Error al cargar la configuración: HTTP ${error.response.status}`,
        error.response.status
      )
    }
    throw error
  }
}

/**
 * Retrieves the current session status for the browser.
 * Status 200 = Authenticated, Status 401 = Unauthenticated.
 */
export async function fetchAuthSession(): Promise<AuthSessionResponse> {
  try {
    const response = await authApiClient.get<AuthSessionResponse>('/auth/session')
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        return error.response.data as AuthSessionResponse
      }
      throw new AllauthApiError(
        `Error al consultar la sesión (HTTP ${error.response.status})`,
        error.response.status
      )
    }
    throw error
  }
}

/**
 * Authenticates a user using the allauth headless browser login endpoint.
 * POST /_allauth/browser/v1/auth/login
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
  await ensureCsrfToken()

  try {
    const response = await authApiClient.post('/auth/login', payload)

    if (response.status === 200 && response.data?.data?.user) {
      return {
        type: 'authenticated',
        user: response.data.data.user,
        status: 200,
      }
    }

    throw new AllauthApiError(
      `Respuesta inesperada al iniciar sesión (HTTP ${response.status})`,
      response.status
    )
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const status = error.response.status
      const resData = error.response.data

      // 401: Verification or additional step pending
      if (status === 401) {
        const flows = resData?.data?.flows || []
        const isEmailVerificationPending = flows.some(
          (f: { id: string; is_pending?: boolean }) =>
            f.id === 'verify_email' && f.is_pending === true
        )

        if (isEmailVerificationPending) {
          return {
            type: 'pending_email_verification',
            flows,
            status: 401,
            email: payload.email,
          }
        }

        const is2FAPending = flows.some(
          (f: { id: string; is_pending?: boolean }) =>
            (f.id === 'mfa_authenticate' || f.id === 'mfa_reauthenticate') &&
            f.is_pending === true
        )

        if (is2FAPending) {
          return {
            type: 'pending_2fa',
            flows,
            status: 401,
          }
        }

        throw new AllauthApiError(
          'Credenciales incorrectas o se requiere autenticación adicional.',
          401
        )
      }

      // 400 Bad Request: Validation errors or invalid email/password mismatch
      if (status === 400) {
        const errorBody = resData as AllauthErrorResponse | null
        const errors = errorBody?.errors || []
        const firstMessage =
          errors[0]?.message ||
          'El correo electrónico y/o contraseña especificados no son correctos.'
        throw new AllauthApiError(firstMessage, 400, errors)
      }

      // 409 Conflict: Already authenticated
      if (status === 409) {
        throw new AllauthApiError(
          'Ya has iniciado sesión en el sistema. Cierra sesión para acceder con otra cuenta.',
          409
        )
      }

      throw new AllauthApiError(
        `Error inesperado al iniciar sesión (HTTP ${status})`,
        status
      )
    }

    if (error instanceof AllauthApiError) {
      throw error
    }

    throw new AllauthApiError(
      'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.',
      0
    )
  }
}

/**
 * Registers a new user using the allauth headless browser signup endpoint.
 */
export async function signupUser(payload: SignupPayload): Promise<SignupResult> {
  await ensureCsrfToken()

  try {
    const response = await authApiClient.post('/auth/signup', payload)

    // Success 200: directly authenticated
    if (response.status === 200 && response.data?.data?.user) {
      return {
        type: 'authenticated',
        user: response.data.data.user,
        status: 200,
      }
    }

    throw new AllauthApiError(
      `Error inesperado al registrar el usuario (HTTP ${response.status})`,
      response.status
    )
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const status = error.response.status
      const resJson = error.response.data

      // Pending verification 401
      if (status === 401) {
        const flows = resJson?.data?.flows || []
        const isEmailVerificationPending = flows.some(
          (f: { id: string; is_pending?: boolean }) =>
            f.id === 'verify_email' && f.is_pending === true
        )

        if (isEmailVerificationPending) {
          return {
            type: 'pending_email_verification',
            flows,
            status: 401,
            email: payload.email,
          }
        }

        throw new AllauthApiError(
          'La solicitud no pudo ser completada. Se requiere autenticación previa.',
          401
        )
      }

      // 400 Bad Request
      if (status === 400) {
        const errorBody = resJson as AllauthErrorResponse | null
        const errors = errorBody?.errors || []
        const firstMessage =
          errors[0]?.message || 'Hubo un error de validación con los datos enviados.'
        throw new AllauthApiError(firstMessage, 400, errors)
      }

      // 403 Forbidden
      if (status === 403) {
        throw new AllauthApiError(
          'El registro de nuevas cuentas está cerrado temporalmente.',
          403
        )
      }

      // 409 Conflict
      if (status === 409) {
        throw new AllauthApiError(
          'Ya has iniciado sesión en el sistema. Cierra sesión para registrar una cuenta nueva.',
          409
        )
      }

      throw new AllauthApiError(
        `Error inesperado al registrar el usuario (HTTP ${status})`,
        status
      )
    }

    if (error instanceof AllauthApiError) {
      throw error
    }

    throw new AllauthApiError(
      'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.',
      0
    )
  }
}

/**
 * Ends the current authenticated browser session.
 * DELETE /_allauth/browser/v1/auth/session
 * Note: allauth returns HTTP 401 (Unauthenticated response) upon successful logout.
 */
export async function logoutUser(): Promise<void> {
  await ensureCsrfToken()
  try {
    await authApiClient.delete('/auth/session')
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      // Expected from allauth
      return
    }
    // Don't throw if logout fails network-wise
  }
}

/**
 * Fetches metadata about an email verification key.
 * GET /_allauth/browser/v1/auth/email/verify with X-Email-Verification-Key header.
 */
export async function fetchEmailVerificationInfo(
  key: string
): Promise<EmailVerificationInfoResponse> {
  try {
    const response = await authApiClient.get<EmailVerificationInfoResponse>(
      '/auth/email/verify',
      {
        headers: {
          'X-Email-Verification-Key': key,
        },
      }
    )
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errors = error.response.data?.errors || []
      const firstMessage =
        errors[0]?.message || `Error al verificar la clave (HTTP ${error.response.status})`
      throw new AllauthApiError(firstMessage, error.response.status, errors)
    }
    throw error
  }
}

/**
 * Submits an email verification key to confirm the user's email address.
 * POST /_allauth/browser/v1/auth/email/verify with body { key }.
 */
export async function verifyEmail(key: string): Promise<VerifyEmailResult> {
  await ensureCsrfToken()

  try {
    const response = await authApiClient.post('/auth/email/verify', { key })
    if (response.status === 200 && response.data?.data?.user) {
      return { type: 'verified_and_logged_in', user: response.data.data.user, status: 200 }
    }
    throw new AllauthApiError(
      `Error al confirmar el correo electrónico (HTTP ${response.status})`,
      response.status
    )
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        return { type: 'verified_pending_login', status: 401 }
      }
      const errors = error.response.data?.errors || []
      const firstMessage =
        errors[0]?.message ||
        `Error al confirmar el correo electrónico (HTTP ${error.response.status})`
      throw new AllauthApiError(firstMessage, error.response.status, errors)
    }
    throw error
  }
}

/**
 * Requests a password reset link to be sent via email.
 * POST /_allauth/browser/v1/auth/password/request with body { email }
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await ensureCsrfToken()

  try {
    await authApiClient.post('/auth/password/request', { email: email.trim() })
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errors = error.response.data?.errors || []
      const firstMessage =
        errors[0]?.message ||
        `Error al solicitar el restablecimiento de contraseña (HTTP ${error.response.status})`
      throw new AllauthApiError(firstMessage, error.response.status, errors)
    }
    if (error instanceof AllauthApiError) throw error
    throw new AllauthApiError(
      'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.',
      0
    )
  }
}

/**
 * Fetches password reset info (and validates the key) from allauth.
 * GET /_allauth/browser/v1/auth/password/reset with X-Password-Reset-Key header
 */
export async function fetchPasswordResetInfo(
  key: string
): Promise<PasswordResetInfoResponse> {
  try {
    const response = await authApiClient.get<PasswordResetInfoResponse>(
      '/auth/password/reset',
      {
        headers: {
          'X-Password-Reset-Key': key,
        },
      }
    )
    return response.data
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      const errors = error.response.data?.errors || []
      const firstMessage =
        errors[0]?.message ||
        `El enlace de recuperación es inválido o ha expirado (HTTP ${error.response.status})`
      throw new AllauthApiError(firstMessage, error.response.status, errors)
    }
    throw error
  }
}

/**
 * Submits the new password using the reset key.
 * POST /_allauth/browser/v1/auth/password/reset with body { key, password }
 */
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResult> {
  await ensureCsrfToken()

  try {
    const response = await authApiClient.post('/auth/password/reset', {
      key: payload.key,
      password: payload.password,
    })

    if (response.status === 200 && response.data?.data?.user) {
      return {
        type: 'authenticated',
        user: response.data.data.user,
        status: 200,
      }
    }

    return {
      type: 'reset_success_login_required',
      status: response.status as 200 | 401,
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        return {
          type: 'reset_success_login_required',
          status: 401,
        }
      }
      const errors = error.response.data?.errors || []
      const firstMessage =
        errors[0]?.message ||
        `Error al restablecer la contraseña (HTTP ${error.response.status})`
      throw new AllauthApiError(firstMessage, error.response.status, errors)
    }
    if (error instanceof AllauthApiError) throw error
    throw new AllauthApiError(
      'No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.',
      0
    )
  }
}

