import { Progress } from "@base-ui/react/progress"
import { useTranslation } from "react-i18next"

import type { CrewStatus } from "@/api/types"
import { ProgressIndicator, ProgressTrack } from "@/components/ui/progress"
import { Yiri3D } from "@/components/yira/Yiri3D"
import { STATUS } from "@/lib/status"
import { cn } from "@/lib/utils"

const MASCOT: Record<CrewStatus, string> = {
  stable: "/yira/scan/mascot-stable.png",
  observation: "/yira/scan/mascot-observation.png",
  critical: "/yira/scan/mascot-critical.png",
  unknown: "/yira/scan/mascot-stable.png",
}

/** Pedestal gradient top colour (Figma "Pedestal": #1017ac → black at 52%). */
const PEDESTAL: Record<CrewStatus, string> = {
  stable: "from-[#1017ac]",
  observation: "from-[#8a7400]",
  critical: "from-[#8f0f1d]",
  unknown: "from-[#1017ac]",
}

const SCAN_LINE: Record<CrewStatus, string> = {
  stable: "via-brand shadow-[0_0_18px_4px_rgba(0,99,248,0.6)]",
  observation: "via-observation shadow-[0_0_18px_4px_rgba(248,223,0,0.5)]",
  critical: "via-critical shadow-[0_0_18px_4px_rgba(226,36,36,0.55)]",
  unknown: "via-brand shadow-[0_0_18px_4px_rgba(0,99,248,0.6)]",
}

/**
 * Centre of the scan frame: scan rings, floating + rotating mascot on its
 * platform, scanning line, percentage, caption and progress bar.
 * Geometry follows the 411×480 column between the two 300px cards in Figma 26:103.
 */
export function ScanStage({
  status,
  name,
  progress,
  caption,
  animate,
}: {
  status: CrewStatus
  name: string
  progress: number
  caption: string
  animate: boolean
}) {
  const { t } = useTranslation()
  const value = Math.round(progress)
  return (
    // Fixed-size stage, scaled down on narrow screens so the 360px ring fits.
    <div className="flex h-[400px] justify-center md:h-[480px]">
      <div className="relative h-[480px] w-[411px] shrink-0 origin-top max-md:scale-[0.82]">
        {/* Scan rings */}
        <img
          src="/yira/scan/ring-outer.svg"
          alt=""
          width={360}
          height={360}
          className={cn("absolute left-[25.5px] top-[-20px] size-[360px]", animate && "motion-safe-only animate-spin [animation-duration:24s]")}
        />
        <img
          src="/yira/scan/ring-inner.png"
          alt=""
          width={330}
          height={330}
          className={cn(
            "absolute left-[40.5px] top-[-5px] size-[330px]",
            animate && "motion-safe-only animate-spin [animation-direction:reverse] [animation-duration:18s]",
          )}
        />

        {/* Pedestal + platform */}
        <div
          aria-hidden
          className={cn("absolute left-[51.5px] top-[335px] h-[170px] w-[308px] bg-linear-to-b to-black to-52%", PEDESTAL[status])}
        />
        <div className="absolute left-[51.5px] top-[317px] h-[42px] w-[308px]">
          <div className="absolute inset-[-140.48%_-19.16%]">
            <img src="/yira/scan/platform.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>

        {/* 3D Mascot: horizontal spin while scanning, organic idle otherwise */}
        <div className="absolute left-[64.5px] top-0 h-[338px] w-[282px]">
          <Yiri3D
            isScanning={animate}
            mode={animate ? "spin" : "idle"}
            status={status}
            className="size-full"
            fallbackSrc={MASCOT[status]}
            alt={t("scan.mascotAlt", { name })}
          />
        </div>

        {/* Scanning line (keyframes move `top` 8% → 88% of this box) */}
        {animate && (
          <div aria-hidden className="pointer-events-none absolute left-[40px] top-0 h-[338px] w-[331px]">
            <div
              className={cn(
                "absolute inset-x-0 h-[3px] rounded-full bg-linear-to-r from-transparent to-transparent motion-safe-only animate-scan",
                SCAN_LINE[status],
              )}
            />
          </div>
        )}

        {/* Percentage, caption and bar */}
        <div className="absolute inset-x-0 top-[378px] flex flex-col items-center">
          <p className="text-[32px] font-extrabold text-white">{value}%</p>
          <p aria-live="polite" className="mt-[12px] text-[15px] text-white/85">
            {caption}
          </p>
          <Progress.Root value={value} aria-label={t("scan.progressLabel")} className="mt-[17px] w-[220px]">
            <ProgressTrack className="h-2 rounded-[4px] bg-white/20">
              <ProgressIndicator className={cn("rounded-none", status === "stable" || status === "unknown" ? "bg-brand" : STATUS[status].bg)} />
            </ProgressTrack>
          </Progress.Root>
        </div>
      </div>
    </div>
  )
}
