import { useId, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()

  function send(event: FormEvent) {
    event.preventDefault()
    if (!message.trim()) return
    toast.success(t("protocols.consult.sent"))
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
        {t("protocols.consult.trigger")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={send} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("protocols.consult.title")}</DialogTitle>
            <DialogDescription>
              {t("protocols.consult.description", { title: protocolTitle })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label htmlFor={fieldId} className="text-sm font-medium">
              {t("protocols.consult.message")}
            </label>
            <Textarea
              id={fieldId}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("protocols.consult.placeholder")}
              rows={4}
              maxLength={500}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>{t("protocols.consult.cancel")}</DialogClose>
            <Button type="submit" disabled={!message.trim()} className="bg-brand text-white hover:bg-brand/85">
              {t("protocols.consult.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
