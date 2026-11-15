import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Small floating glass chip next to the mascot ("Ritmo cardíaco", "Sistema inmune", ...). */
export function GlassChip({
  label,
  value,
  loading,
  className,
}: {
  label: string
  value: ReactNode
  loading?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-[20px] border border-glass-border bg-glass px-4 py-2.5 whitespace-nowrap text-white backdrop-blur-[20px]",
        className,
      )}
    >
      <span className="text-[13px] text-white/80">{label}</span>
      {loading ? <Skeleton className="h-6 w-20 bg-white/20" /> : <span className="text-lg font-bold">{value}</span>}
    </div>
  )
}
