import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

/** "Consultar a Tierra" outline pill + message dialog (no backend yet). */
export function ConsultEarthDialog({ protocolTitle }: { protocolTitle: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const fieldId = useId()

  function send(event: FormEvent) {
    event.preventDefault()
    if (!message.trim()) return
    toast.success("Mensaje enviado al equipo médico · Tierra")
    setMessage("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="h-[50px] rounded-pill border border-white/35 bg-white/8 px-[23px] text-left text-base font-medium text-white transition-colors hover:bg-white/15 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none md:w-[224px]"
          />
        }
      >
        Consultar a Tierra
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={send} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Consultar a Tierra</DialogTitle>
            <DialogDescription>
              Envía un mensaje breve al equipo médico sobre el protocolo «{protocolTitle}».
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label htmlFor={fieldId} className="text-sm font-medium">
              Mensaje
            </label>
            <Textarea
              id={fieldId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe la situación o tu consulta…"
              rows={4}
              maxLength={500}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
            <Button type="submit" disabled={!message.trim()} className="bg-brand text-white hover:bg-brand/85">
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
