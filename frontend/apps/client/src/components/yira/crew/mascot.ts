import type { CrewStatus } from "@/api/types"

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

export const YIRI_ALT: Record<CrewStatus, string> = {
  stable: "Yiri sonriente: tripulante estable",
  observation: "Yiri pensativo: tripulante en observación",
  critical: "Yiri preocupado: tripulante en estado crítico",
  unknown: "Yiri, asistente de YIRA",
}
