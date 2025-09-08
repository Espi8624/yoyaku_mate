import ja from '../i18n/ja.json';
import en from '../i18n/en.json';
import ko from '../i18n/ko.json';

const translations = { ja, en, ko };

function useTranslation(languageCode) {
  return translations[languageCode] || translations.en;
}

export default useTranslation;