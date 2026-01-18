import React from "react";
import "../ErrorScreen.css"; // Reuse existing styles if applicable, or create new structure

const CancelledScreen = ({ reason }) => {
    // 理由に応じたテキスト定義
    const content = {
        user: {
            title: "キャンセルされました",
            body: "ご利用ありがとうございました。再度ご利用の場合は、もう一度QRコードをスキャンしてください。",
        },
        store: {
            title: "キャンセルされました",
            body: "大変申し訳ございません。店舗の都合によりキャンセルされました。スタッフまでお問い合わせください。",
        },
        absence: {
            title: "キャンセルされました",
            body: "お呼び出しいたしましたが、ご不在のためキャンセルされました。再度お待ちになる場合は、もう一度QRコードをスキャンしてください。",
        },
    };

    // デフォルトのみユーザー都合にしておく（あるいはエラー表示）
    const info = content[reason] || content.user;

    return (
        <div className="waiting-section success-section">
            {/* 
         Icon/Illustration placeholder 
         既存のCancellationCompleteViewに倣い、必要であればsvg等を追加 
         一旦はテキスト中心で実装
      */}
            <h2>{info.title}</h2>
            <p>{info.body}</p>
        </div>
    );
};

export default CancelledScreen;
