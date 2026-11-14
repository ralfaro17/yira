import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { es } from './locales/es';
import { en } from './locales/en';

export const defaultNS = 'translation';
export const resources = {
  es: {
    translation: es,
  },
  en: {
    translation: en,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    defaultNS,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'taguer_lang',
      caches: ['localStorage'],
    },
  });

// Keep HTML lang attribute in sync with current language
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.resolvedLanguage || i18n.language || 'es';
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;

