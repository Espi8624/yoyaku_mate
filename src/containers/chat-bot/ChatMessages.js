/**
 * Helper to get the initial greeting message based on language code.
 * @param {string} lang - The language code (e.g., 'en', 'ko', 'ja').
 * @returns {string} The localized greeting message.
 */
export const getInitialGreeting = (lang) => {
    if (lang?.startsWith('ko')) return "안녕하세요! 주문이나 가게에 대해 궁금한 점이 있으시면 말씀해주세요.";
    if (lang?.startsWith('en')) return "Hello! Please let me know if you have any questions about your order or the store.";
    if (lang?.startsWith('fr')) return "Bonjour ! Si vous avez des questions sur votre commande ou le magasin, n'hésitez pas.";
    if (lang?.startsWith('de')) return "Hallo! Bitte lassen Sie es mich wissen, wenn Sie Fragen zu Ihrer Bestellung oder dem Geschäft haben.";
    if (lang?.startsWith('ru')) return "Здравствуйте! Если у вас есть вопросы по заказу или магазину, пожалуйста, дайте знать.";
    if (lang?.startsWith('vi')) return "Xin chào! Nếu bạn có câu hỏi nào về đơn hàng hoặc cửa hàng, vui lòng cho tôi biết.";
    if (lang?.startsWith('th')) return "สวัสดี! หากคุณมีคำถามเกี่ยวกับคำสั่งซื้อหรือร้านค้า โปรดแจ้งให้เราทราบ";
    if (lang?.startsWith('zh')) return "您好！如果您对订单或店铺有任何疑问，请随时告诉我。";
    return "こんにちは！ご注文やお店についてご質問があればお答えします。";
};

/**
 * Helper to get error messages based on type and language.
 * @param {string} type - Error type ('429' or 'general').
 * @param {string} lang - The language code.
 * @returns {string} The localized error message.
 */
export const getErrorMessage = (type, lang) => {
    if (type === '429') {
        if (lang?.startsWith('ko')) return "죄송합니다. 현재 접속량이 많아 응답할 수 없습니다. 잠시 후 다시 시도해주세요.";
        if (lang?.startsWith('en')) return "Sorry, we are experiencing high traffic. Please try again later.";
        if (lang?.startsWith('fr')) return "Désolé, nous connaissons un fort trafic. Veuillez réessayer plus tard.";
        if (lang?.startsWith('de')) return "Entschuldigung, wir haben gerade viel Verkehr. Bitte versuchen Sie es später noch einmal.";
        if (lang?.startsWith('ru')) return "Извините, сейчас высокая нагрузка. Пожалуйста, попробуйте позже.";
        if (lang?.startsWith('vi')) return "Xin lỗi, hiện tại đang có quá nhiều truy cập. Vui lòng thử lại sau.";
        if (lang?.startsWith('th')) return "ขออภัย ขณะนี้มีการใช้งานหนาแน่น กรุณาลองใหม่ในภายหลัง";
        if (lang?.startsWith('zh')) return "抱歉，目前访问量较大，无法响应。请稍后再试。";
        return "申し訳ありません。現在アクセスが集中しており応答できません。しばらく待ってから再度お試しください。";
    }
    // General error
    if (lang?.startsWith('ko')) return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    if (lang?.startsWith('en')) return "An error occurred. Please try again later.";
    if (lang?.startsWith('fr')) return "Une erreur s'est produite. Veuillez réessayer plus tard.";
    if (lang?.startsWith('de')) return "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später noch einmal.";
    if (lang?.startsWith('ru')) return "Произошла ошибка. Пожалуйста, попробуйте позже.";
    if (lang?.startsWith('vi')) return "Đã xảy ra lỗi. Vui lòng thử lại sau.";
    if (lang?.startsWith('th')) return "เกิดข้อผิดพลาด กรุณาลองใหม่ในภายหลัง";
    if (lang?.startsWith('zh')) return "发生错误，请稍后再试。";
    return "現在AI応答サービスを利用できません。";
};
