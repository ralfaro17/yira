import i18n, { translatedMap } from "@/i18n"

export type StepState = "done" | "running" | "pending"

/** The four scan steps of the "Progreso" card, each taking 25% of the scan. */
const step = (id: "vitals" | "immune" | "musculoskeletal" | "mental") => ({
  id,
  get label() {
    return i18n.t(`scan.steps.${id}.label`)
  },
  get caption() {
    return i18n.t(`scan.steps.${id}.caption`)
  },
})

export const SCAN_STEPS = [step("vitals"), step("immune"), step("musculoskeletal"), step("mental")] as const

export const STEP_STATE_LABEL: Record<StepState, string> = translatedMap({
  done: () => i18n.t("scan.stepState.done"),
  running: () => i18n.t("scan.stepState.running"),
  pending: () => i18n.t("scan.stepState.pending"),
})

export const STEP_DOT: Record<StepState, string> = {
  done: "/yira/scan/dot-done.svg",
  running: "/yira/scan/dot-running.svg",
  pending: "/yira/scan/dot-pending.svg",
}

const STEP_SIZE = 100 / SCAN_STEPS.length

export function stepState(index: number, progress: number): StepState {
  if (progress >= (index + 1) * STEP_SIZE) return "done"
  if (progress >= index * STEP_SIZE) return "running"
  return "pending"
}

/** Index of the step currently being analysed (last step once finished). */
export function currentStep(progress: number): number {
  return Math.min(SCAN_STEPS.length - 1, Math.floor(progress / STEP_SIZE))
}
