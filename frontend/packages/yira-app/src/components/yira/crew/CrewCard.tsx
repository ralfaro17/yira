import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import type { DashboardCrew } from "@/api/types"
import { CrewPortrait } from "@/components/yira/CrewPortrait"
import { StatusArrow } from "@/components/yira/StatusArrow"
import { STATUS, crewTitle } from "@/lib/status"
import { timeAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

import { crewRole } from "./crewCopy"

/** Split "hace 5 min" into the regular prefix and the bold amount, as in the Figma copy. */
function scanParts(iso: string | null, agoPrefix: string) {
  const text = timeAgo(iso)
  return agoPrefix && text.startsWith(agoPrefix)
    ? { prefix: agoPrefix, amount: text.slice(agoPrefix.length) }
    : { prefix: "", amount: text }
}

/**
 * Crew card (Figma 2:302 / 2:172 / 2:158): 285×518 frosted card with the
 * status-ringed portrait, name/age, role, last scan and the white "Detalles" pill.
 */
export function CrewCard({
  member,
  className,
  inert,
}: {
  member: DashboardCrew
  className?: string
  /** Non-focused deck cards are inert (their neighbour overlay handles clicks). */
  inert?: boolean
}) {
  const { t } = useTranslation()
  const status = STATUS[member.status]
  const scan = scanParts(member.last_scan_at, t("crew.card.agoPrefix"))
  return (
    <article
      inert={inert}
      className={cn(
        "relative h-[518px] w-[285px] rounded-panel border border-glass-border bg-glass-strong text-black backdrop-blur-[20px]",
        className,
      )}
    >
      <CrewPortrait
        photo={member.photo}
        name={member.name}
        status={member.status}
        showBadge
        className="absolute top-[27px] left-[30px] w-[218px]"
      />
      <h2 className="absolute top-[365px] left-[34px] w-[247px] truncate pb-0.5 text-[40px] leading-none font-extrabold tracking-[0.4px]">
        {crewTitle(member)}
      </h2>
      <p className="absolute top-[405px] left-[35px] w-[230px] truncate text-2xl leading-none tracking-[0.24px] text-neutral-900">
        {crewRole(member.role)}
      </p>
      <p className="absolute top-[431px] left-[35px] text-base leading-none tracking-[0.16px]">
        {t("crew.card.lastScan")} {scan.prefix}
        <span className="font-extrabold">{scan.amount}</span>
      </p>
      <Link
        to={`/tripulacion/${member.id}`}
        aria-label={t("crew.card.detailsOf", { name: member.name })}
        className={cn(
          "absolute top-[456px] left-[108px] inline-flex h-[46px] w-[137px] items-center justify-center gap-3 rounded-pill bg-white text-xl font-medium tracking-[-0.4px] transition-transform hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none",
          status.text,
        )}
      >
        {t("crew.card.details")}
        <StatusArrow status={member.status} />
      </Link>
    </article>
  )
}
