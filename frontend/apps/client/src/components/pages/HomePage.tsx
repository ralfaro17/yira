import { Link } from "react-router"

import { useDashboard } from "@/api/hooks"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GlassChip } from "@/components/yira/home/GlassChip"
import { newestScan, worstImmuneStatus } from "@/components/yira/home/homeStats"
import { StatsBar } from "@/components/yira/home/StatsBar"
import { ErrorState } from "@/components/yira/QueryState"
import { useGreetingName } from "@/components/yira/welcome/useGreetingName"
import { STATUS } from "@/lib/status"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

/** Figma 49:2 "bienvenida 2 tripulación" (rendered inside AppLayout). */
export function HomePage() {
  const { name, isPending: namePending } = useGreetingName()
  const dashboard = useDashboard()
  const data = dashboard.data
  const loading = dashboard.isPending
  const totals = data?.totals

  const avgHr = totals?.avg_heart_rate != null ? `${Math.round(totals.avg_heart_rate)} bpm` : "—"
  const immune = data ? worstImmuneStatus(data.crew) : "unknown"
  const lastScan = data ? newestScan(data.crew) : null

  return (
    <div className="grid flex-1 items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-6">
      {/* Hero copy */}
      <section className="flex flex-col items-start gap-5">
        <span className="flex items-center gap-2 rounded-pill bg-brand/35 px-[14px] py-[5px] text-[15px] font-medium text-white">
          <span aria-hidden className="motion-safe-only size-2 animate-pulse rounded-full bg-stable" />
          Misión a Marte · Monitoreo en vivo
        </span>

        <h1 className="text-4xl font-extrabold leading-tight text-white md:text-[52px] md:leading-[1.15]">
          ¡Bienvenida a YIRA,{" "}
          {namePending ? (
            <Skeleton className="inline-block h-[0.9em] w-[5ch] bg-white/20 align-baseline" />
          ) : (
            name.toUpperCase()
          )}
          !
        </h1>

        <p className="max-w-[460px] text-base text-white/80 md:text-xl">
          Sigue en tiempo real la salud de tu tripulación y actúa a tiempo ante cualquier señal de alerta.
        </p>

        <Link
          to="/evaluacion"
          className={cn(
            buttonVariants(),
            "h-auto rounded-pill bg-brand px-7 py-3.5 text-lg font-medium text-white shadow-[0px_8px_24px_0px_rgba(0,99,247,0.6)] hover:bg-brand/90 md:text-xl",
          )}
        >
          Conoce tus estados
          <img src="/yira/login/icon-arrow-right.svg" alt="" width={24} height={24} className="size-6" />
        </Link>

        <div className="mt-2 w-full max-w-[480px]">
          {dashboard.isError ? (
            <ErrorState onRetry={() => dashboard.refetch()} />
          ) : (
            <StatsBar
              loading={loading}
              stats={[
                { label: "Tripulantes", value: totals?.crew ?? 0 },
                {
                  label: "En observación",
                  value: totals?.observation ?? 0,
                  hint: totals?.critical ? `${totals.critical} en estado crítico` : undefined,
                },
                { label: "Ritmo promedio", value: avgHr },
              ]}
            />
          )}
        </div>
      </section>

      {/* Mars + mascot on its platform + floating chips */}
      <section aria-label="Resumen en vivo" className="relative mx-auto aspect-square w-full max-w-[460px]">
        <img
          src="/yira/login/mars.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 w-[190%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-80"
        />
        {/* Platform under the mascot. */}
        <div
          aria-hidden
          className="absolute bottom-[6%] left-1/2 h-[12%] w-[62%] -translate-x-1/2 rounded-[50%] border border-glass-border bg-glass shadow-[0_0_60px_10px_rgba(0,99,248,0.45)] backdrop-blur-[20px]"
        />
        {/* Wrapper centres; the image itself animates (animate-float drives the `translate` property). */}
        <div className="absolute inset-x-0 bottom-[11%] flex h-[78%] justify-center">
          <img
            src="/yira/login/mascot-waving.png"
            alt="Yiri, la mascota de YIRA"
            className="motion-safe-only h-full w-auto animate-float object-contain"
          />
        </div>

        <GlassChip
          label="Ritmo cardíaco"
          value={avgHr}
          loading={loading}
          className="absolute left-0 top-[12%] md:-left-6"
        />
        <GlassChip
          label="Sistema inmune"
          value={<span className={STATUS[immune].text}>{STATUS[immune].label}</span>}
          loading={loading}
          className="absolute right-0 top-[32%] md:-right-4"
        />
        <GlassChip
          label="Último escaneo"
          value={timeAgo(lastScan)}
          loading={loading}
          className="absolute bottom-[22%] left-0 md:-left-2"
        />
      </section>
    </div>
  )
}
