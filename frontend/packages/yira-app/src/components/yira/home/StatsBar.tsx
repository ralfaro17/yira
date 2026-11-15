import { Fragment, type ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { GlassPanel } from "@/components/yira/GlassPanel"

export interface Stat {
  label: string
  value: ReactNode
  hint?: ReactNode
}

/** Glass stats strip under the hero copy. */
export function StatsBar({ stats, loading }: { stats: Stat[]; loading?: boolean }) {
  return (
    <GlassPanel className="flex-row items-stretch rounded-[28px] px-2 py-4 md:px-4">
      {stats.map((stat, i) => (
        <Fragment key={stat.label}>
          {i > 0 && <div aria-hidden className="w-px self-stretch bg-white/25" />}
          <div className="flex flex-1 flex-col items-center gap-1 px-2 text-center">
            {loading ? (
              <Skeleton className="h-8 w-14 bg-white/20" />
            ) : (
              <span className="text-2xl font-extrabold md:text-[28px]">{stat.value}</span>
            )}
            <span className="text-xs text-white/80 md:text-sm">{stat.label}</span>
            {stat.hint && !loading && <span className="text-xs font-medium text-critical">{stat.hint}</span>}
          </div>
        </Fragment>
      ))}
    </GlassPanel>
  )
}
