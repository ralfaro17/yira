import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { useLogout, useMe, useUpdateMe } from "@/api/hooks"
import type { Me } from "@/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { LanguageSwitch } from "@/components/yira/LanguageSwitch"
import { PageHeading } from "@/components/yira/PageHeading"
import { ErrorState } from "@/components/yira/QueryState"
import { EditProfileDialog } from "@/components/yira/profile/EditProfileDialog"
import { PreferenceRow, PreferenceSelect, type Option } from "@/components/yira/profile/PreferenceRow"
import { CONTROL } from "@/components/yira/profile/styles"
import i18n from "@/i18n"
import { cn } from "@/lib/utils"

const timezones = (): Option[] => [
  { value: "America/Managua", label: i18n.t("profile.timezones.earth") },
  { value: "UTC", label: i18n.t("profile.timezones.utc") },
  { value: "America/Chicago", label: i18n.t("profile.timezones.houston") },
  { value: "Europe/Madrid", label: i18n.t("profile.timezones.madrid") },
]

const units = (): Option[] => [
  { value: "metric", label: i18n.t("profile.unitOptions.metric") },
  { value: "imperial", label: i18n.t("profile.unitOptions.imperial") },
]

/** Seeded `role_label` default (backend); shown translated while the user hasn't changed it. */
const DEFAULT_ROLE_LABEL = "Centro de control · Tierra"

/** The language is not part of the draft: the LanguageSwitch saves it immediately. */
type Prefs = Pick<Me, "timezone" | "emergency_alerts" | "daily_summary_time" | "units">

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
  const { t } = useTranslation()
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
        toast.success(t("profile.saved"))
      },
      onError: () => toast.error(t("profile.saveError")),
    })

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => navigate("/iniciar-sesion", { replace: true }),
      onError: () => toast.error(t("profile.signOutError")),
    })

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeading title={t("profile.title")} />

      <div className="grid items-start gap-6 md:grid-cols-[340px_minmax(0,1fr)]">
        {/* Identity card */}
        <GlassPanel className="items-center gap-4 p-[28px] text-center">
          <div className="size-[150px] overflow-hidden rounded-full border-4 border-brand bg-white/10">
            <img src={me.photo || "/yira/profile/avatar-default.png"} alt={t("profile.photoAlt", { name })} className="size-full object-cover" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-[26px] font-extrabold leading-tight">{name}</h2>
            {me.role_label && (
              <p className="text-[15px] text-white/80">
                {me.role_label === DEFAULT_ROLE_LABEL ? t("profile.defaultRole") : me.role_label}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/15 px-4 py-1.5 text-sm font-medium">
            <span aria-hidden className="size-2 rounded-full bg-[#2fd36b]" />
            {t("profile.activeSession")}
          </span>
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className={cn(PILL, "mt-2 border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white")}
          >
            {t("profile.edit")}
          </Button>
        </GlassPanel>

        {/* Preferences card */}
        <GlassPanel className="p-[28px]">
          <h2 className="text-[26px] font-extrabold">{t("profile.preferences")}</h2>
          <div className="mt-2 flex flex-col">
            <PreferenceRow id="pref-language" label={t("profile.language")}>
              <LanguageSwitch />
            </PreferenceRow>
            <PreferenceRow id="pref-timezone" label={t("profile.timezone")}>
              <PreferenceSelect
                id="pref-timezone"
                value={prefs.timezone}
                options={withCurrent(timezones(), prefs.timezone)}
                onChange={(v) => set("timezone", v)}
              />
            </PreferenceRow>
            <PreferenceRow id="pref-alerts" label={t("profile.emergencyAlerts")}>
              <label className="flex items-center gap-3 text-[15px] text-white/85">
                {prefs.emergency_alerts ? t("profile.enabled") : t("profile.disabled")}
                <Switch
                  aria-labelledby="pref-alerts-label"
                  checked={prefs.emergency_alerts}
                  onCheckedChange={(checked) => set("emergency_alerts", checked)}
                  className="data-checked:bg-brand"
                />
              </label>
            </PreferenceRow>
            <PreferenceRow id="pref-summary" label={t("profile.dailySummary")}>
              <Input
                id="pref-summary"
                type="time"
                aria-labelledby="pref-summary-label"
                value={prefs.daily_summary_time.slice(0, 5)}
                onChange={(e) => e.target.value && set("daily_summary_time", e.target.value)}
                className={cn(CONTROL, "w-auto [color-scheme:dark]")}
              />
            </PreferenceRow>
            <PreferenceRow id="pref-units" label={t("profile.units")}>
              <PreferenceSelect
                id="pref-units"
                value={prefs.units}
                options={units()}
                onChange={(v) => set("units", v as Me["units"])}
              />
            </PreferenceRow>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={save} disabled={!dirty || update.isPending} className={cn(PILL, "bg-brand text-white hover:bg-brand/85")}>
              {update.isPending ? t("profile.saving") : t("profile.save")}
            </Button>
            <Button
              variant="outline"
              onClick={signOut}
              disabled={logout.isPending}
              className={cn(PILL, "border-2 border-white bg-transparent text-white hover:bg-white/10 hover:text-white")}
            >
              {t("profile.signOut")}
            </Button>
          </div>
        </GlassPanel>
      </div>

      {editing && <EditProfileDialog me={me} open={editing} onOpenChange={setEditing} />}
    </div>
  )
}
