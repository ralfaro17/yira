import { copyText } from "@/platform"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/** "Resumen para la tierra" pill + dialog with a copyable plain-text report. */
export function EarthSummaryDialog({ name, summary, className }: { name: string; summary: string; className?: string }) {
  async function copy() {
    try {
      await copyText(summary)
      toast.success("Resumen copiado al portapapeles")
    } catch {
      toast.error("No se pudo copiar el resumen")
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex h-[46px] w-[230px] items-center justify-center rounded-pill bg-brand text-xl font-medium tracking-[-0.4px] text-white transition-transform hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none",
              className,
            )}
          />
        }
      >
        Resumen para la tierra
      </DialogTrigger>
      <DialogContent className="rounded-[28px] border border-glass-border bg-[#0b1b2b]/95 p-6 text-white backdrop-blur-[20px] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Resumen para la tierra</DialogTitle>
          <DialogDescription className="text-white/70">
            Informe de {name} listo para enviar al equipo médico en Tierra.
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[50svh] overflow-auto rounded-2xl bg-black/40 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-white/90">
          {summary}
        </pre>
        <DialogFooter className="mx-0 mb-0 border-none bg-transparent p-0">
          <Button onClick={copy} className="h-10 rounded-pill bg-brand px-6 text-base text-white hover:bg-brand/85">
            <Copy aria-hidden />
            Copiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
