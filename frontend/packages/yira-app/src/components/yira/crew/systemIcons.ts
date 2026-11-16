import { Bone, Brain, HeartPulse, Shield, type LucideIcon } from "lucide-react"

import type { SystemKey } from "@/api/types"
import i18n, { translatedMap } from "@/i18n"

/** Icons of the body systems on the crew detail panel (heart, shield, bone, brain). */
export const SYSTEM_ICON: Record<SystemKey, LucideIcon> = {
  cardiovascular: HeartPulse,
  immune: Shield,
  musculoskeletal: Bone,
  mental: Brain,
}

/** Detail panel copy uses title case ("Sistema Inmune" / "Immune System"). */
export const SYSTEM_TITLE: Record<SystemKey, string> = translatedMap({
  cardiovascular: () => i18n.t("status.systemTitle.cardiovascular"),
  immune: () => i18n.t("status.systemTitle.immune"),
  musculoskeletal: () => i18n.t("status.systemTitle.musculoskeletal"),
  mental: () => i18n.t("status.systemTitle.mental"),
})
