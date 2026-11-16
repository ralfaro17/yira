import { formatDistanceToNowStrict, isYesterday, parseISO, type Locale } from "date-fns"
import { enUS, es } from "date-fns/locale"

import i18n, { currentLanguage } from "@/i18n"

/** date-fns locale matching the UI language. */
export function dateLocale(): Locale {
  return currentLanguage() === "en" ? enUS : es
}

/** "hace 5 min" / "5 min ago", "Ayer" / "Yesterday" — matches the copy in the Figma frames. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return i18n.t("time.noData")
  const date = parseISO(iso)
  if (isYesterday(date)) return i18n.t("time.yesterday")
  const text = formatDistanceToNowStrict(date, { locale: dateLocale(), addSuffix: true })
  return text
    .replace(/ (minutos?|minutes?)/, " min")
    .replace(/ (horas?|hours?)/, " h")
    .replace(/ (segundos?|seconds?)/, " s")
}

/** Short weekday initials used by the mood row (L M X J V S D / M T W T F S S). */
export function weekdayInitial(isoDate: string): string {
  const day = parseISO(isoDate).getDay() // 0 = Sunday
  return i18n.t("time.weekdayInitials").split(" ")[day]
}
