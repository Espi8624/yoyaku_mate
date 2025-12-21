import React, { useState, useMemo } from "react";
import "./WaitingScreen.css";

function MenuDisplay({ menuList, texts }) {
  // メニュー全体の表示/非表示を管理
  const [showMenu, setShowMenu] = useState(false);
  // 展開中のカテゴリを管理（配列で複数同時展開可能）
  const [expandedCategories, setExpandedCategories] = useState([]);

  // カテゴリリストを計算
  const categories = useMemo(() => {
    return Array.isArray(menuList) ? Array.from(new Set(menuList.map(item => item.category))) : [];
  }, [menuList]);

  // カテゴリの展開/折りたたみを切り替え
  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category) // 折りたたみ
        : [...prev, category]               // 展開
    );
  };

  // メニューリストが空の場合
  if (!menuList || menuList.length === 0) {
    return null;
  }

  return (
    <div className="menu-accordion-container">
      <div className="menu-label">{texts.menu_label}</div>

      {/* メニューを見るヘッダー（アコーディオンスタイル） */}
      <div
        className="menu-category-header"
        onClick={() => setShowMenu(prev => !prev)}
      >
        <span className="menu-category-icon">
          {showMenu ? (
            <svg width="24" height="24" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 4 L6 8 L10 4 Z" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4 2 L8 6 L4 10 Z" />
            </svg>
          )}
        </span>
        <span className="menu-category-name">
          {showMenu ? texts.menu_close_label : texts.menu_overview_label}
        </span>
      </div>

      {/* カテゴリー一覧（showMenuがtrueの時のみ表示） */}
      {showMenu && categories.map((category, idx) => {
        const isExpanded = expandedCategories.includes(category);
        const categoryItems = menuList.filter(item => item.category === category);

        return (
          <div key={idx} className="menu-category-section">
            {/* カテゴリヘッダー（クリック可能） */}
            <div
              className="menu-category-header"
              onClick={() => toggleCategory(category)}
            >
              <span className="menu-category-icon">
                {isExpanded ? (
                  <svg width="24" height="24" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M2 4 L6 8 L10 4 Z" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M4 2 L8 6 L4 10 Z" />
                  </svg>
                )}
              </span>
              <span className="menu-category-name">{category}</span>
            </div>

            {/* メニューアイテムリスト（展開時のみ表示） */}
            {isExpanded && (
              <div className="menu-items-list">
                {categoryItems.map((item, itemIdx) => (
                  <div className="menu-item" key={itemIdx}>
                    <div className="menu-item-image">
                      {item.menu_image_url ? (
                        <img src={item.menu_image_url} alt={item.title} />
                      ) : (
                        <div className="menu-item-image-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.9 21.9l-8.49-8.49-9.82-9.82L2.1 2.1.69 3.51 3 5.83V19c0 1.1.9 2 2 2h13.17l2.31 2.31 1.42-1.41zM5 18l3.5-4.5 2.5 3.01L12.17 15l3 3H5zm16 .17L5.83 3H19c1.1 0 2 .9 2 2v13.17z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="menu-item-details">
                      <span className="menu-item-title">{item.title}</span>
                      {item.description && <span className="menu-item-description">{item.description}</span>}
                      <span className="menu-item-price">{item.price}円</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MenuDisplay;