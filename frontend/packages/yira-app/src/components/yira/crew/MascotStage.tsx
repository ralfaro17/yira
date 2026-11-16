import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import type { CrewStatus } from "@/api/types"
import { cn } from "@/lib/utils"

import { YIRI_ALT, YIRI_SRC } from "./mascot"
import { Yiri3D } from "@/components/yira/Yiri3D"

/** Platform body gradient (status colour → black at 52%), Figma 2:90 / 34:27 / 2:217. */
const PLATFORM_FROM: Record<CrewStatus, string> = {
  stable: "from-[#1017ac]",
  observation: "from-observation",
  critical: "from-critical",
  unknown: "from-[#1017ac]",
}

/** "Comenzar Escaneo" pill colours per frame (the critical frame keeps the brand blue). */
const BUTTON: Record<CrewStatus, string> = {
  stable: "bg-brand text-white",
  observation: "bg-observation text-observation-foreground",
  critical: "bg-brand text-white",
  unknown: "bg-brand text-white",
}

/** Rendered geometry of each mascot bitmap inside the 308px stage (from the frames' crops). */
const MASCOT_BOX: Record<CrewStatus, CSSProperties> = {
  stable: { left: 19, top: 5, width: 282, height: 338 },
  observation: { left: 31.6, top: 5, width: 254.7, height: 338 },
  critical: { left: 21, top: -13.3, width: 265, height: 351.1 },
  unknown: { left: 19, top: 5, width: 282, height: 338 },
}

/**
 * Right half of "tripulantes ver": Yiri floating over a glowing platform whose
 * colour follows the focused crew member, plus the "Comenzar Escaneo" button.
 */
export function MascotStage({
  status,
  scanHref,
  name,
  className,
}: {
  status: CrewStatus
  scanHref?: string
  name?: string
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn("relative h-[586px] w-[308px] shrink-0", className)}>
      {/* Platform body */}
      <div
        className={cn(
          "absolute top-[329px] left-0 h-[257px] w-[308px] bg-gradient-to-b to-black to-[52%] transition-colors duration-500",
          PLATFORM_FROM[status],
        )}
      />
      {/* Platform top (white ellipse with glow); SVG keeps its intrinsic 426.6×160.6 size. */}
      <img
        src="/yira/crew/platform-top.svg"
        alt=""
        width={426.6}
        height={160.6}
        className="pointer-events-none absolute top-[248.7px] left-[-59.3px] max-w-none"
      />
      <div className="absolute" style={MASCOT_BOX[status]}>
        <Yiri3D
          key={status}
          status={status}
          mode="idle"
          className="size-full"
          fallbackSrc={YIRI_SRC[status]}
          alt={YIRI_ALT[status]}
        />
      </div>
      {scanHref && (
        <Link
          to={scanHref}
          aria-label={name ? t("crew.startScanFor", { name }) : t("crew.startScanLabel")}
          className={cn(
            "absolute top-[408px] left-[48px] inline-flex h-[46px] w-[212px] items-center justify-center rounded-pill text-xl font-medium tracking-[-0.4px] transition-transform hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none",
            BUTTON[status],
          )}
        >
          {t("crew.startScan")}
        </Link>
      )}
    </div>
  )
}
