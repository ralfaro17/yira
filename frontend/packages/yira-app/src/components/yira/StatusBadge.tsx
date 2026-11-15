import type { CrewStatus } from "@/api/types"
import { Badge } from "@/components/ui/badge"
import { STATUS } from "@/lib/status"
import { cn } from "@/lib/utils"

/** Status chip ("Estable" / "Observación" / "Crítico"). */
export function StatusBadge({
  status,
  className,
  size = "md",
}: {
  status: CrewStatus
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <Badge
      className={cn(
        "h-auto rounded-pill font-medium",
        size === "sm" && "px-3 py-0.5 text-sm",
        size === "md" && "px-[18px] py-1.5 text-lg",
        size === "lg" && "px-6 py-2 text-xl",
        STATUS[status].chip,
        className,
      )}
    >
      {STATUS[status].label}
    </Badge>
  )
}
