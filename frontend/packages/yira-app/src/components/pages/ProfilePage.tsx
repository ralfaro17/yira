import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { useLogout, useMe, useUpdateMe } from "@/api/hooks"
import type { Me } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { PageHeading } from "@/components/yira/PageHeading"
import { ErrorState } from "@/components/yira/QueryState"
import { EditProfileDialog } from "@/components/yira/profile/EditProfileDialog"
import { PreferenceRow, PreferenceSelect, type Option } from "@/components/yira/profile/PreferenceRow"
import { CONTROL } from "@/components/yira/profile/styles"
import { cn } from "@/lib/utils"

const LANGUAGES: Option[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English (próximamente)", disabled: true },
]

const TIMEZONES: Option[] = [
  { value: "America/Managua", label: "Tierra · UTC−6" },
  { value: "UTC", label: "UTC" },
  { value: "America/Chicago", label: "Houston · UTC−6/−5" },
  { value: "Europe/Madrid", label: "Madrid · UTC+1/+2" },
]

const UNITS: Option[] = [
  { value: "metric", label: "Métrico" },
  { value: "imperial", label: "Imperial" },
]

type Prefs = Pick<Me, "language" | "timezone" | "emergency_alerts" | "daily_summary_time" | "units">

const PILL = "h-auto rounded-pill px-6 py-3 text-lg font-medium"

/** Make sure the current value is selectable even if it is not one of our presets. */
function withCurrent(options: Option[], value: string): Option[] {
  return options.some((o) => o.value === value) ? options : [...options, { value, label: value }]
}

export function ProfilePage() {
  const me = useMe()

  if (me.isPending) {
    return (
      <div className="grid gap-6 md:grid-cols-[340px_minmax(0,1fr)]">
        <Skeleton className="h-[446px] rounded-panel bg-white/15" />
        <Skeleton className="h-[446px] rounded-panel bg-white/15" />
      </div>
    )
  }
  if (me.isError) return <ErrorState onRetry={() => me.refetch()} />
  return <Profile me={me.data} />
}

function Profile({ me }: { me: Me }) {
  const navigate = useNavigate()
  const update = useUpdateMe()
  const logout = useLogout()
  const [draft, setDraft] = useState<Partial<Prefs>>({})
  const [editing, setEditing] = useState(false)

  const prefs: Prefs = { ...me, ...draft }
  const same = (k: keyof Prefs) =>
    k === "daily_summary_time" ? prefs[k].slice(0, 5) === me[k].slice(0, 5) : prefs[k] === me[k]
  const dirty = (Object.keys(draft) as (keyof Prefs)[]).some((k) => !same(k))
  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const name = me.display_name || me.username

  const save = () =>
    update.mutate(draft, {
      onSuccess: () => {
        setDraft({})
        toast.success("Preferencias guardadas")
      },
      onError: () => toast.error("No se pudieron guardar los cambios."),
    })

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => navigate("/iniciar-sesion", { replace: true }),
      onError: () => toast.error("No se pudo cerrar la sesión."),
    })

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeading title="Perfil" />

      <div className="grid items-start gap-6 md:grid-cols-[340px_minmax(0,1fr)]">
        {/* Identity card */}
        <GlassPanel className="items-center gap-4 p-[28px] text-center">
          <div className="size-[150px] overflow-hidden rounded-full border-4 border-brand bg-white/10">
            <img src={me.photo || "/yira/profile/avatar-default.png"} alt={`Foto de ${name}`} className="size-full object-cover" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-[26px] font-extrabold leading-tight">{name}</h2>
            {me.role_label && <p className="text-[15px] text-white/80">{me.role_label}</p>}
          </div>
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/15 px-4 py-1.5 text-sm font-medium">
            <span aria-hidden className="size-2 rounded-full bg-[#2fd36b]" />
            Sesión activa
          </span>
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className={cn(PILL, "mt-2 border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white")}
          >
            Editar perfil
          </Button>
        </GlassPanel>

        {/* Preferences card */}
        <GlassPanel className="p-[28px]">
          <h2 className="text-[26px] font-extrabold">Preferencias</h2>
          <div className="mt-2 flex flex-col">
            <PreferenceRow id="pref-language" label="Idioma">
              <PreferenceSelect
                id="pref-language"
                value={prefs.language}
                options={withCurrent(LANGUAGES, prefs.language)}
                onChange={(v) => set("language", v)}
              />
            </PreferenceRow>
            <PreferenceRow id="pref-timezone" label="Zona horaria">
              <PreferenceSelect
                id="pref-timezone"
                value={prefs.timezone}
                options={withCurrent(TIMEZONES, prefs.timezone)}
                onChange={(v) => set("timezone", v)}
              />
            </PreferenceRow>
            <PreferenceRow id="pref-alerts" label="Alertas de emergencia">
              <label className="flex items-center gap-3 text-[15px] text-white/85">
                {prefs.emergency_alerts ? "Activadas" : "Desactivadas"}
                <Switch
                  aria-labelledby="pref-alerts-label"
                  checked={prefs.emergency_alerts}
                  onCheckedChange={(checked) => set("emergency_alerts", checked)}
                  className="data-checked:bg-brand"
                />
              </label>
            </PreferenceRow>
            <PreferenceRow id="pref-summary" label="Resumen diario">
              <Input
                id="pref-summary"
                type="time"
                aria-labelledby="pref-summary-label"
                value={prefs.daily_summary_time.slice(0, 5)}
                onChange={(e) => e.target.value && set("daily_summary_time", e.target.value)}
                className={cn(CONTROL, "w-auto [color-scheme:dark]")}
              />
            </PreferenceRow>
            <PreferenceRow id="pref-units" label="Unidades">
              <PreferenceSelect
                id="pref-units"
                value={prefs.units}
                options={UNITS}
                onChange={(v) => set("units", v as Me["units"])}
              />
            </PreferenceRow>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={save} disabled={!dirty || update.isPending} className={cn(PILL, "bg-brand text-white hover:bg-brand/85")}>
              {update.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
              disabled={logout.isPending}
              className={cn(PILL, "border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white")}
            >
              Cerrar sesión
            </Button>
          </div>
        </GlassPanel>
      </div>

      {editing && <EditProfileDialog me={me} open={editing} onOpenChange={setEditing} />}
    </div>
  )
}
