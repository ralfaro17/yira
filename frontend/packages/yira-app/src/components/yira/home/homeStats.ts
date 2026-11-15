import type { CrewStatus, DashboardCrew } from "@/api/types"

const SEVERITY: Record<CrewStatus, number> = { unknown: 0, stable: 1, observation: 2, critical: 3 }

/** Worst immune-system status across the crew (unknown when nobody has a score). */
export function worstImmuneStatus(crew: DashboardCrew[]): CrewStatus {
  let worst: CrewStatus = "unknown"
  for (const member of crew) {
    const immune = member.systems.find((s) => s.key === "immune")
    if (immune && SEVERITY[immune.status] > SEVERITY[worst]) worst = immune.status
  }
  return worst
}

/** Most recent `last_scan_at` across the crew. */
export function newestScan(crew: DashboardCrew[]): string | null {
  let newest: string | null = null
  for (const member of crew) {
    if (member.last_scan_at && (!newest || member.last_scan_at > newest)) newest = member.last_scan_at
  }
  return newest
}
