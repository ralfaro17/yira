import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

import { api, ensureCsrf } from "./client"
import type { Alert, Dashboard, Me, Paginated, SessionResponse, SessionUser, SystemsResponse } from "./types"

const AUTH = "/_allauth/browser/v1/auth"

export const queryKeys = {
  session: ["session"] as const,
  dashboard: ["dashboard"] as const,
  systems: (id: number) => ["systems", id] as const,
  alerts: (params: object) => ["alerts", params] as const,
  me: ["me"] as const,
}

// --------------------------------------------------------------------- auth

/** Current allauth session user, or `null` when logged out. */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async (): Promise<SessionUser | null> => {
      try {
        const { data } = await api.get<SessionResponse>(`${AUTH}/session`)
        return data.data.user
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return null
        throw error
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}

export interface LoginInput {
  login: string // email or username
  password: string
  remember: boolean
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ login, password, remember }: LoginInput) => {
      await ensureCsrf()
      const credentials = login.includes("@") ? { email: login } : { username: login }
      const { data } = await api.post<SessionResponse>(`${AUTH}/login`, { ...credentials, password })
      // allauth rotates the CSRF token on login; the cookie is updated automatically.
      await api.post("/api/health/me/session/", { remember })
      return data.data.user
    },
    onSuccess: (user) => {
      qc.clear()
      qc.setQueryData(queryKeys.session, user)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await ensureCsrf()
      try {
        await api.delete(`${AUTH}/session`)
      } catch (error) {
        // allauth answers a successful logout with 401 ("not authenticated anymore").
        if (!(axios.isAxiosError(error) && error.response?.status === 401)) throw error
      }
    },
    onSuccess: () => {
      qc.clear()
      qc.setQueryData(queryKeys.session, null)
    },
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      await ensureCsrf()
      await api.post(`/_allauth/browser/v1/auth/password/request`, { email })
    },
  })
}

// --------------------------------------------------------------------- health data

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => (await api.get<Dashboard>("/api/health/dashboard/")).data,
    refetchInterval: 60_000,
  })
}

/** One crew member from the dashboard payload (status, systems, latest vitals...). */
export function useCrewMember(id: number | undefined) {
  const dashboard = useDashboard()
  const index = dashboard.data?.crew.findIndex((c) => c.id === id) ?? -1
  const crew = dashboard.data?.crew ?? []
  return {
    ...dashboard,
    member: index >= 0 ? crew[index] : undefined,
    next: crew.length > 1 && index >= 0 ? crew[(index + 1) % crew.length] : undefined,
    previous: crew.length > 1 && index >= 0 ? crew[(index - 1 + crew.length) % crew.length] : undefined,
  }
}

export function useSystems(id: number | undefined, days = 7) {
  return useQuery({
    queryKey: queryKeys.systems(id ?? -1),
    queryFn: async () => (await api.get<SystemsResponse>(`/api/health/crew/${id}/systems/`, { params: { days } })).data,
    enabled: id !== undefined,
  })
}

/** Latest vitals for the live scan panel; polls while `enabled`. */
export function useLatestVitals(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ["latest", id],
    queryFn: async () => {
      const { data } = await api.get<Dashboard>("/api/health/dashboard/")
      return data.crew.find((c) => c.id === id) ?? null
    },
    enabled: id !== undefined && enabled,
    refetchInterval: enabled ? 5_000 : false,
  })
}

export function useAlerts(params: { acknowledged?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.alerts(params),
    queryFn: async () =>
      (
        await api.get<Paginated<Alert>>("/api/health/alerts/", {
          params: {
            limit: params.limit ?? 20,
            ...(params.acknowledged === undefined ? {} : { acknowledged: params.acknowledged }),
          },
        })
      ).data,
    refetchInterval: 60_000,
  })
}

export function useAcknowledgeAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await ensureCsrf()
      return (await api.post<{ acknowledged: number }>("/api/health/alerts/acknowledge-all/")).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await api.get<Me>("/api/health/me/")).data,
  })
}

export function useUpdateMe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Me>) => {
      await ensureCsrf()
      return (await api.patch<Me>("/api/health/me/", patch)).data
    },
    onSuccess: (me) => qc.setQueryData(queryKeys.me, me),
  })
}
