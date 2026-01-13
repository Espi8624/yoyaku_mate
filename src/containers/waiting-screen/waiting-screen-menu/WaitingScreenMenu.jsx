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
                // ステータスがavailableかつ事予約可能(pre-order available)なメニューのみフィルタリング
                const availableMenus = menus.filter(
                    (m) => m.menu_status === "available" && m.is_pre_order_available
                );

                setMenuList(availableMenus);
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
                            imageUrl: menu.menu_image_url,
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
                            <div
                                key={menu.menu_id}
                                className="menu-item-card"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    width: '100%',
                                    padding: '16px',
                                    backgroundColor: '#fff',
                                    borderBottom: '1px solid #f0f0f0',
                                    alignItems: 'center'
                                }}
                            >
                                {menu.menu_image_url ? (
                                    <img
                                        src={menu.menu_image_url}
                                        alt={menu.title}
                                        className="menu-item-image"
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            minWidth: '64px',
                                            maxWidth: '64px',
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            marginRight: '16px',
                                            flexShrink: 0
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="menu-item-placeholder"
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            minWidth: '64px',
                                            borderRadius: '8px',
                                            backgroundColor: '#eee',
                                            marginRight: '16px',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '10px',
                                            color: '#999'
                                        }}
                                    >No Image</div>
                                )}
                                <div className="menu-item-details" style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="menu-item-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div className="menu-item-title" style={{ fontSize: '16px', fontWeight: 500, color: '#333' }}>{menu.title}</div>
                                        <div className="menu-item-price" style={{ fontSize: '14px', color: '#666' }}>¥{menu.price.toFixed(1)}</div>
                                    </div>
                                    <div className="menu-item-quantity-control" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                                        <button
                                            className="quantity-btn minus"
                                            onClick={() => handleQuantityChange(menu, -1)}
                                            disabled={getQuantity(menu.menu_id) === 0}
                                        >
                                            <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect width="12" height="2" rx="1" fill="currentColor" />
                                            </svg>
                                        </button>
                                        <span className="quantity-value" style={{ fontSize: '16px', fontWeight: 500, minWidth: '24px', textAlign: 'center' }}>{getQuantity(menu.menu_id)}</span>
                                        <button
                                            className="quantity-btn plus"
                                            onClick={() => handleQuantityChange(menu, 1)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M7 5V0H5V5H0V7H5V12H7V7H12V5H7Z" fill="currentColor" />
                                            </svg>
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
