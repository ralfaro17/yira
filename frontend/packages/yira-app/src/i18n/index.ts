import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import en from "./locales/en"
import es from "./locales/es"

export const LANGUAGES = ["es", "en"] as const
export type Language = (typeof LANGUAGES)[number]

/** Set only when the user explicitly picks a language with the switch. */
export const LANGUAGE_STORAGE_KEY = "yira-lang"

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    supportedLngs: LANGUAGES,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "es",
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: [], // only an explicit choice is persisted (see setLanguage)
    },
  })

function syncDocument(lng: string) {
  if (typeof document !== "undefined") document.documentElement.lang = lng
}
syncDocument(currentLanguage())
i18n.on("languageChanged", syncDocument)

/** Active UI language, normalised to one of `LANGUAGES`. */
export function currentLanguage(): Language {
  return i18n.resolvedLanguage === "en" ? "en" : "es"
}

/** Language the user explicitly chose on this device, if any. */
export function storedLanguage(): Language | null {
  try {
    const value = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return value === "es" || value === "en" ? value : null
  } catch {
    return null
  }
}

/** Switch the UI language and remember the choice on this device. */
export function setLanguage(lng: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
  } catch {
    // storage unavailable (private mode): the choice lasts for this session only
  }
  return i18n.changeLanguage(lng)
}

/**
 * Map of keys whose values are translated on every read, so lookup tables such as
 * `STATUS[...].label` stay in the current language without changing their call sites.
 */
export function translatedMap<K extends string>(keys: Record<K, () => string>): Record<K, string> {
  const out = {} as Record<K, string>
  for (const key of Object.keys(keys) as K[]) {
    Object.defineProperty(out, key, { get: keys[key], enumerable: true })
  }
  return out
}

export default i18n
