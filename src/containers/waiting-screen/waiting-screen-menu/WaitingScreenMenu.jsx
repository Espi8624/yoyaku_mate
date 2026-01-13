import React, { useEffect, useState } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getMenuList } from "../../../api/waitingService";
import "./WaitingScreenMenu.css";

function WaitingScreenMenu() {
    const {
        storeId,
        selectedMenus,
        setSelectedMenus,
        goToNextStep,
        goToPrevStep,
        selectedLanguageCode,
    } = useWaitingScreen();

    const [menuList, setMenuList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const t = useTranslation(selectedLanguageCode);
    // 言語設定に基づいて翻訳データを取得
    // メニュー画面用の翻訳キーがない場合のフォールバック（将来的に翻訳ファイルに追加推奨）
    const menuText = t.waiting_screen_menu || {
        title: "メニュー選択",
        skip: "スキップ",
        confirm: "次へ",
        no_menus: "現在注文可能なメニューがありません"
    };

    useEffect(() => {
        const fetchMenus = async () => {
            setIsLoading(true);
            try {
                const menus = await getMenuList(storeId);
                console.log("Fetched Menus:", menus);

                // --- DEBUG: フィルタリングを一時無効化し、データを確認 ---
                if (menus.length > 0) {
                    // 最初のアイテムの構造をアラートで確認（実機デバッグ用）
                    // alert("First Menu: " + JSON.stringify(menus[0]));
                }
                setMenuList(menus);

                /* 
                // ステータスがactiveかつ事予約可能(pre-order available)なメニューのみフィルタリング
                const availableMenus = menus.filter(
                    (m) => m.menu_status === "active" && m.is_pre_order_available
                );
                console.log("Available Menus:", availableMenus); 
                setMenuList(availableMenus);
                */
            } catch (error) {
                console.error("Failed to fetch menus", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (storeId) {
            fetchMenus();
        }
    }, [storeId]);

    // 数量変更ハンドラ
    const handleQuantityChange = (menu, delta) => {
        setSelectedMenus((prev) => {
            const existingIndex = prev.findIndex((item) => item.menuId === menu.menu_id);
            const currentQuantity = existingIndex >= 0 ? prev[existingIndex].quantity : 0;
            const newQuantity = Math.max(0, currentQuantity + delta);

            if (newQuantity === 0) {
                // 数量が0になった場合はリストから削除
                return prev.filter((item) => item.menuId !== menu.menu_id);
            } else {
                if (existingIndex >= 0) {
                    // 既存アイテムの更新
                    const newMenus = [...prev];
                    newMenus[existingIndex] = { ...newMenus[existingIndex], quantity: newQuantity };
                    return newMenus;
                } else {
                    // 新規アイテム追加
                    return [
                        ...prev,
                        {
                            menuId: menu.menu_id,
                            name: menu.title,
                            price: menu.price,
                            quantity: newQuantity,
                            imageUrl: menu.image_url,
                        },
                    ];
                }
            }
        });
    };

    const getQuantity = (menuId) => {
        const item = selectedMenus.find((m) => m.menuId === menuId);
        return item ? item.quantity : 0;
    };

    return (
        <div className="waiting-section">
            <div className="preview-label">{menuText.title}</div>

            {isLoading ? (
                <div className="menu-loading">Loading...</div>
            ) : menuList.length === 0 ? (
                <div className="menu-empty">{menuText.no_menus}</div>
            ) : (
                <div className="menu-selection-container">
                    <div className="menu-list">
                        {menuList.map((menu) => (
                            <div key={menu.menu_id} className="menu-item-card">
                                {menu.image_url ? (
                                    <img src={menu.image_url} alt={menu.title} className="menu-item-image" />
                                ) : (
                                    <div className="menu-item-placeholder">No Image</div>
                                )}
                                <div className="menu-item-details">
                                    <div className="menu-item-title">{menu.title}</div>
                                    <div style={{ fontSize: '10px', color: 'red' }}>
                                        Status: {menu.menu_status}, PreOrder: {String(menu.is_pre_order_available)}
                                    </div>
                                    <div className="menu-item-price">¥{menu.price.toLocaleString()}</div>
                                    <div className="menu-item-quantity-control">
                                        <button
                                            className="quantity-btn"
                                            onClick={() => handleQuantityChange(menu, -1)}
                                            disabled={getQuantity(menu.menu_id) === 0}
                                        >
                                            -
                                        </button>
                                        <span className="quantity-value">{getQuantity(menu.menu_id)}</span>
                                        <button
                                            className="quantity-btn"
                                            onClick={() => handleQuantityChange(menu, 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="menu-actions">
                <button type="button" className="confirmation-btn secondary" onClick={goToPrevStep}>
                    戻る
                </button>
                <button type="button" className="confirmation-btn" onClick={goToNextStep}>
                    {menuText.confirm}
                </button>
            </div>
        </div>
    );
}

export default WaitingScreenMenu;
