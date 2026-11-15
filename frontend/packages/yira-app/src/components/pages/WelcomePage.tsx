import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { YiraLogo } from "@/components/yira/AppHeader"
import { SpaceBackground } from "@/components/yira/SpaceBackground"
import { useGreetingName } from "@/components/yira/welcome/useGreetingName"
import { cn } from "@/lib/utils"

/** Figma 1:3 "bienvenida 1 tierra": full-bleed intro shown right after login. */
export function WelcomePage() {
  const { name, isPending } = useGreetingName()
  const navigate = useNavigate()
  const [isMounted, setIsMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  function handleContinue(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => {
      navigate("/tripulacion")
    }, 550)
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <SpaceBackground />

      {/* Big Mars rising from the bottom edge (cinematic entrance & exit). */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-[52%] w-[1500px] max-w-none -translate-x-1/2 md:top-[46%] md:w-[1900px] transition-all duration-1200 ease-out",
          !isMounted && "translate-y-[40%] scale-90 opacity-0 blur-md",
          isMounted && !isExiting && "translate-y-0 scale-100 opacity-100 blur-0",
          isExiting && "translate-y-[55%] scale-90 opacity-0 blur-lg duration-600 ease-in",
        )}
      >
        <img
          src="/yira/login/mars.png"
          alt=""
          aria-hidden
          className="size-full object-cover motion-safe-only animate-mars-float"
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1133px] flex-1 flex-col px-4 md:px-[61px]">
        <header
          className={cn(
            "pt-8 md:pt-[62px] transition-all duration-700 ease-out",
            !isMounted && "-translate-y-4 opacity-0",
            isMounted && !isExiting && "translate-y-0 opacity-100",
            isExiting && "-translate-y-4 opacity-0 duration-400 ease-in",
          )}
        >
          <Link to="/" aria-label="Inicio" className="inline-block">
            <YiraLogo />
          </Link>
        </header>

        <main
          className={cn(
            "flex flex-col items-center gap-8 pt-16 text-center md:pt-[72px] transition-all duration-900 ease-out",
            !isMounted && "translate-y-8 opacity-0",
            isMounted && !isExiting && "translate-y-0 opacity-100",
            isExiting && "-translate-y-8 opacity-0 scale-95 duration-500 ease-in",
          )}
        >
          <h1 className="max-w-[900px] text-4xl font-extrabold leading-tight text-white md:text-[56px] md:leading-[1.2]">
            ¡Bienvenida a YIRA,{" "}
            {isPending ? (
              <Skeleton className="inline-block h-[0.9em] w-[5ch] translate-y-[0.1em] bg-white/20 align-baseline" />
            ) : (
              name
            )}
            !
          </h1>
          <Link
            to="/tripulacion"
            onClick={handleContinue}
            className={cn(
              buttonVariants(),
              "h-auto rounded-pill bg-brand px-8 py-4 text-lg font-medium text-white shadow-[0px_8px_24px_0px_rgba(0,99,247,0.6)] hover:bg-brand/90 md:text-[22px]",
            )}
          >
            Conocé tu tripulación
            <img src="/yira/login/icon-arrow-right.svg" alt="" width={24} height={24} className="size-6" />
          </Link>
        </main>
      </div>
    </div>
  )
}
