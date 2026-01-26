import React, { useEffect, useState } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getMenuList } from "../../../api/waitingService";
import CommonPopup from "../../../components/CommonPopup";
import BackButton from "../../../components/BackButton";
import "./WaitingScreenMenu.css";

function WaitingScreenMenu() {
    const {
        storeId,
        selectedMenus,
        setSelectedMenus,
        setStep, // Add setStep
        selectedLanguageCode,
    } = useWaitingScreen();

    const [menuList, setMenuList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState(new Set()); // 展開されたメニューIDを追跡
    const [showErrorPopup, setShowErrorPopup] = useState(false);

    const handleNext = () => {
        // Check if at least one menu is selected (quantity > 0)
        const hasSelection = selectedMenus.some(item => item.quantity > 0);
        if (hasSelection) {
            setStep(2);
        } else {
            setShowErrorPopup(true);
        }
    };

    const t = useTranslation(selectedLanguageCode);
    const menuText = t.waiting_screen_menu; // Use the object from resources

    useEffect(() => {
        const fetchMenus = async () => {
            setIsLoading(true);
            try {
                const menus = await getMenuList(storeId);
                console.log("Fetched Menus:", menus); // Debug log

                // ステータスがactiveかつ事予約可能(pre-order available)なメニューのみフィルタリング
                const availableMenus = menus.filter(
                    (m) => m.menu_status === "available" && m.is_pre_order_available
                );
                console.log("Available Menus:", availableMenus); // Debug log

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

    // メニュー説明の表示/非表示を切り替え
    const toggleDescription = (menuId) => {
        setExpandedMenus((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    };

    return (
        <div className="waiting-section">
            <div className="menu-header-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '18px' }}>
                <BackButton onClick={() => setStep(1)} />
                <div className="preview-label" style={{ marginBottom: 0 }}>{menuText.title}</div>
            </div>

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
                            >
                                <div className="menu-item-top-row">
                                    {menu.menu_image_url ? (
                                        <img
                                            src={menu.menu_image_url}
                                            alt={menu.title}
                                            className="waiting-menu-item-image"
                                        />
                                    ) : (
                                        <div className="menu-item-placeholder">No Image</div>
                                    )}
                                    <div className="menu-item-details">
                                        <div className="menu-item-top-row">
                                            <div className="menu-item-info">
                                                <div className="menu-item-title">{menu.title}</div>
                                                <div className="menu-item-price">¥{menu.price.toFixed(1)}</div>
                                                {menu.description && (
                                                    <button
                                                        onClick={() => toggleDescription(menu.menu_id)}
                                                        className="menu-item-toggle-btn"
                                                    >
                                                        {expandedMenus.has(menu.menu_id) ? `▲ ${menuText.close_details}` : `▼ ${menuText.view_details}`}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="menu-item-controls">
                                                <button
                                                    className="quantity-btn minus"
                                                    onClick={() => handleQuantityChange(menu, -1)}
                                                    disabled={getQuantity(menu.menu_id) === 0}
                                                >
                                                    <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <rect width="12" height="2" rx="1" fill="#333" />
                                                    </svg>
                                                </button>
                                                <span className="quantity-value">{getQuantity(menu.menu_id)}</span>
                                                <button
                                                    className="quantity-btn plus"
                                                    onClick={() => handleQuantityChange(menu, 1)}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path fillRule="evenodd" clipRule="evenodd" d="M7 5V0H5V5H0V7H5V12H7V7H12V5H7Z" fill="#333" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {expandedMenus.has(menu.menu_id) && menu.description && (
                                    <div className="menu-item-description-box">
                                        {menu.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="menu-actions">
                <button type="button" className="confirmation-btn" onClick={handleNext}>
                    {menuText.confirm}
                </button>
            </div>

            {/* Error Popup for Menu Selection */}
            <CommonPopup
                isOpen={showErrorPopup}
                onClose={() => setShowErrorPopup(false)}
                message={menuText.select_at_least_one || "メニューを少なくとも1つ選択してください"}
                actions={
                    <button
                        className="confirmation-btn"
                        onClick={() => setShowErrorPopup(false)}
                        type="button"
                    >
                        確認
                    </button>
                }
            />
        </div>
    );
}

export default WaitingScreenMenu;
