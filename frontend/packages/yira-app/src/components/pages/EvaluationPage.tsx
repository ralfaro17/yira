import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { useDashboard } from "@/api/hooks"
import type { DashboardCrew } from "@/api/types"
import { CrewPortrait } from "@/components/yira/CrewPortrait"
import { lastScanText, orderedSystems } from "@/components/yira/evaluation/summary"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { PageHeading } from "@/components/yira/PageHeading"
import { EmptyCrew, ErrorState, LoadingPanels } from "@/components/yira/QueryState"
import { StatusArrow } from "@/components/yira/StatusArrow"
import { StatusBadge } from "@/components/yira/StatusBadge"
import { SystemBar } from "@/components/yira/SystemBar"
import { crewTitle, STATUS, SYSTEM_LABEL } from "@/lib/status"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

/** Figma 25:50 "Evaluación": one card per crew member with the four system scores. */
export function EvaluationPage() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useDashboard()
  const crew = data?.crew ?? []
  const newestScan = crew
    .map((c) => c.last_scan_at)
    .filter((d): d is string => d != null)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]

  return (
    <div className="flex flex-col gap-8 md:gap-7">
      <PageHeading
        title={t("evaluation.title")}
        subtitle={t("evaluation.subtitle", { when: timeAgo(newestScan) })}
      />
      {isPending ? (
        <LoadingPanels />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : crew.length === 0 ? (
        <EmptyCrew />
      ) : (
        <ul className="grid gap-6 md:grid-cols-3">
          {crew.map((member) => (
            <li key={member.id}>
              <EvaluationCard member={member} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EvaluationCard({ member }: { member: DashboardCrew }) {
  const { t } = useTranslation()
  const title = crewTitle(member)
  return (
    <GlassPanel className="h-full gap-3.5 p-6 md:min-h-[446px]">
      <div className="flex items-center gap-4">
        <CrewPortrait
          photo={member.photo}
          name={title}
          status={member.status}
          className="aspect-auto h-[104px] w-[84px]"
        />
        <div className="flex min-w-0 flex-col items-start gap-2">
          <h2 className="text-[28px] leading-tight font-extrabold text-white">{title}</h2>
          <StatusBadge status={member.status} />
        </div>
      </div>
      <p className="text-sm text-white/80">{t("evaluation.lastScan", { when: lastScanText(member.last_scan_at) })}</p>
      <div className="flex flex-col gap-3">
        {orderedSystems(member.systems).map((system) => (
          <SystemBar
            key={system.key}
            label={SYSTEM_LABEL[system.key]}
            score={system.score}
            // The design paints every bar of a card in the crew member's status colour.
            status={member.status}
            estimated={system.estimated}
          />
        ))}
      </div>
      <div className="min-h-[7px] flex-1" />
      <Link
        to={`/evaluacion/${member.id}`}
        className={cn(
          "flex items-center justify-center gap-2.5 self-start rounded-pill bg-white px-6 py-3 text-xl font-medium transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none",
          STATUS[member.status].text,
        )}
        aria-label={t("evaluation.viewDetailsOf", { name: member.name })}
      >
        {t("evaluation.viewDetails")}
        <StatusArrow status={member.status} />
      </Link>
    </GlassPanel>
  )
}
