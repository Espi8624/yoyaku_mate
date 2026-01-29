import ja from '../i18n/ja.json';
import en from '../i18n/en.json';
import ko from '../i18n/ko.json';
import fr from '../i18n/fr.json';
import de from '../i18n/de.json';
import ru from '../i18n/ru.json';
import vi from '../i18n/vi.json';
import th from '../i18n/th.json';
import zh from '../i18n/zh.json';
import id from '../i18n/id.json';
import ar from '../i18n/ar.json';

const translations = { ja, en, ko, fr, de, ru, vi, th, zh, id, ar };

function useTranslation(languageCode) {
  // languageCode can be full "en-US" or "zh-TW", so we check startsWith for simple matching if exact match fails
  const exactMatch = translations[languageCode];
  if (exactMatch) return exactMatch;

  const shortCode = languageCode?.split('-')[0];
  const shortMatch = translations[shortCode];
  if (shortMatch) return shortMatch;

  return translations.en;
}

export default useTranslation;