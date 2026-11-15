import type { CrewStatus, StressLevel, SystemKey } from "@/api/types"

interface StatusStyle {
  label: string
  /** Tailwind classes for a solid chip/pill in this status colour. */
  chip: string
  /** Text colour on white buttons ("Detalles", "Ver detalles"). */
  text: string
  /** Background for rings, bars and accents. */
  bg: string
  /** Border colour (portrait rings). */
  border: string
  /** Arrow asset matching `text`. */
  arrow: string
}

export const STATUS: Record<CrewStatus, StatusStyle> = {
  stable: {
    label: "Estable",
    chip: "bg-stable text-white",
    text: "text-stable",
    bg: "bg-stable",
    border: "border-stable",
    arrow: "/yira/common/arrow-stable.svg",
  },
  observation: {
    label: "Observación",
    chip: "bg-observation text-observation-foreground",
    text: "text-observation-accent",
    bg: "bg-observation",
    border: "border-observation",
    arrow: "/yira/common/arrow-observation.svg",
  },
  critical: {
    label: "Crítico",
    chip: "bg-critical text-white",
    text: "text-critical",
    bg: "bg-critical",
    border: "border-critical",
    arrow: "/yira/common/arrow-critical.svg",
  },
  unknown: {
    label: "Sin datos",
    chip: "bg-white/30 text-white",
    text: "text-white/70",
    bg: "bg-white/40",
    border: "border-white/40",
    arrow: "/yira/common/arrow-stable.svg",
  },
}

export const SYSTEM_LABEL: Record<SystemKey, string> = {
  cardiovascular: "Cardiovascular",
  immune: "Sistema inmune",
  musculoskeletal: "Óseo-muscular",
  mental: "Salud mental",
}

/** Title used for "Emergencia actual" when a system is degraded. */
export const SYSTEM_ISSUE_TITLE: Record<SystemKey, string> = {
  cardiovascular: "Crisis cardiovascular",
  immune: "Respuesta inmune",
  musculoskeletal: "Desgaste óseo-muscular",
  mental: "Estrés y salud mental",
}

export const SYSTEM_ORDER: SystemKey[] = ["cardiovascular", "immune", "musculoskeletal", "mental"]

export const STRESS_LABEL: Record<StressLevel, string> = { low: "Bajo", medium: "Medio", high: "Alto" }

/** "Álvaro, 21" */
export function crewTitle(member: { name: string; age: number | null }) {
  return member.age != null ? `${member.name}, ${member.age}` : member.name
}

/** Mood face index 0 (very bad) .. 4 (great) from a 0-100 daily score. */
export function moodLevel(score: number | null): number | null {
  if (score == null) return null
  if (score >= 90) return 4
  if (score >= 75) return 3
  if (score >= 60) return 2
  if (score >= 45) return 1
  return 0
}
