import React, { useState, useMemo } from "react";
import "./WaitingScreen.css";

function MenuDisplay({ menuList, texts }) {
  // メニューリスト制御ステータス
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // menuListが変更される時、カテゴリーリストを計算し直す
  const categories = useMemo(() => {
    return Array.isArray(menuList) ? Array.from(new Set(menuList.map(item => item.category))) : [];
  }, [menuList]);

  // カテゴリーリストを２つの列に分ける
  const splitCategories = () => {
    const mid = Math.ceil(categories.length / 2);
    return [categories.slice(0, mid), categories.slice(mid)];
  };

  // メニューリストが空いている場合、何もレンダリングしない
  if (!menuList || menuList.length === 0) {
    return null;
  }

  return (
    <>
      <div className="menu-label">
        {texts.menu_label}
      </div>
      <button className="confirmation-btn" onClick={() => setShowCategories(prev => !prev)}>
        {showCategories ? texts.menu_close_label : texts.menu_overview_label}
      </button>

      {/* カテゴリーリスト表示 */}
      {showCategories && !selectedCategory && (
        <div className="menu-list-2col">
          {splitCategories().map((col, colIdx) => (
            <div key={colIdx} className="menu-category-col">
              {col.map((cat, idx) => (
                <div 
                  className="menu-category-item" 
                  key={idx} 
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 特定カテゴリーのメニューアイテム表示 */}
      {showCategories && selectedCategory && (
        <div className="menu-items-section">
          <h2>{selectedCategory}</h2>
          <div className="menu-list-2col">
            {menuList.filter(item => item.category === selectedCategory).map((item, idx) => (
              <div className="menu-item" key={idx}>
                <span>{item.title}</span>
                <span>{item.price}円</span>
              </div>
            ))}
          </div>
          <button className="confirmation-btn" onClick={() => setSelectedCategory(null)}>
            {texts.category_overview_labe}
          </button>
        </div>
      )}
    </>
  );
}

export default MenuDisplay;