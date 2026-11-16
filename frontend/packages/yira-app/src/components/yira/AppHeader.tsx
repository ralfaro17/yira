import { useTranslation } from "react-i18next"
import { Link, NavLink } from "react-router"

import { useDashboard } from "@/api/hooks"
import { cn } from "@/lib/utils"

import { LanguageSwitch } from "./LanguageSwitch"

const NAV = [
  { to: "/tripulacion", key: "layout.nav.crew" },
  { to: "/protocolos", key: "layout.nav.protocols" },
  { to: "/evaluacion", key: "layout.nav.evaluation" },
]

export function YiraLogo({ className }: { className?: string }) {
  // The logo PNG has transparent padding; the Figma crops it (h 233.65%, top -71.96%).
  return (
    <span className={cn("relative block h-[31px] w-[129px] overflow-hidden", className)}>
      <img
        src="/yira/common/logo-yira.png"
        alt="YIRA"
        className="absolute left-0 top-[-71.96%] h-[233.65%] w-full max-w-none"
      />
    </span>
  )
}

export function AppHeader({ showNav = true }: { showNav?: boolean }) {
  const { t } = useTranslation()
  const { data } = useDashboard()
  const unread = data?.totals.unread_alerts ?? 0

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-8 md:pt-[62px]">
      <Link to="/" aria-label={t("layout.nav.home")}>
        <YiraLogo />
      </Link>

      {showNav && (
        <nav className="order-last flex w-full justify-center gap-2 md:order-none md:ml-auto md:w-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-pill border border-transparent px-3 py-[3px] text-base font-bold text-white transition-colors hover:bg-white/10 md:text-xl",
                  isActive && "border-[rgba(90,150,255,0.5)] bg-[rgba(0,99,248,0.25)]",
                )
              }
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      )}

      <div className={cn("ml-auto flex items-center gap-[14px]", showNav && "md:ml-[86px]")}>
        <LanguageSwitch />
        <NotificationBell unread={unread} />
        <ProfileLink />
      </div>
    </header>
  )
}

/** Bell linking to /notificaciones. The asset has a static "1" badge baked in: cover it with the live count. */
export function NotificationBell({ unread, className }: { unread: number; className?: string }) {
  const { t } = useTranslation()
  return (
    <Link
      to="/notificaciones"
      aria-label={unread ? t("layout.notificationsUnread", { count: unread }) : t("layout.notifications")}
      className={cn("relative size-9 shrink-0 rounded-full", className)}
    >
      <img src="/yira/common/bell.png" alt="" className="size-full object-cover" />
      <span
        aria-hidden
        className={cn(
          "absolute right-[3px] top-[4.5px] flex size-[15px] items-center justify-center rounded-full text-[9px] font-extrabold leading-none text-white",
          unread > 0 ? "bg-[#e22424]" : "bg-space",
        )}
      >
        {unread > 0 ? (unread > 9 ? "9+" : unread) : null}
      </span>
    </Link>
  )
}

export function ProfileLink({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <Link to="/perfil" aria-label={t("layout.profile")} className={cn("size-[33px] shrink-0 rounded-full", className)}>
      <img src="/yira/common/profile.png" alt="" className="size-full object-cover" />
    </Link>
  )
}
