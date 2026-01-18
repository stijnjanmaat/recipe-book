import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './locales/en.json'
import nlTranslations from './locales/nl.json'

// Initialize i18n - language will be set via changeLanguage() after detection
// This ensures SSR/client consistency
// Store the init promise so we can await it if needed
export const i18nInitPromise = i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      nl: {
        translation: nlTranslations,
      },
    },
    lng: 'en', // Default, will be overridden by detected language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

// Export a function to ensure i18n is initialized
export async function ensureI18nInitialized() {
  if (!i18n.isInitialized) {
    await i18nInitPromise
  }
  return i18n
}

export default i18n
