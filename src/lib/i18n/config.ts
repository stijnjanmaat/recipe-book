import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import nlTranslations from "./locales/nl.json";

// Helper to detect locale from URL path
export function detectLocaleFromPath(pathname: string): string {
  const pathSegments = pathname.split("/").filter(Boolean);
  if (pathSegments[0] === "nl") {
    return "nl";
  } else if (pathSegments[0] === "en") {
    return "en";
  }
  return "en"; // default
}

// Detect locale synchronously from window.location (client-side only)
// On server, we'll set it in beforeLoad/loader
let initialLocale = "en";
if (typeof window !== "undefined") {
  // On client, detect from current URL immediately
  // This ensures the locale matches what was SSR'd
  initialLocale = detectLocaleFromPath(window.location.pathname);
}

// Initialize i18n with detected locale
// This ensures SSR/client consistency - the locale detected here should match
// what was used during SSR (which also reads from the URL)
export const i18nInitPromise = i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    nl: {
      translation: nlTranslations,
    },
  },
  lng: initialLocale, // Use detected locale on client, 'en' on server
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  // Disable language detection to prevent automatic changes
  detection: {
    order: [],
    caches: [],
  },
});

// Export a function to ensure i18n is initialized and set to correct locale
// This MUST be called in beforeLoad/loader before any components render
export async function ensureI18nInitialized(locale: string) {
  // Wait for initialization to complete
  await i18nInitPromise;

  // CRITICAL: Set locale synchronously to prevent hydration mismatch
  // We set it directly on the language property first, then call changeLanguage
  // This ensures the locale is correct immediately, even if changeLanguage is async
  if (i18n.language !== locale) {
    // Set synchronously - this prevents hydration mismatch
    i18n.language = locale;

    // Also update the internal state synchronously
    if (i18n.store) {
      i18n.store.data = i18n.store.data || {};
    }

    // Then trigger async update (this will update resources if needed)
    await i18n.changeLanguage(locale);
  }

  return i18n;
}

export default i18n;
