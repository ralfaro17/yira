import { Angry, CircleDashed, Frown, Laugh, Meh, Smile, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { DailyScore } from "@/api/types"
import { STATUS, moodLevel } from "@/lib/status"
import { weekdayInitial } from "@/lib/time"
import { cn } from "@/lib/utils"

const FACES: LucideIcon[] = [Angry, Frown, Meh, Smile, Laugh]

/** Seven mood faces with weekday initials (Figma "Group 12", 310×58). */
export function MoodRow({ daily, className }: { daily: DailyScore[]; className?: string }) {
  const { t } = useTranslation()
  const days = daily.slice(-7)
  if (days.length === 0) return null
  return (
    <ol aria-label={t("crew.mood.label")} className={cn("flex w-full max-w-[310px] justify-between", className)}>
      {days.map((day) => {
        const level = moodLevel(day.score)
        const Face = level == null ? CircleDashed : FACES[level]
        const label = level == null ? t("crew.mood.noData") : `${t(`crew.mood.levels.${level}`)} (${Math.round(day.score ?? 0)})`
        return (
          <li key={day.date} className="flex flex-col items-center gap-1" title={`${day.date}: ${label}`}>
            <Face
              aria-hidden
              strokeWidth={2.2}
              className={cn("size-8", level == null ? "text-white/40" : STATUS[day.status].text)}
            />
            <span className="text-sm font-semibold text-white">
              {weekdayInitial(day.date)}
              <span className="sr-only">: {label}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
