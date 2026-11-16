import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import type { DashboardCrew, LatestValue, SystemScore } from "@/api/types"
import { Button } from "@/components/ui/button"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { SystemBar } from "@/components/yira/SystemBar"
import { driverLabel } from "@/lib/metrics"
import { STRESS_LABEL, SYSTEM_ISSUE_TITLE, SYSTEM_LABEL, SYSTEM_ORDER } from "@/lib/status"
import { cn } from "@/lib/utils"

import { SCAN_STEPS, STEP_DOT, STEP_STATE_LABEL, stepState } from "./scanSteps"

const PANEL = "w-full gap-[18px] p-[28px] md:h-[480px] md:w-[300px]"
const OUTLINE_PILL =
  "h-auto rounded-pill border-2 border-white bg-transparent px-6 py-3 text-lg font-medium text-white hover:bg-white/10 hover:text-white"
const FILLED_PILL = "h-auto rounded-pill bg-brand px-6 py-3 text-lg font-medium text-white hover:bg-brand/85"

export type ScanPhase = "running" | "paused" | "done"

/** Left card "Progreso" (Progress): the four steps plus stop / resume / view results. */
export function ScanProgressPanel({
  progress,
  phase,
  crewId,
  onPause,
  onResume,
  onRestart,
}: {
  progress: number
  phase: ScanPhase
  crewId: number
  onPause: () => void
  onResume: () => void
  onRestart: () => void
}) {
  const { t } = useTranslation()
  return (
    <GlassPanel className={PANEL}>
      <h2 className="text-[26px] font-extrabold">{t("scan.progressTitle")}</h2>
      <ol className="flex flex-col gap-[18px]">
        {SCAN_STEPS.map((step, i) => {
          const state = stepState(i, progress)
          return (
            <li key={step.id} className="flex items-center gap-3">
              <img src={STEP_DOT[state]} alt="" width={16} height={16} className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 text-lg font-medium">{step.label}</span>
              <span className="shrink-0 text-[15px] text-white/80">{STEP_STATE_LABEL[state]}</span>
            </li>
          )
        })}
      </ol>
      <div className="min-h-4 flex-1" />
      <div className="flex flex-col items-start gap-3">
        {phase === "running" && (
          <Button variant="outline" className={OUTLINE_PILL} onClick={onPause}>
            {t("scan.stop")}
          </Button>
        )}
        {phase === "paused" && (
          <>
            <Button className={FILLED_PILL} onClick={onResume}>
              {t("scan.resume")}
            </Button>
            <Link to={`/tripulacion/${crewId}`} className="px-1 text-[15px] font-medium text-white underline-offset-4 hover:underline">
              {t("scan.backToProfile")}
            </Link>
          </>
        )}
        {phase === "done" && (
          <>
            <Button className={FILLED_PILL} render={<Link to={`/tripulacion/${crewId}`} />} nativeButton={false}>
              {t("scan.viewResults")}
            </Button>
            <Button variant="outline" className={OUTLINE_PILL} onClick={onRestart}>
              {t("scan.repeat")}
            </Button>
          </>
        )}
      </div>
    </GlassPanel>
  )
}

const VITAL_TONE: Record<LatestValue["status"], string> = {
  normal: "text-white",
  "n/a": "text-white",
  warning: "text-observation",
  critical: "text-critical",
}

function Reading({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[15px] text-white/70">{label}</dt>
      <dd className={cn("text-[34px] font-extrabold leading-tight", tone)}>{value}</dd>
    </div>
  )
}

function formatVital(v: LatestValue | undefined, digits: number, unit: string) {
  return v ? `${v.value.toFixed(digits)} ${unit}` : "—"
}

/** Right card "En vivo": live vitals (stable / critical frames). */
export function ScanLivePanel({ member }: { member: DashboardCrew }) {
  const { t } = useTranslation()
  const { latest } = member
  const critical = member.status === "critical"
  const tone = (v: LatestValue | undefined) => (v ? VITAL_TONE[v.status] : "text-white")
  const issue = member.current_issue

  return (
    <GlassPanel className={PANEL}>
      <h2 className="flex items-center gap-2 text-[26px] font-extrabold">
        {t("scan.liveTitle")}
        <span aria-hidden className={cn("size-2.5 rounded-full motion-safe-only animate-pulse", critical ? "bg-critical" : "bg-brand")} />
      </h2>
      {critical && issue && (
        <p role="alert" className="rounded-[18px] bg-critical/90 px-4 py-2 text-[15px] font-bold leading-snug text-white">
          {t("scan.alert", { title: SYSTEM_ISSUE_TITLE[issue.system] })}
          {issue.driver && <span className="block font-normal text-white/90">{driverLabel(issue.driver)}</span>}
        </p>
      )}
      <dl className="flex flex-col gap-[18px]">
        <Reading label={t("scan.heartRate")} value={formatVital(latest.heart_rate, 0, "bpm")} tone={tone(latest.heart_rate)} />
        <Reading label={t("scan.temperature")} value={formatVital(latest.body_temp, 1, "°C")} tone={tone(latest.body_temp)} />
        <Reading label={t("scan.bloodOxygen")} value={formatVital(latest.spo2, 0, "%")} tone={tone(latest.spo2)} />
        <Reading
          label={t("scan.stressLevel")}
          value={member.stress_level ? STRESS_LABEL[member.stress_level] : "—"}
          tone={member.stress_level === "high" ? "text-critical" : member.stress_level === "medium" ? "text-observation" : "text-white"}
        />
      </dl>
    </GlassPanel>
  )
}

/** Right card "Última evaluación": per-system scores (observation frame). */
export function ScanLastEvaluationPanel({ systems }: { systems: SystemScore[] | undefined }) {
  const { t } = useTranslation()
  const byKey = new Map(systems?.map((s) => [s.key, s]))
  return (
    <GlassPanel className={PANEL}>
      <h2 className="text-[26px] font-extrabold">{t("scan.lastEvaluation")}</h2>
      <div className="flex flex-col gap-[18px]">
        {SYSTEM_ORDER.map((key) => {
          const s = byKey.get(key)
          return (
            <SystemBar
              key={key}
              label={SYSTEM_LABEL[key]}
              score={s?.score ?? null}
              status={s?.status ?? "unknown"}
              estimated={s?.estimated}
            />
          )
        })}
      </div>
    </GlassPanel>
  )
}
