import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { errorMessage } from "@/api/client"
import { useRequestPasswordReset } from "@/api/hooks"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-fills the email when the login field already holds one. */
  defaultEmail?: string
}

export function ForgotPasswordDialog({ open, onOpenChange, defaultEmail = "" }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[28px] border border-glass-border bg-[#0b2230]/90 p-6 text-white ring-0 backdrop-blur-[20px] sm:max-w-md">
        {/* The popup unmounts when closed, so the form (and its mutation) starts fresh on every open. */}
        <ForgotPasswordForm
          initialEmail={defaultEmail.includes("@") ? defaultEmail.trim() : ""}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function ForgotPasswordForm({ initialEmail, onDone }: { initialEmail: string; onDone: () => void }) {
  const { t } = useTranslation()
  const reset = useRequestPasswordReset()
  const [email, setEmail] = useState(initialEmail)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await reset.mutateAsync(email.trim())
      toast.success(t("login.reset.sent"))
      onDone()
    } catch {
      // Shown inline below the field.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{t("login.reset.title")}</DialogTitle>
        <DialogDescription className="text-white/75">
          {t("login.reset.description")}
        </DialogDescription>
      </DialogHeader>

      <Field data-invalid={reset.isError || undefined}>
        <FieldLabel htmlFor="reset-email" className="text-white/90">
          {t("login.email")}
        </FieldLabel>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          required
          placeholder={t("login.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={reset.isError || undefined}
          className="h-11 rounded-[14px] border-white/40 bg-white/10 px-4 text-white placeholder:text-white/55 dark:bg-white/10"
        />
        {reset.isError && (
          <FieldError className="text-[#ff8a8a]">
            {errorMessage(reset.error, t("login.reset.error"))}
          </FieldError>
        )}
      </Field>

      <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0">
        <Button
          type="submit"
          disabled={reset.isPending || !email.trim()}
          className="h-11 rounded-pill bg-brand px-6 text-base text-white hover:bg-brand/90"
        >
          {reset.isPending && <Spinner />}
          {t("login.reset.submit")}
        </Button>
      </DialogFooter>
    </form>
  )
}
