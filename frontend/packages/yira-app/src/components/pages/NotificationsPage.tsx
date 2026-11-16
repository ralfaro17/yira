import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useAcknowledgeAll, useAlerts } from "@/api/hooks"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { PageHeading } from "@/components/yira/PageHeading"
import { Yiri3D } from "@/components/yira/Yiri3D"
import { ErrorState } from "@/components/yira/QueryState"
import { AlertRow } from "@/components/yira/notifications/AlertRow"
import { Skeleton } from "@/components/ui/skeleton"

function unreadText(t: TFunction, n: number | undefined) {
  if (n === undefined) return t("notifications.loading")
  if (n === 0) return t("notifications.noUnread")
  return t("notifications.unread", { count: n })
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const unread = useAlerts({ acknowledged: false, limit: 1 })
  const alerts = useAlerts({ limit: 20 })
  const ackAll = useAcknowledgeAll()
  const unreadCount = unread.data?.count

  const markAll = () =>
    ackAll.mutate(undefined, {
      onSuccess: ({ acknowledged }) =>
        toast.success(t("notifications.marked", { count: acknowledged })),
      onError: () => toast.error(t("notifications.markError")),
    })

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeading title={t("notifications.title")} subtitle={<span aria-live="polite">{unreadText(t, unreadCount)}</span>} />
        <Button
          onClick={markAll}
          disabled={!unreadCount || ackAll.isPending}
          className="h-auto self-start rounded-pill bg-brand px-6 py-3 text-lg font-medium text-white hover:bg-brand/85 md:self-auto"
        >
          {ackAll.isPending ? t("notifications.marking") : t("notifications.markAll")}
        </Button>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <GlassPanel className="px-6 py-3 md:px-[28px]">
          <h2 className="sr-only">{t("notifications.latest")}</h2>
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
                <EmptyTitle>{t("notifications.emptyTitle")}</EmptyTitle>
                <EmptyDescription className="text-white/80">
                  {t("notifications.emptyDescription")}
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
          <div className="h-[340px] w-[260px]">
            <Yiri3D
              mode="wave"
              className="size-full"
              fallbackSrc="/yira/notifications/mascot.png"
              alt={t("notifications.mascotAlt")}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
