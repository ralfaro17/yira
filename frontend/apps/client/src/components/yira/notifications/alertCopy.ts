import type { Alert } from "@/api/types"

interface MetricCopy {
  /** Noun phrase, capitalised: "Ritmo cardíaco". */
  label: string
  unit: string
  digits: number
}

export const METRIC_COPY: Record<string, MetricCopy> = {
  heart_rate: { label: "Ritmo cardíaco", unit: "bpm", digits: 0 },
  hrv_rmssd: { label: "Variabilidad cardíaca", unit: "ms", digits: 0 },
  spo2: { label: "Oxígeno en sangre", unit: "%", digits: 0 },
  systolic_bp: { label: "Presión sistólica", unit: "mmHg", digits: 0 },
  diastolic_bp: { label: "Presión diastólica", unit: "mmHg", digits: 0 },
  respiratory_rate: { label: "Frecuencia respiratoria", unit: "rpm", digits: 0 },
  body_temp: { label: "Temperatura corporal", unit: "°C", digits: 1 },
  sleep_duration: { label: "Horas de sueño", unit: "h", digits: 1 },
  radiation_dose: { label: "Radiación", unit: "mSv", digits: 2 },
  cabin_co2: { label: "CO₂ en cabina", unit: "mmHg", digits: 1 },
  exercise_minutes: { label: "Ejercicio de resistencia", unit: "min", digits: 0 },
}

function copyFor(metric: string): MetricCopy {
  return METRIC_COPY[metric] ?? { label: metric.replace(/_/g, " "), unit: "", digits: 1 }
}

function lower(label: string) {
  // Keep acronyms such as "CO₂" intact.
  return /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1)
}

/** Short Spanish headline for an alert ("Ritmo cardíaco fuera de rango"). */
export function alertTitle(alert: Pick<Alert, "kind" | "metric">): string {
  const { label } = copyFor(alert.metric)
  switch (alert.kind) {
    case "threshold":
      return alert.metric === "radiation_dose" ? "Dosis de radiación elevada en 24 h" : `${label} fuera de rango`
    case "anomaly":
      return `${label} inusual`
    case "trend":
      return `Tendencia en ${lower(label)}`
    case "cumulative":
      return alert.metric === "radiation_dose" ? "Dosis de radiación acumulada" : `${label} acumulado`
    default:
      return label
  }
}

/** One-line Spanish summary derived from metric + value (falls back to the backend message). */
export function alertSummary(alert: Pick<Alert, "kind" | "metric" | "value" | "severity" | "message" | "occurrences">): string {
  const { label, unit, digits } = copyFor(alert.metric)
  const severity = alert.severity === "critical" ? "nivel crítico" : alert.severity === "warning" ? "requiere atención" : "informativo"
  const repeated = alert.occurrences > 1 ? ` · ${alert.occurrences} veces` : ""
  if (alert.value == null) return alert.message
  const value = `${alert.value.toFixed(digits)}${unit === "%" ? "" : " "}${unit}`.trim()
  switch (alert.kind) {
    case "threshold":
      return alert.metric === "radiation_dose"
        ? `${value} en las últimas 24 h (${severity})${repeated}`
        : `${label} registró ${value} (${severity})${repeated}`
    case "anomaly":
      return `${label} en ${value}, lejos de su valor habitual${repeated}`
    case "trend":
      return `${alert.value > 0 ? "Sube" : "Baja"} ${Math.abs(alert.value).toFixed(2)} ${unit} por día en los últimos días`
    case "cumulative":
      return `Dosis acumulada de ${value} (${severity})`
    default:
      return alert.message
  }
}
