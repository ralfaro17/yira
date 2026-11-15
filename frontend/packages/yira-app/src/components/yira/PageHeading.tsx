import type { ReactNode } from "react"

/** Big page title (Inter Extra Bold 56) + 20px subtitle, as on Protocolos / Evaluación. */
export function PageHeading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-extrabold text-white md:text-[56px] md:leading-[1.2]">{title}</h1>
      {subtitle && <p className="text-base text-white/80 md:text-xl">{subtitle}</p>}
    </div>
  )
}
