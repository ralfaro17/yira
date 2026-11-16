import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useUpdateMe } from "@/api/hooks"
import type { Me } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** "Editar perfil": display name + role label. Mount it only while open so it starts from `me`. */
export function EditProfileDialog({ me, open, onOpenChange }: { me: Me; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const update = useUpdateMe()
  const [displayName, setDisplayName] = useState(me.display_name)
  const [roleLabel, setRoleLabel] = useState(me.role_label)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    update.mutate(
      { display_name: displayName.trim(), role_label: roleLabel.trim() },
      {
        onSuccess: () => {
          toast.success(t("profile.editDialog.updated"))
          onOpenChange(false)
        },
        onError: () => toast.error(t("profile.editDialog.error")),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("profile.editDialog.title")}</DialogTitle>
            <DialogDescription>{t("profile.editDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="profile-display-name">{t("profile.editDialog.displayName")}</Label>
            <Input
              id="profile-display-name"
              value={displayName}
              placeholder={me.username}
              maxLength={120}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-role">{t("profile.editDialog.role")}</Label>
            <Input id="profile-role" value={roleLabel} maxLength={120} onChange={(e) => setRoleLabel(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("profile.editDialog.cancel")}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? t("profile.editDialog.saving") : t("profile.editDialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
