import { Yiri3D } from "@/components/yira/Yiri3D"
import { cn } from "@/lib/utils"

const SPARKLES = [
  { src: "/yira/login/sparkle-1.svg", size: 16, left: 560, top: 170 },
  { src: "/yira/login/sparkle-2.svg", size: 22, left: 1040, top: 180 },
  { src: "/yira/login/sparkle-3.svg", size: 14, left: 1060, top: 420 },
  { src: "/yira/login/sparkle-4.svg", size: 16, left: 620, top: 640 },
  { src: "/yira/login/sparkle-5.svg", size: 12, left: 900, top: 130 },
]

function SpeechBubble({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex w-[200px] flex-col gap-[2px] rounded-[24px] border border-glass-border bg-glass px-[22px] py-[14px] whitespace-nowrap backdrop-blur-[20px] ${className}`}
    >
      <p className="text-[22px] font-bold text-white">¡Hola!</p>
      <p className="text-[15px] text-white/80">Tu tripulación te espera</p>
    </div>
  )
}

/**
 * Mars, glow, sparkles, speech bubble and the waving mascot.
 * Desktop (lg+): absolutely placed with the 1133×744 frame coordinates (decorative layer).
 * Mobile: a compact mascot + bubble above the login card with background Mars aura.
 */
export function LoginMascotScene({
  isMounted = true,
  isExiting = false,
}: {
  isMounted?: boolean
  isExiting?: boolean
}) {
  return (
    <>
      {/* Desktop composition */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {/* Animated Mars: slides in & un-vanishes on load, slides out & vanishes on exit */}
        <div
          className={cn(
            "absolute left-[210px] top-[244px] h-[742px] w-[1320px] max-w-none transition-all duration-1000 ease-out",
            !isMounted && "translate-y-28 translate-x-14 scale-90 opacity-0 blur-md",
            isMounted && !isExiting && "translate-y-0 translate-x-0 scale-100 opacity-80 blur-0",
            isExiting && "translate-y-40 translate-x-24 scale-85 opacity-0 blur-lg duration-600 ease-in",
          )}
        >
          <img
            src="/yira/login/mars.png"
            alt=""
            className="size-full object-cover motion-safe-only animate-mars-float"
          />
        </div>

        {/* Sparkles with smooth entrance & exit */}
        <div
          className={cn(
            "transition-all duration-1000 ease-out",
            !isMounted && "opacity-0 scale-90",
            isMounted && !isExiting && "opacity-100 scale-100",
            isExiting && "opacity-0 scale-75 duration-500 ease-in",
          )}
        >
          {SPARKLES.map((s) => (
            <img
              key={s.src}
              src={s.src}
              alt=""
              width={s.size}
              height={s.size}
              className="absolute"
              style={{ left: s.left, top: s.top }}
            />
          ))}
        </div>

        {/* Glow: 330px node, SVG bleeds 24.24% for the blur. */}
        <div
          className={cn(
            "absolute left-[640px] top-[293px] size-[490px] max-w-none transition-all duration-1000 ease-out",
            !isMounted && "scale-75 opacity-0",
            isMounted && !isExiting && "scale-100 opacity-100",
            isExiting && "scale-50 opacity-0 duration-500 ease-in",
          )}
        >
          <img src="/yira/login/glow.svg" alt="" width={490} height={490} className="size-full" />
        </div>

        {/* 3D Mascot waving */}
        <div
          className={cn(
            "absolute left-[560px] top-[131px] flex h-[830px] w-[781px] items-center justify-center transition-all duration-900 ease-out",
            !isMounted && "translate-y-14 scale-95 opacity-0",
            isMounted && !isExiting && "translate-y-0 scale-100 opacity-100",
            isExiting && "translate-y-20 scale-90 opacity-0 duration-500 ease-in",
          )}
        >
          <Yiri3D
            mode="wave"
            className="h-[710px] w-[645px]"
            fallbackSrc="/yira/login/mascot-waving.png"
            alt="Yiri, la mascota de YIRA, saludando"
          />
        </div>
      </div>

      <div
        className={cn(
          "transition-all duration-700 ease-out",
          !isMounted && "translate-y-4 opacity-0",
          isMounted && !isExiting && "translate-y-0 opacity-100",
          isExiting && "-translate-y-4 opacity-0 duration-400 ease-in",
        )}
      >
        <SpeechBubble className="absolute left-[700px] top-[124px] z-20 hidden lg:flex" />
      </div>

      {/* Mobile / tablet composition */}
      <div className="relative mt-4 flex items-end justify-center gap-2 lg:hidden">
        {/* Subtle Mars backdrop on mobile */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-6 h-[220px] w-[340px] -z-10 transition-all duration-1000 ease-out",
            !isMounted && "translate-y-12 scale-90 opacity-0 blur-sm",
            isMounted && !isExiting && "translate-y-0 scale-100 opacity-60 blur-0",
            isExiting && "translate-y-16 scale-80 opacity-0 blur-md duration-500 ease-in",
          )}
        >
          <img
            src="/yira/login/mars.png"
            alt=""
            className="size-full object-cover object-top motion-safe-only animate-mars-float"
          />
        </div>

        <Yiri3D
          mode="wave"
          className={cn(
            "h-[170px] w-[150px] transition-all duration-700 ease-out",
            !isMounted && "translate-y-6 opacity-0",
            isMounted && !isExiting && "translate-y-0 opacity-100",
            isExiting && "translate-y-8 opacity-0 duration-400 ease-in",
          )}
          fallbackSrc="/yira/login/mascot-waving.png"
          alt="Yiri, la mascota de YIRA, saludando"
        />
        <SpeechBubble
          className={cn(
            "mb-16 w-auto transition-all duration-500",
            (!isMounted || isExiting) && "translate-y-2 opacity-0",
          )}
        />
      </div>
    </>
  )
}
