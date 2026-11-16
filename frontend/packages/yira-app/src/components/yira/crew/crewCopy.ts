import type { SystemDriver } from "@/api/types"
import i18n from "@/i18n"
import { driverLabel } from "@/lib/metrics"

/** Crew role, translating the value the demo data seeds ("Tripulante"). */
export function crewRole(role: string | null | undefined): string {
  return !role || role === "Tripulante" ? i18n.t("crew.defaultRole") : role
}

/** Mission name, translating the value the demo data seeds ("Misión a Marte"). */
export function missionName(mission: string): string {
  return mission === "Misión a Marte" ? i18n.t("crew.defaultMission") : mission
}

function num(value: number, digits = 1) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits)
}

/** "Ritmo cardíaco: 112 bpm" parts for a system driver (radiation budget shown as a percentage). */
export function driverText(driver: Pick<SystemDriver, "metric" | "label" | "unit" | "value">) {
  const value =
    driver.unit === "fraction" ? `${Math.round(driver.value * 100)} %` : `${num(driver.value)} ${driver.unit}`.trimEnd()
  return { label: driverLabel(driver), value }
}
