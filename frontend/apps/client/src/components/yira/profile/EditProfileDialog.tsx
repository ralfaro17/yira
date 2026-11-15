import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { useUpdateMe } from "@/api/hooks"
import type { Me } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/** "Editar perfil": display name + role label. Mount it only while open so it starts from `me`. */
export function EditProfileDialog({ me, open, onOpenChange }: { me: Me; open: boolean; onOpenChange: (open: boolean) => void }) {
  const update = useUpdateMe()
  const [displayName, setDisplayName] = useState(me.display_name)
  const [roleLabel, setRoleLabel] = useState(me.role_label)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    update.mutate(
      { display_name: displayName.trim(), role_label: roleLabel.trim() },
      {
        onSuccess: () => {
          toast.success("Perfil actualizado")
          onOpenChange(false)
        },
        onError: () => toast.error("No se pudo actualizar el perfil."),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Así te verá el resto del centro de control.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="profile-display-name">Nombre visible</Label>
            <Input
              id="profile-display-name"
              value={displayName}
              placeholder={me.username}
              maxLength={120}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-role">Rol</Label>
            <Input id="profile-role" value={roleLabel} maxLength={120} onChange={(e) => setRoleLabel(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
