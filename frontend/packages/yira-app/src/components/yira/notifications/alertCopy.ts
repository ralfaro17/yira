import type { Alert } from "@/api/types"
import i18n, { currentLanguage } from "@/i18n"
import { metricLabel } from "@/lib/metrics"

interface MetricCopy {
  /** Noun phrase, capitalised, in the current language: "Ritmo cardíaco" / "Heart rate". */
  label: string
  unit: string
  digits: number
}

const METRIC_FORMAT: Record<string, Omit<MetricCopy, "label">> = {
  heart_rate: { unit: "bpm", digits: 0 },
  hrv_rmssd: { unit: "ms", digits: 0 },
  spo2: { unit: "%", digits: 0 },
  systolic_bp: { unit: "mmHg", digits: 0 },
  diastolic_bp: { unit: "mmHg", digits: 0 },
  respiratory_rate: { unit: "rpm", digits: 0 },
  body_temp: { unit: "°C", digits: 1 },
  sleep_duration: { unit: "h", digits: 1 },
  radiation_dose: { unit: "mSv", digits: 2 },
  cabin_co2: { unit: "mmHg", digits: 1 },
  exercise_minutes: { unit: "min", digits: 0 },
}

/** Label (translated on every read), unit and precision for each known metric. */
export const METRIC_COPY: Record<string, MetricCopy> = Object.fromEntries(
  Object.entries(METRIC_FORMAT).map(([metric, format]) => [
    metric,
    {
      ...format,
      get label() {
        return metricLabel(metric)
      },
    },
  ]),
)

function copyFor(metric: string): MetricCopy {
  return METRIC_COPY[metric] ?? { label: metricLabel(metric), unit: "", digits: 1 }
}

/** Lower-case a label mid-sentence; English keeps its capitalisation in the title patterns. */
function lower(label: string) {
  // Keep acronyms such as "CO₂" intact.
  return /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1)
}

/** Short headline for an alert ("Ritmo cardíaco fuera de rango" / "Heart rate out of range"). */
export function alertTitle(alert: Pick<Alert, "kind" | "metric">): string {
  const { label } = copyFor(alert.metric)
  const radiation = alert.metric === "radiation_dose"
  switch (alert.kind) {
    case "threshold":
      return radiation
        ? i18n.t("notifications.title_.radiationThreshold")
        : i18n.t("notifications.title_.threshold", { label })
    case "anomaly":
      return i18n.t("notifications.title_.anomaly", { label: currentLanguage() === "en" ? lower(label) : label })
    case "trend":
      return i18n.t("notifications.title_.trend", { label: currentLanguage() === "en" ? label : lower(label) })
    case "cumulative":
      return radiation
        ? i18n.t("notifications.title_.radiationCumulative")
        : i18n.t("notifications.title_.cumulative", { label: currentLanguage() === "en" ? lower(label) : label })
    default:
      return label
  }
}

/** One-line summary derived from metric + value (never the English-only backend message). */
export function alertSummary(alert: Pick<Alert, "kind" | "metric" | "value" | "severity" | "occurrences">): string {
  const { label, unit, digits } = copyFor(alert.metric)
  const severity = i18n.t(
    alert.severity === "critical"
      ? "notifications.severity.critical"
      : alert.severity === "warning"
        ? "notifications.severity.warning"
        : "notifications.severity.info",
  )
  const repeated = alert.occurrences > 1 ? i18n.t("notifications.repeated", { count: alert.occurrences }) : ""
  if (alert.value == null) return i18n.t("notifications.summary.noValue", { label, severity, repeated })
  const value = `${alert.value.toFixed(digits)}${unit === "%" ? "" : " "}${unit}`.trim()
  switch (alert.kind) {
    case "threshold":
      return alert.metric === "radiation_dose"
        ? i18n.t("notifications.summary.radiationThreshold", { value, severity, repeated })
        : i18n.t("notifications.summary.threshold", { label, value, severity, repeated })
    case "anomaly":
      return i18n.t("notifications.summary.anomaly", { label, value, repeated })
    case "trend":
      return i18n.t(alert.value > 0 ? "notifications.summary.trendUp" : "notifications.summary.trendDown", {
        value: Math.abs(alert.value).toFixed(2),
        unit,
      })
    case "cumulative":
      return i18n.t("notifications.summary.cumulative", { value, severity })
    default:
      return i18n.t("notifications.summary.noValue", { label, severity, repeated })
  }
}
