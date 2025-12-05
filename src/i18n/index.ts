/**
 * Internationalization (i18n) module for CSS Editor
 * Provides translation support for UI text and CSS property names
 */

import enTranslations from './locales/en.json';
import esESTranslations from './locales/es-ES.json';

export type Locale = 'en' | 'es-ES';

export interface Translations {
  localeName: string;
  ui: {
    panel: {
      title: string;
      close: string;
      selector: string;
      selectorMatchCount: string;
      selectorInvalid: string;
      addProperty: string;
      saveCSS: string;
      loadCSS: string;
      exportCSS: string;
      clearChanges: string;
      generatedCSS: string;
      noStyles: string;
      anchorPosition: string;
      anchorRight: string;
      anchorLeft: string;
      anchorTop: string;
      anchorBottom: string;
      language: string;
    };
    propertySelector: {
      title: string;
      search: string;
      cancel: string;
      allAdded: string;
    };
    spacing: {
      expandToSides: string;
      collapseToGeneral: string;
    };
    messages: {
      cssSaved: string;
      cssLoaded: string;
      cssCopied: string;
      failedSave: string;
      errorSave: string;
      failedCopy: string;
      confirmClear: string;
      copyManually: string;
    };
    inputs: {
      selectOption: string;
      customValue: string;
      enterValue: string;
      enterCustomValue: string;
      pickColor: string;
      adjustValue: string;
      remove: string;
    };
    filters: {
      none: string;
      blur: string;
      grayscale: string;
      sepia: string;
      brightness: string;
      contrast: string;
      saturate: string;
      invert: string;
      hueRotate: string;
      custom: string;
    };
  };
  properties: Record<string, string>;
  propertyGroups: Record<string, string>;
}

/**
 * Available translations
 */
const translations: Record<Locale, Translations> = {
  'en': enTranslations as Translations,
  'es-ES': esESTranslations as Translations
};

/**
 * Current active locale
 */
let currentLocale: Locale = 'en';

/**
 * Detect browser locale and return a supported locale
 * Falls back to 'en' if browser locale is not supported
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  // Get browser language preference
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  if (!browserLang) {
    return 'en';
  }

  // Check for exact match first (e.g., 'es-ES')
  if (browserLang in translations) {
    return browserLang as Locale;
  }

  // Check for language without region (e.g., 'es' should match 'es-ES')
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Map language codes to supported locales
  const languageMap: Record<string, Locale> = {
    'es': 'es-ES',
    'en': 'en'
  };

  return languageMap[langCode] || 'en';
}

/**
 * Initialize locale (call this on module load to auto-detect)
 */
currentLocale = detectBrowserLocale();

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  if (translations[locale]) {
    currentLocale = locale;
  } else {
    console.warn(`Locale "${locale}" not found, falling back to "en"`);
    currentLocale = 'en';
  }
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get current translations
 */
export function getTranslations(): Translations {
  return translations[currentLocale];
}

/**
 * Translate a key with optional interpolation
 * Supports nested keys using dot notation (e.g., 'ui.panel.title')
 * and simple variable interpolation (e.g., '{count}')
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[currentLocale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key "${key}" not found for locale "${currentLocale}"`);
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation key "${key}" does not resolve to a string`);
    return key;
  }
  
  // Simple variable interpolation
  if (vars) {
    return value.replace(/\{(\w+)\}/g, (match, varName) => {
      return varName in vars ? String(vars[varName]) : match;
    });
  }
  
  return value;
}

/**
 * Get translated property name
 */
export function translateProperty(property: string): string {
  const trans = translations[currentLocale];
  return trans.properties[property] || property;
}

/**
 * Get translated property group name
 */
export function translatePropertyGroup(groupName: string): string {
  const trans = translations[currentLocale];
  return trans.propertyGroups[groupName] || groupName;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * Get the display name for a locale
 */
export function getLocaleName(locale: Locale): string {
  const trans = translations[locale];
  return trans?.localeName || locale;
}
