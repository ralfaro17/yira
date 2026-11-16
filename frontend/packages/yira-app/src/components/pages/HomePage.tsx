import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"

import { useDashboard } from "@/api/hooks"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GlassChip } from "@/components/yira/home/GlassChip"
import { newestScan, worstImmuneStatus } from "@/components/yira/home/homeStats"
import { StatsBar } from "@/components/yira/home/StatsBar"
import { Yiri3D } from "@/components/yira/Yiri3D"
import { ErrorState } from "@/components/yira/QueryState"
import { useGreetingName } from "@/components/yira/welcome/useGreetingName"
import { STATUS } from "@/lib/status"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

/** Figma 49:2 "bienvenida 2 tripulación" (rendered inside AppLayout). */
export function HomePage() {
  const { t } = useTranslation()
  const { name, isPending: namePending } = useGreetingName()
  const dashboard = useDashboard()
  const navigate = useNavigate()
  const [isMounted, setIsMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  function handleNavigate(to: string) {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => {
      navigate(to)
    }, 450)
  }

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
          {t("home.badge")}
        </span>

        <h1 className="text-4xl font-extrabold leading-tight text-white md:text-[52px] md:leading-[1.15]">
          {t("home.welcomeBefore")}{" "}
          {namePending ? (
            <Skeleton className="inline-block h-[0.9em] w-[5ch] bg-white/20 align-baseline" />
          ) : (
            name.toUpperCase()
          )}
          {t("home.welcomeAfter")}
        </h1>

        <p className="max-w-[460px] text-base text-white/80 md:text-xl">
          {t("home.intro")}
        </p>

        <Link
          to="/evaluacion"
          onClick={(e) => {
            e.preventDefault()
            handleNavigate("/evaluacion")
          }}
          className={cn(
            buttonVariants(),
            "h-auto rounded-pill bg-brand px-7 py-3.5 text-lg font-medium text-white shadow-[0px_8px_24px_0px_rgba(0,99,247,0.6)] hover:bg-brand/90 md:text-xl",
          )}
        >
          {t("home.cta")}
          <img src="/yira/login/icon-arrow-right.svg" alt="" width={24} height={24} className="size-6" />
        </Link>

        <div className="mt-2 w-full max-w-[480px]">
          {dashboard.isError ? (
            <ErrorState onRetry={() => dashboard.refetch()} />
          ) : (
            <StatsBar
              loading={loading}
              stats={[
                { label: t("home.stats.crew"), value: totals?.crew ?? 0 },
                {
                  label: t("home.stats.observation"),
                  value: totals?.observation ?? 0,
                  hint: totals?.critical ? t("home.stats.critical", { count: totals.critical }) : undefined,
                },
                { label: t("home.stats.avgHeartRate"), value: avgHr },
              ]}
            />
          )}
        </div>
      </section>

      {/* Mars + mascot on its platform + floating chips */}
      <section
        aria-label={t("home.liveSummary")}
        className={cn(
          "relative mx-auto aspect-square w-full max-w-[460px] transition-all duration-700 ease-out",
          !isMounted && "scale-95 opacity-0",
          isMounted && !isExiting && "scale-100 opacity-100",
          isExiting && "scale-90 opacity-0 duration-400 ease-in",
        )}
      >
        {/* Animated Mars: slides in and un-vanishes on load, slides down and vanishes on exit */}
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 w-[190%] max-w-none -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out",
            !isMounted && "translate-y-8 scale-75 opacity-0 blur-md",
            isMounted && !isExiting && "translate-y-0 scale-100 opacity-80 blur-0",
            isExiting && "translate-y-16 scale-75 opacity-0 blur-lg duration-500 ease-in",
          )}
        >
          <img
            src="/yira/login/mars.png"
            alt=""
            aria-hidden
            className="size-full object-contain motion-safe-only animate-mars-float"
          />
        </div>
        {/* Platform under the mascot. */}
        <div
          aria-hidden
          className="absolute bottom-[6%] left-1/2 h-[12%] w-[62%] -translate-x-1/2 rounded-[50%] border border-glass-border bg-glass shadow-[0_0_60px_10px_rgba(0,99,248,0.45)] backdrop-blur-[20px]"
        />
        {/* Wrapper centres; 3D interactive Yiri floating over the platform. */}
        <div className="absolute inset-x-0 bottom-[11%] flex h-[78%] justify-center">
          <Yiri3D
            mode="wave"
            interactive
            className="h-full w-full"
            fallbackSrc="/yira/login/mascot-waving.png"
            alt={t("home.mascotAlt")}
          />
        </div>

        <GlassChip
          label={t("home.chips.heartRate")}
          value={avgHr}
          loading={loading}
          className="absolute left-0 top-[12%] md:-left-6"
        />
        <GlassChip
          label={t("home.chips.immune")}
          value={<span className={STATUS[immune].text}>{STATUS[immune].label}</span>}
          loading={loading}
          className="absolute right-0 top-[32%] md:-right-4"
        />
        <GlassChip
          label={t("home.chips.lastScan")}
          value={timeAgo(lastScan)}
          loading={loading}
          className="absolute bottom-[22%] left-0 md:-left-2"
        />
      </section>
    </div>
  )
}
