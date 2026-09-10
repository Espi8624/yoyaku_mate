import LegalPageLayout from './LegalPageLayout';
import layoutStyles from './LegalPageLayout.module.css';

const SUPPORT_EMAIL = 'team.nezu@gmail.com';
const MAILTO_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  '【rusui】アカウント・データ削除リクエスト'
)}`;

// Google Play「アカウント削除」ポリシー対応:
// アプリをインストールしなくても、このページ単体でアカウント/データ削除を
// リクエストできるようにする(Data safetyフォームの削除URL欄に登録)
function DeleteAccountPage() {
  return (
    <LegalPageLayout title="アカウント・データの削除について">
      <div className={layoutStyles.body}>
        <p>「rusui」アプリのアカウントおよびデータの削除は、以下の2つの方法で行うことができます。</p>

        <h2 className={layoutStyles.sectionTitle}>方法1：アプリ内から退会する</h2>
        <p>
          アプリにログインした状態で「プロフィール」→「アカウント管理」→「退会」から手続きできます。
          退会が完了すると、ログインに用いる認証情報は速やかに完全に削除され、以後このアカウントでログインすることはできなくなります。
        </p>

        <h2 className={layoutStyles.sectionTitle}>方法2：このページから削除をリクエストする</h2>
        <p>
          アプリをインストールしていない場合や、連絡先情報を含む完全なデータ削除をご希望の場合は、下のボタンから削除リクエストをお送りください。
          ご本人確認のうえ、合理的な期間内に対応いたします。
        </p>
        <a className={layoutStyles.button} href={MAILTO_HREF}>
          削除リクエストを送る（{SUPPORT_EMAIL}）
        </a>

        <h2 className={layoutStyles.sectionTitle}>削除される情報・保管される情報</h2>
        <p>
          退会（アカウント削除）操作を行うと、ログイン用の認証情報は直ちに完全に削除されます。
          一方、氏名・電話番号・住所等の連絡先情報については、店舗からの退会後の問い合わせ対応など運営上必要な範囲で一定期間保管される場合があります。
          連絡先情報を含む完全な削除をご希望の場合は、上記の削除リクエストからお申し出ください。
        </p>
        <p>詳細はプライバシーポリシーの第6条をご確認ください。</p>
      </div>
    </LegalPageLayout>
  );
}

export default DeleteAccountPage;
