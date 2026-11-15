// Types mirroring the Django `health` API and django-allauth headless responses.

export type CrewStatus = "stable" | "observation" | "critical" | "unknown"
export type SystemKey = "cardiovascular" | "immune" | "musculoskeletal" | "mental"
export type StressLevel = "low" | "medium" | "high"
export type Severity = "info" | "warning" | "critical"

export interface SessionUser {
  id: number
  display: string
  email: string | null
  username: string
  has_usable_password: boolean
}

export interface SessionResponse {
  status: number
  data: { user: SessionUser }
  meta: { is_authenticated: boolean }
}

export interface CrewMember {
  id: number
  name: string
  mission: string
  role: string
  date_of_birth: string | null
  sex: "F" | "M" | "X"
  height_cm: number | null
  mass_kg: number | null
  photo: string
  age: number | null
  created_at: string
}

export interface LatestValue {
  value: number
  recorded_at: string
  status: "normal" | "warning" | "critical" | "n/a"
  unit: string
}

export interface SystemScore {
  key: SystemKey
  score: number | null
  status: CrewStatus
  estimated: boolean
}

export interface SystemDriver {
  metric: string
  label: string
  unit: string
  value: number
  baseline_z: number | null
  penalty: number
}

export interface SystemDetail extends SystemScore {
  drivers: SystemDriver[]
}

export interface CurrentIssue {
  system: SystemKey
  status: CrewStatus
  score: number
  protocol: string | null
  driver: SystemDriver | null
}

export interface DailyScore {
  date: string
  score: number | null
  status: CrewStatus
}

export interface RiskResult {
  score: number
  level: "nominal" | "elevated" | "high" | "critical"
  components: { vitals: number; alerts: number; radiation: number }
  as_of: string | null
}

export interface DashboardCrew extends CrewMember {
  latest: Record<string, LatestValue>
  open_alerts: Partial<Record<Severity, number>>
  risk: RiskResult
  status: CrewStatus
  last_scan_at: string | null
  systems: SystemScore[]
  stress_level: StressLevel | null
  current_issue: CurrentIssue | null
  daily: DailyScore[]
}

export interface Dashboard {
  crew: DashboardCrew[]
  totals: {
    crew: number
    stable: number
    observation: number
    critical: number
    avg_heart_rate: number | null
    unread_alerts: number
  }
  disclaimer: string
}

export interface SystemsResponse {
  crew_member: number
  as_of: string | null
  status: CrewStatus
  risk_level: RiskResult["level"] | null
  systems: SystemDetail[]
  stress_level: StressLevel | null
  current_issue: CurrentIssue | null
  daily: DailyScore[]
}

export interface Alert {
  id: number
  crew_member: number
  crew_member_name: string
  metric: string
  kind: "threshold" | "anomaly" | "trend" | "cumulative"
  severity: Severity
  message: string
  value: number | null
  measurement: number | null
  triggered_at: string
  last_seen_at: string
  occurrences: number
  acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Me {
  username: string
  email: string
  display_name: string
  role_label: string
  photo: string
  language: string
  timezone: string
  emergency_alerts: boolean
  daily_summary_time: string
  units: "metric" | "imperial"
}
