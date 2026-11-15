import type { ReactNode } from "react"

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
  return (
    <Empty className="rounded-panel border border-glass-border bg-glass text-white backdrop-blur-[20px]">
      <EmptyHeader>
        <EmptyTitle>No pudimos cargar los datos</EmptyTitle>
        <EmptyDescription className="text-white/80">
          {children ?? "Revisa la conexión con el centro de control e inténtalo de nuevo."}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <Button onClick={onRetry} className="rounded-pill bg-brand px-6 text-white">
          Reintentar
        </Button>
      )}
    </Empty>
  )
}

export function EmptyCrew() {
  return (
    <Empty className="rounded-panel border border-glass-border bg-glass text-white backdrop-blur-[20px]">
      <EmptyHeader>
        <EmptyTitle>Aún no hay tripulantes</EmptyTitle>
        <EmptyDescription className="text-white/80">
          Ejecuta <code>manage.py simulate_mission</code> o registra tripulantes desde el panel de administración.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
