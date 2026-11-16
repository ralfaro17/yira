import type { SystemDriver } from "@/api/types"
import i18n from "@/i18n"

/** Translated name of a backend metric id ("heart_rate" → "Ritmo cardíaco" / "Heart rate"). */
export function metricLabel(metric: string, fallback?: string): string {
  const key = `metrics.${metric}`
  return i18n.exists(key) ? i18n.t(key) : (fallback ?? metric.replace(/_/g, " "))
}

/** Translated label of a system driver (the backend sends English labels). */
export function driverLabel(driver: Pick<SystemDriver, "metric" | "unit" | "label">): string {
  if (driver.metric === "radiation_dose" && driver.unit === "fraction") return i18n.t("metrics.radiation_budget")
  return metricLabel(driver.metric, driver.label)
}
