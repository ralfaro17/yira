import type { CrewStatus } from "@/api/types"
import { STATUS } from "@/lib/status"
import { cn } from "@/lib/utils"

import { StatusBadge } from "./StatusBadge"

/**
 * Oval crew photo with a status-coloured ring (Figma "image 4" over a coloured
 * rounded rect), optionally with the status pill overlapping the bottom edge.
 */
export function CrewPortrait({
  photo,
  name,
  status,
  className,
  ringWidth = 5,
  showBadge = false,
  badgeSize = "md",
}: {
  photo: string
  name: string
  status: CrewStatus
  className?: string
  ringWidth?: number
  showBadge?: boolean
  badgeSize?: "sm" | "md" | "lg"
}) {
  return (
    <div className={cn("relative aspect-[218/291] shrink-0", className)}>
      <div className={cn("absolute inset-0 rounded-[50%]", STATUS[status].bg)} />
      {photo ? (
        <img
          src={photo}
          alt={name}
          className="absolute rounded-[50%] object-cover"
          style={{ inset: ringWidth, width: `calc(100% - ${ringWidth * 2}px)`, height: `calc(100% - ${ringWidth * 2}px)` }}
        />
      ) : (
        <div
          className="absolute flex items-center justify-center rounded-[50%] bg-white/20 text-4xl font-extrabold text-white"
          style={{ inset: ringWidth }}
        >
          {name.slice(0, 1)}
        </div>
      )}
      {showBadge && (
        <StatusBadge
          status={status}
          size={badgeSize}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3"
        />
      )}
    </div>
  )
}
