import { useEffect, useId, useRef } from "react"
import { useTranslation } from "react-i18next"

import { useMe, useSession, useUpdateMe } from "@/api/hooks"
import { Switch } from "@/components/ui/switch"
import { currentLanguage, setLanguage, storedLanguage, type Language } from "@/i18n"
import { cn } from "@/lib/utils"

/** ES ⇄ EN toggle. Signed-in users also get the choice saved to their profile. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { t } = useTranslation()
  const session = useSession()
  const update = useUpdateMe()
  const id = useId()
  const lang = currentLanguage()

  const change = (next: Language) => {
    void setLanguage(next)
    if (session.data) update.mutate({ language: next })
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm font-bold text-white", className)}>
      <span aria-hidden className={cn("transition-opacity", lang === "es" ? "opacity-100" : "opacity-50")}>
        ES
      </span>
      <Switch
        id={id}
        checked={lang === "en"}
        onCheckedChange={(checked) => change(checked ? "en" : "es")}
        aria-label={t("common.language.switch")}
        className="data-checked:bg-brand data-unchecked:bg-white/30 dark:data-unchecked:bg-white/30"
      />
      <span aria-hidden className={cn("transition-opacity", lang === "en" ? "opacity-100" : "opacity-50")}>
        EN
      </span>
    </div>
  )
}

/**
 * Keeps the UI language and the profile's `language` in sync once per session:
 * an explicit choice on this device wins (and is saved to the profile); otherwise the
 * profile's language is applied.
 */
export function LanguageSync() {
  const session = useSession()
  return session.data ? <ProfileLanguageSync /> : null
}

function ProfileLanguageSync() {
  const me = useMe()
  const update = useUpdateMe()
  const done = useRef(false)
  const serverLanguage = me.data?.language

  useEffect(() => {
    if (done.current || !serverLanguage) return
    done.current = true
    const local = storedLanguage()
    if (local && local !== serverLanguage) update.mutate({ language: local })
    else if (!local && (serverLanguage === "es" || serverLanguage === "en") && serverLanguage !== currentLanguage())
      void setLanguage(serverLanguage)
  }, [serverLanguage, update])

  return null
}
