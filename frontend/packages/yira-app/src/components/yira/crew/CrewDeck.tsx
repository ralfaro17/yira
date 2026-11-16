import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import type { DashboardCrew } from "@/api/types"
import { Carousel, CarouselContent, CarouselItem, useCarousel, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

import { CrewCard } from "./CrewCard"

/** Horizontal distance between stacked cards in the frames (285px cards, 93px apart). */
const STEP = 93

/** Round white arrow button (Figma "Group 10"/"Group 11"; the previous one is the same asset rotated). */
function DeckArrow({ direction }: { direction: "prev" | "next" }) {
  const { t } = useTranslation()
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()
  const prev = direction === "prev"
  return (
    <button
      type="button"
      onClick={prev ? scrollPrev : scrollNext}
      disabled={prev ? !canScrollPrev : !canScrollNext}
      aria-label={prev ? t("crew.deck.previous") : t("crew.deck.next")}
      className={cn(
        "absolute top-[222px] z-40 rounded-pill transition-[opacity,transform] hover:scale-105 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        prev ? "left-0" : "right-0",
      )}
    >
      <img src="/yira/crew/carousel-arrow.svg" alt="" width={48} height={46} className={cn(prev && "rotate-180")} />
    </button>
  )
}

/**
 * Embla carousel laid out as the overlapping deck of the "tripulantes ver"
 * frames: every slide is 93px wide and holds a centred 285px card, so the
 * focused card sits on top and its neighbours peek out behind it.
 */
export function CrewDeck({
  crew,
  onFocusChange,
  className,
}: {
  crew: DashboardCrew[]
  onFocusChange?: (index: number) => void
  className?: string
}) {
  const { t } = useTranslation()
  const [api, setApi] = useState<CarouselApi>()
  const [focused, setFocused] = useState(0)

  useEffect(() => {
    if (!api) return
    const sync = () => {
      const index = api.selectedScrollSnap()
      setFocused(index)
      onFocusChange?.(index)
    }
    sync()
    api.on("select", sync)
    api.on("reInit", sync)
    return () => {
      api.off("select", sync)
      api.off("reInit", sync)
    }
  }, [api, onFocusChange])

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: "center", containScroll: false }}
      aria-label={t("crew.title")}
      className={cn("w-full max-w-[535px] sm:px-[32px]", className)}
    >
      <CarouselContent className="ml-0 h-[518px]">
        {crew.map((member, index) => {
          const distance = Math.abs(index - focused)
          const isFocused = distance === 0
          return (
            <CarouselItem
              key={member.id}
              aria-label={t("crew.deck.position", { index: index + 1, total: crew.length, name: member.name })}
              aria-current={isFocused ? "true" : undefined}
              className={cn("relative pl-0 transition-opacity duration-300", distance > 1 && "pointer-events-none opacity-0")}
              style={{ flexBasis: STEP, zIndex: 30 - distance }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2">
                <CrewCard member={member} inert={!isFocused} />
                {!isFocused && distance === 1 && (
                  <button
                    type="button"
                    onClick={() => api?.scrollTo(index)}
                    aria-label={t("crew.deck.show", { name: member.name })}
                    className="absolute inset-0 rounded-panel focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"
                  />
                )}
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <DeckArrow direction="prev" />
      <DeckArrow direction="next" />
    </Carousel>
  )
}
