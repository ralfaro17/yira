import { useTranslation } from "react-i18next"

import type { CrewStatus } from "@/api/types"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { ProgressIndicator, ProgressTrack } from "@/components/ui/progress"
import { STATUS } from "@/lib/status"
import { cn } from "@/lib/utils"

/** "Cardiovascular ...... 94%" row with an 8px bar coloured by status. */
export function SystemBar({
  label,
  score,
  status,
  estimated,
  className,
}: {
  label: string
  score: number | null
  status: CrewStatus
  estimated?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const value = score == null ? 0 : Math.round(score)
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      <div className="flex items-start justify-between text-[15px]">
        <span className="text-white/90">
          {label}
          {estimated && <span className="ml-1 text-xs text-white/60">{t("layout.estimated")}</span>}
        </span>
        <span className="font-bold text-white">{score == null ? "—" : `${value}%`}</span>
      </div>
      {/* Root primitive directly: the shadcn <Progress> wrapper appends its own default track. */}
      <ProgressPrimitive.Root value={value} aria-label={label} className="w-full">
        <ProgressTrack className="h-2 rounded-[4px] bg-white/20">
          <ProgressIndicator className={cn("rounded-none", STATUS[status].bg)} />
        </ProgressTrack>
      </ProgressPrimitive.Root>
    </div>
  )
}
