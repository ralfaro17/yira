import { Link, Navigate, useParams } from "react-router"

import { useCrewMember, useSystems } from "@/api/hooks"
import type { CurrentIssue, SystemKey, SystemScore } from "@/api/types"
import { Skeleton } from "@/components/ui/skeleton"
import { CrewPortrait } from "@/components/yira/CrewPortrait"
import { Yiri3D } from "@/components/yira/Yiri3D"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { ErrorState } from "@/components/yira/QueryState"
import { EarthSummaryDialog } from "@/components/yira/crew/EarthSummaryDialog"
import { MoodRow } from "@/components/yira/crew/MoodRow"
import { buildEarthSummary } from "@/components/yira/crew/earthSummary"
import { YIRI_ALT, YIRI_SRC } from "@/components/yira/crew/mascot"
import { SYSTEM_ICON, SYSTEM_TITLE } from "@/components/yira/crew/systemIcons"
import { STATUS, SYSTEM_ISSUE_TITLE, SYSTEM_ORDER, crewTitle } from "@/lib/status"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

/** "Emergencia Actual" block (Figma "Estado y alertas actuales", 264×75) or the calm variant. */
function CurrentIssueBlock({ issue }: { issue: CurrentIssue | null }) {
  const system: SystemKey = issue?.system ?? "cardiovascular"
  const Icon = SYSTEM_ICON[system]
  const tone = STATUS[issue?.status ?? "stable"]
  const body = (
    <>
      <span className="flex h-[75px] w-[61px] shrink-0 items-center justify-center">
        <Icon aria-hidden strokeWidth={2.2} className={cn("size-14", tone.text)} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-sm font-semibold", tone.text)}>{issue ? "Emergencia actual" : "Sin alertas activas"}</span>
        <span className="text-xl leading-tight font-bold text-white">
          {issue ? SYSTEM_ISSUE_TITLE[issue.system] : "Estado estable"}
        </span>
        {issue?.driver && (
          <span className="truncate text-sm text-white/80">
            {issue.driver.label}: {Number.isInteger(issue.driver.value) ? issue.driver.value : issue.driver.value.toFixed(1)}{" "}
            {issue.driver.unit}
          </span>
        )}
      </span>
    </>
  )
  const base = "flex items-center gap-[23px] rounded-3xl"
  if (issue?.protocol) {
    return (
      <Link
        to={`/protocolos/${issue.protocol}`}
        aria-label={`Emergencia actual: ${SYSTEM_ISSUE_TITLE[issue.system]}. Ver protocolo`}
        className={cn(base, "-m-2 p-2 transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none")}
      >
        {body}
      </Link>
    )
  }
  return <div className={base}>{body}</div>
}

/** One of the three remaining systems: icon + "Sistema Inmune" / status label in its colour. */
function SystemIndicator({ system }: { system: SystemScore }) {
  const Icon = SYSTEM_ICON[system.key]
  return (
    <li className="flex items-center gap-3">
      <Icon aria-hidden strokeWidth={2.2} className={cn("size-[34px] shrink-0", STATUS[system.status].text)} />
      <span className="flex flex-col text-sm leading-4">
        <span className="font-semibold text-white">{SYSTEM_TITLE[system.key]}</span>
        <span className={cn("font-medium", STATUS[system.status].text)}>{STATUS[system.status].label}</span>
      </span>
    </li>
  )
}

/** "Detalles del tripulante" (Figma 42:335 / 89:179 / 89:242). */
export function CrewDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const validId = Number.isInteger(id) && id > 0
  const crew = useCrewMember(validId ? id : undefined)
  const systemsQuery = useSystems(validId ? id : undefined)

  if (!validId) return <Navigate to="/tripulacion" replace />
  if (crew.isPending) {
    return <Skeleton className="h-[562px] w-full max-w-[978px] rounded-panel bg-white/15" />
  }
  if (crew.isError) return <ErrorState onRetry={() => crew.refetch()} />
  const { member, next } = crew
  if (!member) return <Navigate to="/tripulacion" replace />

  const detail = systemsQuery.data
  const systems: SystemScore[] = detail?.systems ?? member.systems
  const issue = detail ? detail.current_issue : member.current_issue
  const stress = detail ? detail.stress_level : member.stress_level
  const daily = detail?.daily ?? member.daily
  const featured: SystemKey = issue?.system ?? "cardiovascular"
  const others = SYSTEM_ORDER.filter((key) => key !== featured)
    .map((key) => systems.find((s) => s.key === key))
    .filter((s): s is SystemScore => s !== undefined)
  const summary = buildEarthSummary({ member, systems, stress, issue })
  const status = STATUS[member.status]

  return (
    <GlassPanel className="relative w-full max-w-[978px] overflow-hidden lg:h-[562px]">
      {/* Peeking 3D Yiri (inside the panel mask) */}
      <div className="pointer-events-none absolute top-[38px] right-[-150px] hidden h-[560px] w-[467px] lg:block">
        <Yiri3D
          status={member.status}
          mode="idle"
          className="size-full"
          fallbackSrc={YIRI_SRC[member.status]}
          alt={YIRI_ALT[member.status]}
        />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-5 pt-8 pb-8 lg:flex-row lg:items-start lg:gap-[49px] lg:pt-[85px] lg:pr-0 lg:pb-0 lg:pl-[76px]">
        <CrewPortrait
          photo={member.photo}
          name={member.name}
          status={member.status}
          showBadge
          badgeSize="lg"
          ringWidth={6}
          className="w-[220px] lg:mt-[5px] lg:w-[274px]"
        />

        <div className="flex w-full max-w-[360px] flex-col lg:w-[300px]">
          <p className={cn("text-2xl leading-[29px] font-bold", status.text)}>Estado General</p>
          <h1 className="mt-1 text-4xl leading-[1.1] font-extrabold text-white lg:text-[56px]">{crewTitle(member)}</h1>
          <p className="mt-1 text-xl text-white">
            Último escaneo: <span className="font-bold">{timeAgo(member.last_scan_at)}</span>
          </p>

          <MoodRow daily={daily} className="mt-4" />

          <div className="mt-8">
            <CurrentIssueBlock issue={issue} />
          </div>

          <ul aria-label="Otros sistemas" className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6">
            {others.map((system) => (
              <SystemIndicator key={system.key} system={system} />
            ))}
          </ul>
        </div>

        {/* Mobile: actions in flow. Desktop: positioned over the mascot as in the frame. */}
        <div className="flex w-full items-center justify-center gap-4 lg:contents">
          <EarthSummaryDialog
            name={member.name}
            summary={summary}
            className="lg:absolute lg:top-[490px] lg:right-[24px] lg:z-10"
          />
          {next && (
            <Link
              to={`/tripulacion/${next.id}`}
              aria-label={`Siguiente tripulante: ${next.name}`}
              className="rounded-pill transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none lg:absolute lg:top-[279px] lg:right-[16px] lg:z-10"
            >
              <img src="/yira/crew/carousel-arrow.svg" alt="" width={48} height={46} />
            </Link>
          )}
        </div>
      </div>
    </GlassPanel>
  )
}
