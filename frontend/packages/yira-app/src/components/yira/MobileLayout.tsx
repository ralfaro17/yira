import { ClipboardList, Download, House, Activity, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, NavLink, Outlet } from "react-router"

import { useDashboard } from "@/api/hooks"
import { Button } from "@/components/ui/button"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import { cn } from "@/lib/utils"

import { NotificationBell, ProfileLink, YiraLogo } from "./AppHeader"
import { LanguageSwitch } from "./LanguageSwitch"
import { SpaceBackground } from "./SpaceBackground"

const TABS = [
  { to: "/", key: "layout.nav.home", icon: House, end: true },
  { to: "/tripulacion", key: "layout.nav.crew", icon: Users, end: false },
  { to: "/protocolos", key: "layout.nav.protocols", icon: ClipboardList, end: false },
  { to: "/evaluacion", key: "layout.nav.evaluation", icon: Activity, end: false },
]

/**
 * Mobile (PWA/TWA) shell: compact top bar, scrollable content and a fixed bottom
 * tab bar, padded for notches/home indicators via `env(safe-area-inset-*)`.
 * Pages are the same as on web; they already stack below `md`.
 */
export function MobileLayout() {
  const { t } = useTranslation()
  const { data } = useDashboard()
  const unread = data?.totals.unread_alerts ?? 0
  const { canInstall, install } = useInstallPrompt()

  return (
    <div className="relative min-h-svh overflow-x-clip">
      <SpaceBackground />

      <header
        className="sticky top-0 z-30 flex items-center gap-3 bg-space/80 px-4 pb-3 backdrop-blur-md"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <Link to="/" aria-label={t("layout.nav.home")} className="flex min-h-11 items-center">
          <YiraLogo className="h-[25px] w-[104px]" />
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitch />
          {canInstall && (
            <Button
              size="sm"
              onClick={install}
              className="h-9 rounded-pill bg-brand px-3 text-white"
              aria-label={t("layout.installApp")}
            >
              <Download data-icon="inline-start" />
              {t("layout.install")}
            </Button>
          )}
          <NotificationBell unread={unread} />
          <ProfileLink className="size-9" />
        </div>
      </header>

      <main
        className="mx-auto flex w-full max-w-[640px] flex-col px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}
      >
        <Outlet />
      </main>

      <nav
        aria-label={t("layout.nav.main")}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-glass-border bg-space/85 backdrop-blur-[20px]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto grid max-w-[640px] grid-cols-4">
          {TABS.map(({ to, key, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white/65 transition-colors",
                    isActive && "text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-7 w-12 items-center justify-center rounded-pill transition-colors",
                        isActive && "bg-[rgba(0,99,248,0.35)] ring-1 ring-[rgba(90,150,255,0.5)]",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    {t(key)}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
