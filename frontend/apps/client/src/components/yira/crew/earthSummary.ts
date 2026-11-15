import { format } from "date-fns"
import { es } from "date-fns/locale"

import type { CurrentIssue, DashboardCrew, StressLevel, SystemScore } from "@/api/types"
import { STATUS, STRESS_LABEL, SYSTEM_ISSUE_TITLE, SYSTEM_LABEL, SYSTEM_ORDER } from "@/lib/status"
import { timeAgo } from "@/lib/time"

const VITALS: { key: string; label: string; unit: string }[] = [
  { key: "heart_rate", label: "Frecuencia cardíaca", unit: "lpm" },
  { key: "spo2", label: "Saturación de oxígeno (SpO₂)", unit: "%" },
  { key: "body_temp", label: "Temperatura corporal", unit: "°C" },
]

function num(value: number, digits = 1) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits)
}

/** Plain-text report a flight surgeon can paste into a message to Earth. */
export function buildEarthSummary({
  member,
  systems,
  stress,
  issue,
}: {
  member: DashboardCrew
  systems: SystemScore[]
  stress: StressLevel | null
  issue: CurrentIssue | null
}): string {
  const lines: string[] = []
  lines.push(`RESUMEN PARA LA TIERRA · ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`)
  lines.push("")
  const age = member.age != null ? `, ${member.age} años` : ""
  lines.push(`Tripulante: ${member.name}${age}${member.role ? ` (${member.role})` : ""}`)
  if (member.mission) lines.push(`Misión: ${member.mission}`)
  lines.push(`Estado general: ${STATUS[member.status].label}`)
  lines.push(`Último escaneo: ${timeAgo(member.last_scan_at)}`)

  lines.push("")
  lines.push("Sistemas:")
  for (const key of SYSTEM_ORDER) {
    const system = systems.find((s) => s.key === key)
    if (!system) continue
    const score = system.score == null ? "sin datos" : `${Math.round(system.score)}/100`
    const estimated = system.estimated ? " (estimado)" : ""
    lines.push(`- ${SYSTEM_LABEL[key]}${estimated}: ${score} · ${STATUS[system.status].label}`)
  }
  lines.push(`Nivel de estrés: ${stress ? STRESS_LABEL[stress] : "sin datos"}`)

  const vitals: string[] = []
  for (const { key, label, unit } of VITALS) {
    const v = member.latest[key]
    if (v) vitals.push(`- ${label}: ${num(v.value)} ${v.unit || unit}`)
  }
  const sys = member.latest.systolic_bp
  const dia = member.latest.diastolic_bp
  if (sys && dia) vitals.push(`- Presión arterial: ${num(sys.value, 0)}/${num(dia.value, 0)} ${sys.unit || "mmHg"}`)
  if (vitals.length) {
    lines.push("")
    lines.push("Signos vitales recientes:")
    lines.push(...vitals)
  }

  lines.push("")
  if (issue) {
    lines.push(`Emergencia actual: ${SYSTEM_ISSUE_TITLE[issue.system]} (${STATUS[issue.status].label}, ${Math.round(issue.score)}/100)`)
    if (issue.driver) {
      lines.push(`Factor principal: ${issue.driver.label} = ${num(issue.driver.value)} ${issue.driver.unit}`.trimEnd())
    }
    if (issue.protocol) lines.push(`Protocolo sugerido: ${issue.protocol}`)
  } else {
    lines.push("Sin alertas activas. Estado estable.")
  }
  return lines.join("\n")
}
