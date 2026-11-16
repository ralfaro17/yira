import { format } from "date-fns"

import { getProtocol } from "@/data/protocols"
import type { CurrentIssue, DashboardCrew, StressLevel, SystemScore } from "@/api/types"
import i18n from "@/i18n"
import { STATUS, STRESS_LABEL, SYSTEM_ISSUE_TITLE, SYSTEM_LABEL, SYSTEM_ORDER } from "@/lib/status"
import { dateLocale, timeAgo } from "@/lib/time"

import { crewRole, driverText, missionName } from "./crewCopy"

const VITALS = [
  { key: "heart_rate", label: () => i18n.t("crew.earth.report.heartRate"), unit: () => i18n.t("crew.earth.report.heartRateUnit") },
  { key: "spo2", label: () => i18n.t("crew.earth.report.spo2"), unit: () => "%" },
  { key: "body_temp", label: () => i18n.t("crew.earth.report.bodyTemp"), unit: () => "°C" },
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
  const t = i18n.t.bind(i18n)
  const noData = t("crew.earth.report.noData")
  const lines: string[] = []
  const date = format(new Date(), t("crew.earth.report.dateFormat"), { locale: dateLocale() })
  lines.push(t("crew.earth.report.heading", { date }))
  lines.push("")
  lines.push(
    t("crew.earth.report.member", {
      name: member.name,
      age: member.age != null ? t("crew.earth.report.age", { age: member.age }) : "",
      role: member.role ? ` (${crewRole(member.role)})` : "",
    }),
  )
  if (member.mission) lines.push(t("crew.earth.report.mission", { mission: missionName(member.mission) }))
  lines.push(t("crew.earth.report.status", { status: STATUS[member.status].label }))
  lines.push(t("crew.earth.report.lastScan", { time: timeAgo(member.last_scan_at) }))

  lines.push("")
  lines.push(t("crew.earth.report.systems"))
  for (const key of SYSTEM_ORDER) {
    const system = systems.find((s) => s.key === key)
    if (!system) continue
    const score = system.score == null ? noData : `${Math.round(system.score)}/100`
    const estimated = system.estimated ? t("crew.earth.report.estimated") : ""
    lines.push(`- ${SYSTEM_LABEL[key]}${estimated}: ${score} · ${STATUS[system.status].label}`)
  }
  lines.push(t("crew.earth.report.stress", { level: stress ? STRESS_LABEL[stress] : noData }))

  const vitals: string[] = []
  for (const { key, label, unit } of VITALS) {
    const v = member.latest[key]
    if (v) vitals.push(`- ${label()}: ${num(v.value)} ${v.unit || unit()}`)
  }
  const sys = member.latest.systolic_bp
  const dia = member.latest.diastolic_bp
  if (sys && dia)
    vitals.push(`- ${t("crew.earth.report.bloodPressure")}: ${num(sys.value, 0)}/${num(dia.value, 0)} ${sys.unit || "mmHg"}`)
  if (vitals.length) {
    lines.push("")
    lines.push(t("crew.earth.report.vitals"))
    lines.push(...vitals)
  }

  lines.push("")
  if (issue) {
    lines.push(
      t("crew.earth.report.currentIssue", {
        title: SYSTEM_ISSUE_TITLE[issue.system],
        status: STATUS[issue.status].label,
        score: Math.round(issue.score),
      }),
    )
    if (issue.driver) lines.push(t("crew.earth.report.driver", driverText(issue.driver)))
    if (issue.protocol) lines.push(t("crew.earth.report.protocol", { protocol: getProtocol(issue.protocol)?.title ?? issue.protocol }))
  } else {
    lines.push(t("crew.earth.report.allClear"))
  }
  return lines.join("\n")
}
