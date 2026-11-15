import { Bone, Brain, HeartPulse, Shield, type LucideIcon } from "lucide-react"

import type { SystemKey } from "@/api/types"

/** Icons of the body systems on the crew detail panel (heart, shield, bone, brain). */
export const SYSTEM_ICON: Record<SystemKey, LucideIcon> = {
  cardiovascular: HeartPulse,
  immune: Shield,
  musculoskeletal: Bone,
  mental: Brain,
}

/** Detail panel copy uses title case ("Sistema Inmune", "Óseo-Muscular"). */
export const SYSTEM_TITLE: Record<SystemKey, string> = {
  cardiovascular: "Cardiovascular",
  immune: "Sistema Inmune",
  musculoskeletal: "Óseo-Muscular",
  mental: "Salud Mental",
}
