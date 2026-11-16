import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useDashboard } from "@/api/hooks"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyCrew, ErrorState } from "@/components/yira/QueryState"
import { CrewDeck } from "@/components/yira/crew/CrewDeck"
import { MascotStage } from "@/components/yira/crew/MascotStage"

/** "Tripulación" (Figma 2:78 / 34:22 / 2:212): crew card deck + Yiri on a status-coloured platform. */
export function CrewPage() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useDashboard()
  const [focused, setFocused] = useState(0)

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-6 xl:gap-[77px] lg:pt-[18px] lg:pl-[11px]">
        <Skeleton className="h-[518px] w-[285px] rounded-panel bg-white/15 lg:mx-[125px]" />
        <Skeleton className="h-[460px] w-[308px] rounded-panel bg-white/10" />
      </div>
    )
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const crew = data.crew
  if (crew.length === 0) return <EmptyCrew />

  const member = crew[Math.min(focused, crew.length - 1)]

  return (
    <section
      aria-label={t("crew.title")}
      className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-6 xl:gap-[77px] lg:pt-[18px] lg:pl-[11px]"
    >
      <h1 className="sr-only">{t("crew.title")}</h1>
      <CrewDeck crew={crew} onFocusChange={setFocused} className="lg:w-[535px] lg:shrink-0" />
      <MascotStage
        status={member.status}
        name={member.name}
        scanHref={`/tripulacion/${member.id}/escaneo`}
      />
    </section>
  )
}
