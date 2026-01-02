import { register, init, getLocaleFromNavigator, locale as localeStore, _ } from 'svelte-i18n';

// Register locales
register('en', () => import('./locales/en.json'));
register('es-ES', () => import('./locales/es-ES.json'));

// Supported locales
export const supportedLocales = ['en', 'es-ES'];

/**
 * Initialize i18n with browser locale detection
 */
export function setupI18n() {
  init({
    fallbackLocale: 'en',
    initialLocale: getLocaleFromNavigator(),
  });
}

/**
 * Set the current locale
 */
export function setLocale(locale: string) {
  localeStore.set(locale);
}

/**
 * Get the current locale
 */
export function getLocale(): string {
  let currentLocale = 'en';
  const unsubscribe = localeStore.subscribe(value => {
    if (value) currentLocale = value;
  });
  unsubscribe();
  return currentLocale;
}

/**
 * Export the translation function and locale store
 */
export { _, localeStore };

/**
 * Helper function to get locale display name
 */
export function getLocaleName(locale: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'es-ES': 'Español'
  };
  return names[locale] || locale;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): string[] {
  return supportedLocales;
}
