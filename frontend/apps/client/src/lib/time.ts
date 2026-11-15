import { formatDistanceToNowStrict, isYesterday, parseISO } from "date-fns"
import { es } from "date-fns/locale"

/** "hace 5 min", "hace 3 h", "Ayer" — matches the copy in the Figma frames. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "sin datos"
  const date = parseISO(iso)
  if (isYesterday(date)) return "Ayer"
  const text = formatDistanceToNowStrict(date, { locale: es, addSuffix: true })
  return text
    .replace(/ minutos?/, " min")
    .replace(/ horas?/, " h")
    .replace(/ segundos?/, " s")
}

/** Short weekday initials used by the mood row (L M X J V S D). */
export function weekdayInitial(isoDate: string): string {
  const day = parseISO(isoDate).getDay() // 0 = Sunday
  return ["D", "L", "M", "X", "J", "V", "S"][day]
}
