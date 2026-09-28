import LegalPageLayout from './LegalPageLayout';
import layoutStyles from './LegalPageLayout.module.css';
import { PRIVACY_POLICY_TITLE, PRIVACY_POLICY_CONTENT } from '../../constants/privacyPolicy';

// App Store Connect / Google Play Console の「プライバシーポリシーURL」欄に
// 登録する、アプリ未インストールでも閲覧可能な公開ページ
function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title={PRIVACY_POLICY_TITLE}>
      <p className={layoutStyles.body}>{PRIVACY_POLICY_CONTENT}</p>
    </LegalPageLayout>
  );
}

export default PrivacyPolicyPage;
