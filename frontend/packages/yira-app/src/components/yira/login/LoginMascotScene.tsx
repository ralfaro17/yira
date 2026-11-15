import { Yiri3D } from "@/components/yira/Yiri3D"

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
 * Mobile: a compact mascot + bubble above the login card.
 */
export function LoginMascotScene() {
  return (
    <>
      {/* Desktop composition */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <img
          src="/yira/login/mars.png"
          alt=""
          className="absolute left-[210px] top-[244px] h-[742px] w-[1320px] max-w-none object-cover opacity-80"
        />
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
        {/* Glow: 330px node, SVG bleeds 24.24% for the blur. */}
        <img
          src="/yira/login/glow.svg"
          alt=""
          width={490}
          height={490}
          className="absolute left-[640px] top-[293px] size-[490px] max-w-none"
        />
        <div className="absolute left-[560px] top-[131px] flex h-[830px] w-[781px] items-center justify-center">
          <Yiri3D
            mode="wave"
            className="h-[710px] w-[645px]"
            fallbackSrc="/yira/login/mascot-waving.png"
            alt="Yiri, la mascota de YIRA, saludando"
          />
        </div>
      </div>
      <SpeechBubble className="absolute left-[700px] top-[124px] z-20 hidden lg:flex" />

      {/* Mobile / tablet composition */}
      <div className="relative mt-4 flex items-end justify-center gap-2 lg:hidden">
        <Yiri3D
          mode="wave"
          className="h-[170px] w-[150px]"
          fallbackSrc="/yira/login/mascot-waving.png"
          alt="Yiri, la mascota de YIRA, saludando"
        />
        <SpeechBubble className="mb-16 w-auto" />
      </div>
    </>
  )
}
