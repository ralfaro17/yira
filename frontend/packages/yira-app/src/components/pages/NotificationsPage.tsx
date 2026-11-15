import { toast } from "sonner"

import { useAcknowledgeAll, useAlerts } from "@/api/hooks"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { PageHeading } from "@/components/yira/PageHeading"
import { ErrorState } from "@/components/yira/QueryState"
import { AlertRow } from "@/components/yira/notifications/AlertRow"
import { Skeleton } from "@/components/ui/skeleton"

function unreadText(n: number | undefined) {
  if (n === undefined) return "Cargando alertas…"
  if (n === 0) return "No tienes alertas sin leer"
  return n === 1 ? "Tienes 1 alerta sin leer" : `Tienes ${n} alertas sin leer`
}

export function NotificationsPage() {
  const unread = useAlerts({ acknowledged: false, limit: 1 })
  const alerts = useAlerts({ limit: 20 })
  const ackAll = useAcknowledgeAll()
  const unreadCount = unread.data?.count

  const markAll = () =>
    ackAll.mutate(undefined, {
      onSuccess: ({ acknowledged }) =>
        toast.success(acknowledged === 1 ? "1 alerta marcada como leída" : `${acknowledged} alertas marcadas como leídas`),
      onError: () => toast.error("No se pudieron marcar las alertas. Inténtalo de nuevo."),
    })

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeading title="Notificaciones" subtitle={<span aria-live="polite">{unreadText(unreadCount)}</span>} />
        <Button
          onClick={markAll}
          disabled={!unreadCount || ackAll.isPending}
          className="h-auto self-start rounded-pill bg-brand px-6 py-3 text-lg font-medium text-white hover:bg-brand/85 md:self-auto"
        >
          {ackAll.isPending ? "Marcando…" : "Marcar todo como leído"}
        </Button>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <GlassPanel className="px-6 py-3 md:px-[28px]">
          <h2 className="sr-only">Últimas alertas</h2>
          {alerts.isPending ? (
            <div className="flex flex-col gap-4 py-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-14 rounded-2xl bg-white/15" />
              ))}
            </div>
          ) : alerts.isError ? (
            <ErrorState onRetry={() => alerts.refetch()} />
          ) : alerts.data.results.length === 0 ? (
            <Empty className="text-white">
              <EmptyHeader>
                <EmptyTitle>Todo en calma</EmptyTitle>
                <EmptyDescription className="text-white/80">
                  No hay alertas registradas para la tripulación.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul>
              {alerts.data.results.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </ul>
          )}
        </GlassPanel>

        <div className="hidden justify-center md:flex">
          <div className="w-[260px] motion-safe-only animate-float">
            <img src="/yira/notifications/mascot.png" alt="Yiri, la mascota de YIRA, saludando" className="w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
