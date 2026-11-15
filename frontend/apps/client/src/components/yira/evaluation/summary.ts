import type { CrewStatus, CurrentIssue, SystemDetail, SystemKey, SystemScore } from "@/api/types"
import { SYSTEM_ISSUE_TITLE, SYSTEM_LABEL, SYSTEM_ORDER } from "@/lib/status"
import { timeAgo } from "@/lib/time"

/** "hace 3 h" / "ayer" — lower-cased so it reads after "Último escaneo:". */
export function lastScanText(iso: string | null | undefined): string {
  const text = timeAgo(iso)
  return text === "Ayer" ? "ayer" : text
}

/** Systems sorted in the canonical display order (missing ones are skipped). */
export function orderedSystems<T extends SystemScore>(systems: T[]): T[] {
  return SYSTEM_ORDER.map((key) => systems.find((s) => s.key === key)).filter((s): s is T => s !== undefined)
}

function pct(system: SystemScore) {
  return `${SYSTEM_LABEL[system.key]}: ${Math.round(system.score ?? 0)}%`
}

function byScore(a: SystemScore, b: SystemScore) {
  return (a.score ?? 0) - (b.score ?? 0)
}

export interface EvaluationSummary {
  title: string
  text: string
  /** Protocol recommended for a critical crew member, when the backend links one. */
  protocol: { slug: string; title: string } | null
}

/** Copy of the "Resumen del estado" box (Figma 118:77 / 118:114 / 118:151). */
export function evaluationSummary(
  status: CrewStatus,
  name: string,
  systems: SystemDetail[],
  issue: CurrentIssue | null,
  protocolTitle: (slug: string) => string | undefined,
): EvaluationSummary {
  const scored = systems.filter((s) => s.score != null)

  if (status === "stable") {
    return {
      title: "Estado estable",
      text: `Los cuatro sistemas conservan los valores registrados en la evaluación de ${name}.`,
      protocol: null,
    }
  }

  if (status === "observation") {
    const low = scored.filter((s) => (s.score ?? 100) < 75).sort(byScore)
    const shown = low.length > 0 ? low : scored.sort(byScore).slice(0, 1)
    const plural = shown.length > 1
    return {
      title: "Seguimiento en observación",
      text: `${shown.map(pct).join(" · ")}. Consulta ${plural ? "estos indicadores" : "este indicador"} junto con los demás resultados de ${name}.`,
      protocol: null,
    }
  }

  if (status === "critical") {
    const critical = scored.filter((s) => s.status === "critical").sort(byScore)
    const shown = critical.length > 0 ? critical : scored.sort(byScore).slice(0, 2)
    const slug = issue?.protocol ?? null
    return {
      title: "Estado crítico",
      text: `${shown.map(pct).join(" · ")}. Estos son los indicadores más bajos de ${name}.`,
      protocol: slug
        ? { slug, title: protocolTitle(slug) ?? SYSTEM_ISSUE_TITLE[issue?.system as SystemKey] ?? slug }
        : null,
    }
  }

  return {
    title: "Sin datos suficientes",
    text: `Aún no hay un escaneo registrado con el que evaluar los sistemas de ${name}.`,
    protocol: null,
  }
}
