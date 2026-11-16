import type { CrewStatus, CurrentIssue, SystemDetail, SystemKey, SystemScore } from "@/api/types"
import i18n from "@/i18n"
import { SYSTEM_ISSUE_TITLE, SYSTEM_LABEL, SYSTEM_ORDER } from "@/lib/status"
import { timeAgo } from "@/lib/time"

/** "hace 3 h" / "ayer" — lower-cased so it reads after "Último escaneo:" / "Last scan:". */
export function lastScanText(iso: string | null | undefined): string {
  const text = timeAgo(iso)
  return text === i18n.t("time.yesterday") ? text.toLowerCase() : text
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
      title: i18n.t("evaluation.summary.stableTitle"),
      text: i18n.t("evaluation.summary.stableText", { name }),
      protocol: null,
    }
  }

  if (status === "observation") {
    const low = scored.filter((s) => (s.score ?? 100) < 75).sort(byScore)
    const shown = low.length > 0 ? low : scored.sort(byScore).slice(0, 1)
    return {
      title: i18n.t("evaluation.summary.observationTitle"),
      text: i18n.t("evaluation.summary.observationText", {
        count: shown.length,
        systems: shown.map(pct).join(" · "),
        name,
      }),
      protocol: null,
    }
  }

  if (status === "critical") {
    const critical = scored.filter((s) => s.status === "critical").sort(byScore)
    const shown = critical.length > 0 ? critical : scored.sort(byScore).slice(0, 2)
    const slug = issue?.protocol ?? null
    return {
      title: i18n.t("evaluation.summary.criticalTitle"),
      text: i18n.t("evaluation.summary.criticalText", { systems: shown.map(pct).join(" · "), name }),
      protocol: slug
        ? { slug, title: protocolTitle(slug) ?? SYSTEM_ISSUE_TITLE[issue?.system as SystemKey] ?? slug }
        : null,
    }
  }

  return {
    title: i18n.t("evaluation.summary.unknownTitle"),
    text: i18n.t("evaluation.summary.unknownText", { name }),
    protocol: null,
  }
}
