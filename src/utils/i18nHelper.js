/**
 * 翻訳済みテキストを取得するヘルパー。
 * 完全一致 → 短縮言語コード一致(例: 'en-US' -> 'en') → 英語 → 元テキスト(日本語)の順でフォールバックする。
 * 英語を元テキストより先に試すのは、店舗側(yoyaku_mate_provider)の翻訳機能が
 * 英語(TranslationService.defaultLanguages)だけは常に生成する一方、
 * それ以外の言語(店舗が選択制で有効化する言語、あるいはタイ語/ベトナム語/
 * ポルトガル語/インドネシア語のようにそもそも翻訳対象外の言語)は翻訳が
 * 存在しないケースがあり、その場合は外国人顧客にとって日本語より英語の方が
 * 読める可能性が高いため
 * @param {string} defaultText - 最終フォールバック(元テキスト)。
 * @param {object} translations - 言語コード→翻訳済みテキストのマップ。
 * @param {string} langCode - ISO言語コード (例: 'en', 'ko')。
 * @returns {string} 翻訳済みテキスト、英語フォールバック、または元テキスト。
 */
export const getTranslatedText = (defaultText, translations, langCode) => {
    if (!translations) return defaultText;

    // 完全一致 (例: 'zh-TW')
    if (langCode && translations[langCode]) return translations[langCode];

    // 短縮コード一致 (例: 'en-US' -> 'en')
    const shortCode = langCode?.split('-')[0];
    if (shortCode && translations[shortCode]) return translations[shortCode];

    // 顧客の言語に一致する翻訳が無い場合、元テキスト(日本語)より英語を優先する
    if (translations.en) return translations.en;

    return defaultText;
};
