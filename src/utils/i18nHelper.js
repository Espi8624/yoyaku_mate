/**
 * Helper to get translated text.
 * Tries exact match first, then falls back to short language code (e.g. 'en-US' -> 'en').
 * @param {string} defaultText - Fallback text.
 * @param {object} translations - Map of language codes to translated text.
 * @param {string} langCode - The ISO language code (e.g., 'en', 'ko').
 * @returns {string} The translated text or default text.
 */
export const getTranslatedText = (defaultText, translations, langCode) => {
    if (!translations || !langCode) return defaultText;

    // Try exact match (e.g. 'zh-TW')
    if (translations[langCode]) return translations[langCode];

    // Try short code (e.g. 'en-US' -> 'en')
    const shortCode = langCode.split('-')[0];
    if (translations[shortCode]) return translations[shortCode];

    return defaultText;
};
