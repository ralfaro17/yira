import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link, Navigate, useParams } from "react-router"

import { useCrewMember, useSystems } from "@/api/hooks"
import type { CrewStatus, DashboardCrew, SystemDetail } from "@/api/types"
import { Skeleton } from "@/components/ui/skeleton"
import { CrewPortrait } from "@/components/yira/CrewPortrait"
import { evaluationSummary, lastScanText, orderedSystems } from "@/components/yira/evaluation/summary"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { ErrorState } from "@/components/yira/QueryState"
import { StatusBadge } from "@/components/yira/StatusBadge"
import { SystemBar } from "@/components/yira/SystemBar"
import { getProtocol } from "@/data/protocols"
import { driverLabel } from "@/lib/metrics"
import { crewTitle, SYSTEM_LABEL } from "@/lib/status"
import { cn } from "@/lib/utils"

/** Accent for the summary title on the dark box (lighter tones of the status colours). */
const SUMMARY_ACCENT: Record<CrewStatus, string> = {
  stable: "text-[#74b6ff]",
  observation: "text-observation",
  critical: "text-[#ff626c]",
  unknown: "text-white/80",
}

/** Figma 118:2 / 118:16 / 118:30 — "Evaluación · Detalles de …". */
export function EvaluationDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const id = Number(params.id)
  const validId = Number.isInteger(id) ? id : undefined
  const { member, isPending, isError, refetch } = useCrewMember(validId)
  const systems = useSystems(member ? validId : undefined)

  if (validId === undefined) return <Navigate to="/evaluacion" replace />

  let body: ReactNode
  if (isPending) {
    body = (
      <div className="grid gap-6 md:grid-cols-[288px_1fr]">
        <Skeleton className="h-[484px] rounded-panel bg-white/15" />
        <Skeleton className="h-[484px] rounded-panel bg-white/15" />
      </div>
    )
  } else if (isError) {
    body = <ErrorState onRetry={() => void refetch()} />
  } else if (!member) {
    return <Navigate to="/evaluacion" replace />
  } else {
    body = (
      <div className="grid gap-6 md:grid-cols-[288px_1fr]">
        <CrewCard member={member} />
        <SystemsPanel
          member={member}
          systems={systems.data?.systems}
          loading={systems.isPending}
          error={systems.isError}
          onRetry={() => void systems.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/evaluacion"
        className="self-start py-2 text-[17px] leading-[22px] font-medium whitespace-pre text-white hover:underline"
      >
        {t("evaluation.back")}
      </Link>
      {body}
    </div>
  )
}

/** "Ficha del tripulante" (Figma 118:47). */
function CrewCard({ member }: { member: DashboardCrew }) {
  const { t } = useTranslation()
  const title = crewTitle(member)
  return (
    <GlassPanel className="items-center px-5 pt-[26px] pb-8 text-center md:min-h-[484px]">
      <CrewPortrait
        photo={member.photo}
        name={t("evaluation.photoOf", { name: title })}
        status={member.status}
        className="aspect-auto h-[176px] w-[140px]"
      />
      <h1 className="mt-[22px] text-[28px] leading-9 font-extrabold text-white">{title}</h1>
      <p className="mt-1 text-base leading-[21px] text-white/80">{t("evaluation.crewMember")}</p>
      <StatusBadge status={member.status} size="lg" className="mt-[22px]" />
      <p className="mt-[34px] text-lg leading-[26px] text-white/85">
        {t("evaluation.lastScanLabel")}
        <br />
        <span className="font-bold text-white">{lastScanText(member.last_scan_at)}</span>
      </p>
    </GlassPanel>
  )
}

/** "Resultados por sistema" (Figma 118:54). */
function SystemsPanel({
  member,
  systems,
  loading,
  error,
  onRetry,
}: {
  member: DashboardCrew
  systems: SystemDetail[] | undefined
  loading: boolean
  error: boolean
  onRetry: () => void
}) {
  const { t } = useTranslation()
  // The dashboard payload already has the scores; the systems endpoint adds the drivers.
  const rows: SystemDetail[] = orderedSystems(systems ?? member.systems.map((s) => ({ ...s, drivers: [] })))
  const summary = evaluationSummary(member.status, member.name, rows, member.current_issue, (slug) => getProtocol(slug)?.title)
  const worst = rows
    .filter((s) => s.score != null && s.drivers.length > 0)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0]
  const showDrivers = worst && member.status !== "stable" && member.status !== "unknown"

  return (
    <GlassPanel className="px-7 pt-6 pb-[26px] md:min-h-[484px]">
      <h2 className="text-[26px] leading-[34px] font-bold text-white">{t("evaluation.bySystem")}</h2>
      <p className="mt-1.5 text-[15px] leading-[19px] text-white/75">{t("evaluation.bySystemSubtitle")}</p>

      <div className="mt-6 flex flex-col gap-[11px]">
        {rows.map((system) => (
          <SystemBar
            key={system.key}
            label={SYSTEM_LABEL[system.key]}
            score={system.score}
            status={system.status}
            estimated={system.key === "musculoskeletal" || system.estimated}
            className="h-12 gap-2.5 [&>div:first-child]:text-[17px] [&>div:first-child>span:last-child]:text-xl"
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-white/70">
          {t("evaluation.driversError")}{" "}
          <button type="button" onClick={onRetry} className="underline underline-offset-2">
            {t("evaluation.retry")}
          </button>
        </p>
      )}

      <div className="min-h-4 flex-1" />

      <section
        aria-label={t("evaluation.summaryLabel")}
        className="rounded-[24px] bg-[rgba(7,21,32,0.57)] px-[18px] pt-3.5 pb-4 md:min-h-[100px]"
      >
        <h3 className={cn("text-lg leading-[23px] font-bold", SUMMARY_ACCENT[member.status])}>{summary.title}</h3>
        <p className="mt-[7px] text-base leading-[23px] text-[#e0e7ee]">
          {summary.text}
          {summary.protocol && (
            <>
              {" "}
              {t("evaluation.recommendProtocol")}{" "}
              <Link
                to={`/protocolos/${summary.protocol.slug}`}
                className="font-semibold text-brand-link underline-offset-2 hover:underline"
              >
                {summary.protocol.title} →
              </Link>
            </>
          )}
        </p>
        {loading && !systems ? (
          <Skeleton className="mt-2 h-4 w-2/3 bg-white/15" />
        ) : (
          showDrivers && (
            <p className="mt-2 text-[13px] leading-[18px] text-white/65">
              {t("evaluation.mainDrivers", { system: SYSTEM_LABEL[worst.key] })}{" "}
              {worst.drivers
                .slice(0, 3)
                .map((d) => `${driverLabel(d)} ${formatValue(d.value)}${d.unit ? ` ${d.unit}` : ""}`)
                .join(" · ")}
            </p>
          )
        )}
      </section>
    </GlassPanel>
  )
}

function formatValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
