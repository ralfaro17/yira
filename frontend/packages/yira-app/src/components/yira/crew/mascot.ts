import type { CrewStatus } from "@/api/types"
import i18n, { translatedMap } from "@/i18n"

/**
 * Yiri mascot variants (Figma "yiri blen 1/2"): blue headphones + smile for
 * stable, yellow + neutral face for observation, red + sad face for critical.
 */
export const YIRI_SRC: Record<CrewStatus, string> = {
  stable: "/yira/crew/yiri-stable.png",
  observation: "/yira/crew/yiri-observation.png",
  critical: "/yira/crew/yiri-critical.png",
  unknown: "/yira/crew/yiri-stable.png",
}

export const YIRI_ALT: Record<CrewStatus, string> = translatedMap({
  stable: () => i18n.t("crew.mascot.stable"),
  observation: () => i18n.t("crew.mascot.observation"),
  critical: () => i18n.t("crew.mascot.critical"),
  unknown: () => i18n.t("crew.mascot.unknown"),
})
