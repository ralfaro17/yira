import type { ComponentProps } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Frosted translucent panel ("Tarjeta" in the Figma): white/30, blur 20, radius 43. */
export function GlassPanel({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-panel border border-glass-border bg-glass py-0 text-white shadow-none ring-0 backdrop-blur-[20px]",
        className,
      )}
      {...props}
    />
  )
}
