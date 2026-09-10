import styles from './LegalPageLayout.module.css';

// プライバシーポリシー・利用規約・退会/データ削除案内など、
// アプリ未インストールでもブラウザから直接閲覧できる静的ページ共通レイアウト
function LegalPageLayout({ title, children }) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default LegalPageLayout;
