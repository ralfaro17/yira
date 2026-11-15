import type { CrewStatus } from "@/api/types"
import { STATUS } from "@/lib/status"
import { cn } from "@/lib/utils"

/** The 24px "Flecha" arrow from the Figma, in the colour of a status. */
export function StatusArrow({ status, className }: { status: CrewStatus; className?: string }) {
  return <img src={STATUS[status].arrow} alt="" width={24} height={24} className={cn("size-6", className)} />
}
