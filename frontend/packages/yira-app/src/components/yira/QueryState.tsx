import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

/** Loading skeleton / error / empty states shared by the data pages. */
export function LoadingPanels({ count = 3, className = "h-[446px]" }: { count?: number; className?: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={`rounded-panel bg-white/15 ${className}`} />
      ))}
    </div>
  )
}

export function ErrorState({ onRetry, children }: { onRetry?: () => void; children?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <Empty className="rounded-panel border border-glass-border bg-glass text-white backdrop-blur-[20px]">
      <EmptyHeader>
        <EmptyTitle>{t("layout.error.title")}</EmptyTitle>
        <EmptyDescription className="text-white/80">
          {children ?? t("layout.error.description")}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <Button onClick={onRetry} className="rounded-pill bg-brand px-6 text-white">
          {t("layout.error.retry")}
        </Button>
      )}
    </Empty>
  )
}

export function EmptyCrew() {
  const { t } = useTranslation()
  return (
    <Empty className="rounded-panel border border-glass-border bg-glass text-white backdrop-blur-[20px]">
      <EmptyHeader>
        <EmptyTitle>{t("layout.emptyCrew.title")}</EmptyTitle>
        <EmptyDescription className="text-white/80">
          {t("layout.emptyCrew.before")} <code>manage.py simulate_mission</code> {t("layout.emptyCrew.after")}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
