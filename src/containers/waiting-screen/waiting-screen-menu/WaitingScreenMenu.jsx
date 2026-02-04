import React, { useEffect, useState } from "react";
import { useWaitingScreen } from "../WaitingScreenContext";
import useTranslation from "../../../hook/useTranslation";
import { getTranslatedText } from "../../../utils/i18nHelper";
import { getMenuList } from "../../../api/waitingService";
import CommonPopup from "../../../components/CommonPopup";
import BackButton from "../../../components/BackButton";
import "./WaitingScreenMenu.css";

function WaitingScreenMenu() {
    const {
        storeId,
        selectedMenus,
        setSelectedMenus,
        setStep,
        selectedLanguageCode,
        partySize, // Get partySize
        requireOneMenuPerPerson, // Get setting
    } = useWaitingScreen();

    const [menuList, setMenuList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState(new Set());
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState(""); // Add state for dynamic message

    const handleNext = () => {
        // Calculate total quantity
        const totalQuantity = selectedMenus.reduce((sum, item) => sum + item.quantity, 0);

        console.log("Validation Debug:", {
            requireOneMenuPerPerson,
            partySize: Number(partySize),
            totalQuantity,
            condition: requireOneMenuPerPerson && totalQuantity < Number(partySize)
        });

        // 1. Basic check: at least one item
        if (totalQuantity === 0) {
            setPopupMessage(menuText.select_at_least_one || "メニューを少なくとも1つ選択してください");
            setShowErrorPopup(true);
            return;
        }

        // 2. One menu per person check
        if (requireOneMenuPerPerson && totalQuantity < Number(partySize)) {
            setPopupMessage(menuText.one_menu_per_person_error || "お一人様につき少なくとも1つのメニューを注文してください");
            setShowErrorPopup(true);
            return;
        }

        setStep(2);
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
                            title_translations: menu.title_translations, // Add translations
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
                        {menuList.map((menu) => {
                            const displayTitle = getTranslatedText(menu.title, menu.title_translations, selectedLanguageCode);
                            const displayDescription = getTranslatedText(menu.description, menu.description_translations, selectedLanguageCode);

                            const titleParts = displayTitle.split(" / ");
                            const mainTitle = titleParts[0];
                            const pronunciation = titleParts.length > 1 ? titleParts[1] : null;

                            return (
                                <div
                                    key={menu.menu_id}
                                    className="menu-item-card"
                                >
                                    <div className="menu-item-top-row">
                                        {menu.menu_image_url ? (
                                            <img
                                                src={menu.menu_image_url}
                                                alt={mainTitle}
                                                className="waiting-menu-item-image"
                                            />
                                        ) : (
                                            <div className="menu-item-placeholder">No Image</div>
                                        )}
                                        <div className="menu-item-details">
                                            <div className="menu-item-title-container">
                                                <div className="menu-item-title">{mainTitle}</div>
                                                {pronunciation && <div className="menu-item-pronunciation">{pronunciation}</div>}
                                            </div>
                                            <div className="menu-item-price-row">
                                                <div className="menu-item-price">¥{Number(menu.price).toLocaleString()}</div>
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
                                            {displayDescription && (
                                                <button
                                                    onClick={() => toggleDescription(menu.menu_id)}
                                                    className="menu-item-toggle-btn"
                                                >
                                                    {expandedMenus.has(menu.menu_id) ? `▲ ${menuText.close_details}` : `▼ ${menuText.view_details}`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {expandedMenus.has(menu.menu_id) && displayDescription && (
                                        <div className="menu-item-description-box">
                                            {displayDescription}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                message={popupMessage}
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
