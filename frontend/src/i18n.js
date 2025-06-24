import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import tr from './locales/tr.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  ja: { translation: ja },
  ko: { translation: ko },
  'zh-cn': { translation: zh },
  'zh-tw': { translation: zh },
  'zh': { translation: zh },
  ar: { translation: ar },
  hi: { translation: hi },
  tr: { translation: tr },
  nl: { translation: nl },
  pl: { translation: pl }
};

// Get language from URL parameter
const getLanguageFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('lng');
};

// Enhanced language detection with better fallbacks
const getPreferredLanguage = () => {
  // 1. Check URL parameter first
  const urlLanguage = getLanguageFromURL();
  if (urlLanguage && i18n.languages.includes(urlLanguage)) {
    return urlLanguage;
  }

  // 2. Check localStorage
  const storedLanguage = localStorage.getItem('i18nextLng');
  if (storedLanguage && i18n.languages.includes(storedLanguage)) {
    return storedLanguage;
  }

  // 3. Check browser language
  const browserLanguage = navigator.language || navigator.userLanguage;
  if (browserLanguage) {
    // Try exact match first
    if (i18n.languages.includes(browserLanguage)) {
      return browserLanguage;
    }
    
    // Try language code only (e.g., 'en' from 'en-US')
    const langCode = browserLanguage.split('-')[0];
    if (i18n.languages.includes(langCode)) {
      return langCode;
    }
    
    // Try to map common variations
    const langMap = {
      'zh-CN': 'zh-cn',
      'zh-TW': 'zh-tw',
      'zh-HK': 'zh-tw',
      'zh-SG': 'zh-cn',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'es-ES': 'es',
      'es-MX': 'es',
      'es-AR': 'es',
      'fr-FR': 'fr',
      'fr-CA': 'fr',
      'de-DE': 'de',
      'de-AT': 'de',
      'de-CH': 'de',
      'it-IT': 'it',
      'it-CH': 'it',
      'nl-NL': 'nl',
      'nl-BE': 'nl',
      'ru-RU': 'ru',
      'ru-UA': 'ru',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'ar-SA': 'ar',
      'ar-EG': 'ar',
      'hi-IN': 'hi',
      'tr-TR': 'tr',
      'pl-PL': 'pl'
    };
    
    if (langMap[browserLanguage]) {
      return langMap[browserLanguage];
    }
  }

  // 4. Default to English
  return 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: {
      'zh-cn': ['zh', 'en'],
      'zh-tw': ['zh', 'en'],
      'zh': ['zh-cn', 'en'],
      'default': ['en']
    },
    debug: false, // Disable debug mode for production

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    // Add support for pluralization
    pluralSeparator: '_',
    
    // Add support for context
    contextSeparator: '_',
    
    // Add support for nesting
    keySeparator: '.',
    
    // Add support for missing keys
    saveMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
    }
  });

// Set initial language
const initialLanguage = getPreferredLanguage();
i18n.changeLanguage(initialLanguage);

// Update HTML lang attribute and document title
const updateDocumentLanguage = (language) => {
  document.documentElement.lang = language;
  document.documentElement.setAttribute('dir', language === 'ar' || language === 'he' || language === 'fa' ? 'rtl' : 'ltr');
  
  // Update document title if available
  if (i18n.exists('app.title')) {
    document.title = i18n.t('app.title');
  }
};

// Listen for language changes
i18n.on('languageChanged', (language) => {
  updateDocumentLanguage(language);
  localStorage.setItem('i18nextLng', language);
});

// Initialize document language
updateDocumentLanguage(initialLanguage);

export default i18n; 