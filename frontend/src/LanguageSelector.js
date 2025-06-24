import React from 'react';
import './LanguageSelector.css';

const LanguageSelector = ({ selectedLanguage, onLanguageChange, label, isRTL = false }) => {
  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh-cn', name: 'Chinese (Simplified)', native: '中文 (简体)' },
    { code: 'zh-tw', name: 'Chinese (Traditional)', native: '中文 (繁體)' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'sv', name: 'Swedish', native: 'Svenska' },
    { code: 'da', name: 'Danish', native: 'Dansk' },
    { code: 'no', name: 'Norwegian', native: 'Norsk' },
    { code: 'fi', name: 'Finnish', native: 'Suomi' },
    { code: 'cs', name: 'Czech', native: 'Čeština' },
    { code: 'sk', name: 'Slovak', native: 'Slovenčina' },
    { code: 'hu', name: 'Hungarian', native: 'Magyar' },
    { code: 'ro', name: 'Romanian', native: 'Română' },
    { code: 'bg', name: 'Bulgarian', native: 'Български' },
    { code: 'el', name: 'Greek', native: 'Ελληνικά' },
    { code: 'he', name: 'Hebrew', native: 'עברית' },
    { code: 'th', name: 'Thai', native: 'ไทย' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
    { code: 'uk', name: 'Ukrainian', native: 'Українська' },
    { code: 'fa', name: 'Persian', native: 'فارسی' },
    { code: 'sr', name: 'Serbian', native: 'Српски' },
    { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
    { code: 'sl', name: 'Slovenian', native: 'Slovenščina' },
    { code: 'et', name: 'Estonian', native: 'Eesti' },
    { code: 'lv', name: 'Latvian', native: 'Latviešu' },
    { code: 'lt', name: 'Lithuanian', native: 'Lietuvių' }
  ];

  const handleLanguageChange = (e) => {
    onLanguageChange(e.target.value);
  };

  return (
    <div className={`language-selector ${isRTL ? 'rtl' : 'ltr'}`}>
      <label htmlFor="language-select">{label}</label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={handleLanguageChange}
        className="language-select"
        dir="auto"
      >
        {languages.map(language => (
          <option key={language.code} value={language.code}>
            {language.native} ({language.name})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector; 