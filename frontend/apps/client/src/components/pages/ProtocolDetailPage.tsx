import { Link, Navigate, useParams } from "react-router"
import { toast } from "sonner"

import { Checkbox } from "@/components/ui/checkbox"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { ConsultEarthDialog } from "@/components/yira/protocols/ConsultEarthDialog"
import { PROTOCOL_PRIMARY_TEXT, PROTOCOL_THEME } from "@/components/yira/protocols/theme"
import { useProtocolProgress } from "@/components/yira/protocols/useProtocolProgress"
import { getProtocol, protocolMeta, type Protocol } from "@/data/protocols"
import { cn } from "@/lib/utils"

/** Figma 166:2 / 166:18 / 166:34 — protocol detail with checklist and Earth guidance. */
export function ProtocolDetailPage() {
  const { slug } = useParams()
  const protocol = getProtocol(slug)
  if (!protocol) return <Navigate to="/protocolos" replace />
  // Keyed so the persisted state is re-read when navigating between protocols.
  return <ProtocolDetail key={protocol.slug} protocol={protocol} />
}

/** Panel look of these frames: white/25, border white/30, radius 36. */
const PANEL = "rounded-[36px] border-white/30 bg-white/25"

function ProtocolDetail({ protocol }: { protocol: Protocol }) {
  const theme = PROTOCOL_THEME[protocol.category]
  const { done, active, toggleStep, start, finish } = useProtocolProgress(protocol.slug)
  const total = protocol.steps.length
  const completed = protocol.steps.filter((s) => done.includes(s.number)).length
  const allDone = completed === total

  function onPrimary() {
    if (!active) {
      start()
      toast(`Protocolo iniciado · ${protocol.title}`, {
        description: "Marca cada paso del plan de acción a medida que lo completes.",
      })
      return
    }
    if (!allDone) return
    finish()
    toast.success(`Protocolo finalizado · ${protocol.title}`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera del protocolo */}
      <header className="flex flex-col">
        <Link
          to="/protocolos"
          className="self-start text-[17px] leading-[22px] font-medium whitespace-pre text-white hover:underline"
        >
          {"←  Volver a protocolos"}
        </Link>
        <div className="mt-[15px] flex flex-wrap items-center gap-4">
          <span className={cn("rounded-pill px-3.5 py-[5px] text-base leading-[21px] font-medium", theme.chip)}>
            {protocol.categoryLabel}
          </span>
          <p className="text-[15px] leading-5 font-medium whitespace-pre-wrap text-[#cad5e0]">
            {`${protocolMeta(protocol)}  /  ${protocol.code}`}
          </p>
        </div>
        <h1 className="mt-1.5 text-[34px] leading-tight font-extrabold text-white md:text-[42px] md:leading-[55px]">
          {protocol.title}
        </h1>
        <p className="text-[17px] leading-[22px] text-[#cad5e0]">{protocol.subtitle}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-[650fr_344fr]">
        {/* Plan de acción */}
        <GlassPanel className={cn(PANEL, "px-[25px] pt-[19px] pb-6 md:min-h-[337px]")}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[23px] leading-[30px] font-bold text-white">Plan de acción</h2>
            <p className="text-sm leading-[18px] font-medium text-[#d8e2ec] md:w-[220px]" aria-live="polite">
              {completed} / {total} completados
            </p>
          </div>
          <div
            className="mt-[5px] h-[3px] overflow-hidden rounded-[2px] bg-white/22"
            role="progressbar"
            aria-label="Progreso del plan de acción"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
          >
            <div className={cn("h-full transition-[width]", theme.bar)} style={{ width: `${(completed / total) * 100}%` }} />
          </div>
          <ol className="mt-[15px] flex flex-1 flex-col justify-evenly gap-3">
            {protocol.steps.map((step) => {
              const checked = done.includes(step.number)
              const number = String(step.number).padStart(2, "0")
              return (
                <li key={step.number}>
                  <label className="group flex cursor-pointer items-start gap-[13px]">
                    <span className="relative mt-0.5 size-7 shrink-0">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleStep(step.number, value)}
                        aria-label={`Paso ${step.number}: ${step.title}`}
                        className={cn(
                          "size-7 rounded-full border-transparent after:hidden [&_[data-slot=checkbox-indicator]>svg]:size-4",
                          theme.stepCheckbox,
                        )}
                      />
                      {!checked && (
                        <span
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute inset-0 grid place-items-center text-[13px] leading-[17px] font-bold",
                            theme.accent,
                          )}
                        >
                          {number}
                        </span>
                      )}
                    </span>
                    <span className={cn("flex flex-col transition-opacity", checked && "opacity-70")}>
                      <span className={cn("text-[17px] leading-[22px] font-bold text-white", checked && "line-through")}>
                        {step.title}
                      </span>
                      <span className="text-sm leading-[18px] text-[#e0e7ee]">{step.detail}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ol>
        </GlassPanel>

        {/* Indicaciones de Tierra */}
        <GlassPanel className={cn(PANEL, "px-[17px] pt-[21px] pb-[17px] md:min-h-[337px]")}>
          <div className="px-1.5">
            <p className={cn("text-[13px] leading-[17px] font-bold whitespace-pre-wrap", theme.accent)}>
              {protocol.guidance.direction}
            </p>
            <h2 className="mt-2.5 text-[21px] leading-[27px] font-bold text-white">{protocol.guidance.team}</h2>
            <p className="mt-[11px] text-[17px] leading-[22px] text-[#f0f4f8]">{protocol.guidance.body}</p>
          </div>
          <div className="min-h-4 flex-1" />
          <div className="rounded-[24px] bg-[rgba(7,21,32,0.57)] px-4 pt-3.5 pb-4 md:min-h-[119px]">
            <p className={cn("text-base leading-[21px] font-bold", theme.accent)}>{protocol.guidance.note.title}</p>
            <p className="mt-2 text-sm leading-[18px] text-[#e0e7ee]">{protocol.guidance.note.text}</p>
          </div>
        </GlassPanel>
      </div>

      {/* Acciones de seguimiento */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <p className="pt-[3px] text-sm leading-[18px] text-[#cad5e0]">
          {protocol.footerNote[0]}
          <br />
          {protocol.footerNote[1]}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <ConsultEarthDialog protocolTitle={protocol.title} />
          <button
            type="button"
            onClick={onPrimary}
            disabled={active && !allDone}
            title={active && !allDone ? "Completa todos los pasos para finalizar" : undefined}
            className={cn(
              "h-[50px] rounded-pill bg-white px-6 text-left text-base font-medium transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 md:w-[264px]",
              PROTOCOL_PRIMARY_TEXT[protocol.category],
            )}
          >
            {active ? "Finalizar protocolo" : protocol.startLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
