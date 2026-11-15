import type { ReactNode } from "react"

/** Classes that strip the shadcn Input chrome so it sits inside the glass "Entrada" box. */
export const loginInputClass =
  "h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-[18px] text-white shadow-none placeholder:text-white/55 focus-visible:ring-0 aria-invalid:ring-0 md:text-[18px] dark:bg-transparent"

/** Glass input shell from Figma ("Entrada"): leading 22px icon, 18px radius, 1.5px white/40 border. */
export function LoginInputBox({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-white/40 bg-white/12 px-[18px] py-[14px] transition-colors focus-within:border-white/80 has-aria-invalid:border-[#ff8a8a]">
      <img src={icon} alt="" width={22} height={22} className="shrink-0" />
      {children}
    </div>
  )
}
