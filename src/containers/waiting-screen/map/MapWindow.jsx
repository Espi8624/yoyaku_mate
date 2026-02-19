import React, { useEffect, useState } from 'react';
import { useWaitingScreen } from '../WaitingScreenContext';
import WaitingPlaceMap from '../waiting-screen/WaitingPlaceMap';
import { getStoreInfo } from '../../../api/waitingService';
import './MapWindow.css';

const HEADER_HEIGHT = 57; // px - header height

const MapWindow = () => {
    const { isMapOpen, toggleMap, storeId, texts } = useWaitingScreen();
    const [storeInfo, setStoreInfo] = useState(null);

    // Fetch store info when map opens
    useEffect(() => {
        if (isMapOpen && storeId && !storeInfo) {
            getStoreInfo(storeId).then(data => {
                setStoreInfo(data);
            }).catch(err => {
                console.error("Failed to fetch store info for map:", err);
            });
        }
    }, [isMapOpen, storeId, storeInfo]);

    if (!isMapOpen) return null;

    const contentHeight = `calc(100vh - ${HEADER_HEIGHT}px)`;

    return (
        <div className="map-window-container">
            {/* Header */}
            <div className="map-window-header">
                <h2 className="map-window-title">
                    周辺マップ
                </h2>
                <button
                    onClick={toggleMap}
                    className="map-window-close-btn"
                >
                    ×
                </button>
            </div>

            <div className="map-window-content" style={{ height: contentHeight }}>
                {storeInfo ? (
                    <WaitingPlaceMap
                        storeInfo={storeInfo}
                        texts={texts}
                        isFullScreen={true}
                    />
                ) : (
                    <div className="map-window-loading">
                        読み込み中...
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapWindow;
