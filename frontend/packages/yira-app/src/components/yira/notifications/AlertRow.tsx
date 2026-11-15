import type { Alert } from "@/api/types"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

import { alertSummary, alertTitle } from "./alertCopy"

/** One notification: unread dot, "{tripulante} — {título}", Spanish summary, relative time. */
export function AlertRow({ alert }: { alert: Alert }) {
  const unread = !alert.acknowledged
  return (
    <li className="flex items-start gap-4 border-b border-white/15 py-4 last:border-b-0">
      <span
        aria-hidden
        className={cn(
          "mt-2 size-3 shrink-0 rounded-full",
          !unread && "bg-transparent",
          unread && (alert.severity === "critical" ? "bg-critical" : "bg-brand"),
        )}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("text-lg leading-snug text-white", unread ? "font-bold" : "font-medium text-white/85")}>
          {alert.crew_member_name} — {alertTitle(alert)}
          {unread && <span className="sr-only"> (sin leer)</span>}
        </p>
        <p className="mt-1 text-[15px] text-white/75" title={alert.message}>
          {alertSummary(alert)}
        </p>
      </div>
      <time dateTime={alert.last_seen_at} className="shrink-0 pt-1 text-sm text-white/70">
        {timeAgo(alert.last_seen_at)}
      </time>
    </li>
  )
}
