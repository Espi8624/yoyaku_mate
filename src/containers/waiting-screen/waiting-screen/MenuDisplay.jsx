import React, { useState, useMemo } from "react";
import "./WaitingScreen.css";

function MenuDisplay({ menuList, texts }) {
  // メニュー全体の表示/非表示を管理
  const [showMenu, setShowMenu] = useState(false);
  // 選択中のカテゴリを管理
  const [activeCategory, setActiveCategory] = useState(null);

  // 展開中のメニュー詳細アイテム
  const [expandedItem, setExpandedItem] = useState(null);

  // カテゴリリストを計算
  const categories = useMemo(() => {
    return Array.isArray(menuList) ? Array.from(new Set(menuList.map(item => item.category))) : [];
  }, [menuList]);

  // 初期カテゴリ設定
  React.useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // メニューリストが空の場合
  if (!menuList || menuList.length === 0) {
    return null;
  }

  // 表示するアイテムをフィルタリング
  const displayedItems = activeCategory
    ? menuList.filter(item => item.category === activeCategory)
    : [];

  const handleCloseModal = (e) => {
    e.stopPropagation();
    setExpandedItem(null);
  };

  return (
    <div className="menu-container">
      <div className="menu-label">{texts.menu_label}</div>

      {/* メニューを見るヘッダー */}
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

      {/* カテゴリータブとアイテム一覧（showMenuがtrueの時のみ表示） */}
      {showMenu && (
        <div className="menu-content">
          {/* カテゴリタブ（横スクロール） */}
          <div className="menu-category-tabs">
            {categories.map((category) => (
              <button
                key={category}
                className={`menu-category-tab ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* アイテムリスト (2カラム) */}
          <div className="menu-items-list">
            {displayedItems.map((item, itemIdx) => (
              <div
                className="menu-item"
                key={itemIdx}
                onClick={() => setExpandedItem(item)}
              >
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
                  <span className="menu-item-price">{Number(item.price).toLocaleString()}円</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {expandedItem && (
        <div className="menu-detail-overlay" onClick={handleCloseModal}>
          <div className="menu-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="menu-detail-close-btn" onClick={handleCloseModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>

            <div className="menu-detail-image-container">
              {expandedItem.menu_image_url ? (
                <img src={expandedItem.menu_image_url} alt={expandedItem.title} />
              ) : (
                <div className="menu-item-image-placeholder" style={{ flexDirection: 'column', gap: '8px' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="#999">
                    <path d="M21.9 21.9l-8.49-8.49-9.82-9.82L2.1 2.1.69 3.51 3 5.83V19c0 1.1.9 2 2 2h13.17l2.31 2.31 1.42-1.41zM5 18l3.5-4.5 2.5 3.01L12.17 15l3 3H5zm16 .17L5.83 3H19c1.1 0 2 .9 2 2v13.17z" />
                  </svg>
                  <span style={{ color: '#999', fontSize: '0.9em' }}>No Image</span>
                </div>
              )}
            </div>

            <div className="menu-detail-content">
              <div className="menu-detail-title">{expandedItem.title}</div>
              <div className="menu-detail-price">{Number(expandedItem.price).toLocaleString()}円</div>
              {expandedItem.description && (
                <div className="menu-detail-description">{expandedItem.description}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuDisplay;