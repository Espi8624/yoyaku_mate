import LegalPageLayout from './LegalPageLayout';
import layoutStyles from './LegalPageLayout.module.css';
import { TERMS_OF_SERVICE_TITLE, TERMS_OF_SERVICE_CONTENT } from '../../constants/termsOfService';

function TermsOfServicePage() {
  return (
    <LegalPageLayout title={TERMS_OF_SERVICE_TITLE}>
      <p className={layoutStyles.body}>{TERMS_OF_SERVICE_CONTENT}</p>
    </LegalPageLayout>
  );
}

export default TermsOfServicePage;
