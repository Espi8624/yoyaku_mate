import React from 'react';
import styles from './WaitingPlaceMap.module.css';

function RecommendedPlacesList({
    nearbyPlaces,
    activeCategory,
    setActiveCategory,
    CATEGORIES,
    onPlaceClick,
    isFullScreen,
    mapText,
    isFetchingPlaces
}) {
    return (
        <div className={isFullScreen ? styles["nearby-places-list-fullscreen"] : styles["nearby-places-list"]}
            style={isFullScreen ? {} : { marginTop: '16px', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
            <div className={styles["nearby-places-title-container"]}>
                <div className={`${styles["preview-label"]} ${styles["nearby-places-title"]}`}>{mapText?.list_title || "おすすめスポット一覧"}</div>
                <div className={styles["nearby-places-tabs"]}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles["nearby-places-tab"]} ${activeCategory === cat.id ? styles["active"] : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {isFetchingPlaces ? (
                <div className={styles["nearby-places-empty"]}>
                    {mapText?.loading || "Loading..."}
                </div>
            ) : nearbyPlaces.length > 0 ? (
                nearbyPlaces.map((place) => (
                    <div
                        key={place.place_id}
                        className={styles["nearby-place-item"]}
                        onClick={() => onPlaceClick(place)}
                    >
                        <div className={styles["nearby-place-body"]}>
                            <div className={styles["nearby-place-header"]}>
                                <span className={styles["nearby-place-name"]}>
                                    {place.name}
                                </span>
                                <div className={styles["nearby-place-badges-container"]} style={{ display: 'flex', gap: '4px' }}>
                                    {place.distance && (
                                        <span className={styles["nearby-place-walking-badge"]}>
                                            {place.distance}m
                                        </span>
                                    )}
                                    {place.walking_time && (
                                        <span className={styles["nearby-place-walking-badge"]}>
                                            {mapText?.walking || "徒歩"}{place.walking_time}{mapText?.minutes || "分"}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={styles["nearby-place-rating-row"]}>
                                <span className={styles["nearby-place-star"]}>★</span>
                                <span className={styles["nearby-place-rating-value"]}>{place.rating || '-'}</span>
                                {place.user_ratings_total > 0 && (
                                    <span className={styles["nearby-place-rating-count"]}>
                                        ({place.user_ratings_total})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className={styles["nearby-places-empty"]}>
                    {CATEGORIES.find(c => c.id === activeCategory)?.label}{mapText?.not_found || "は見つかりませんでした。"}
                </div>
            )}
        </div>
    );
}

export default React.memo(RecommendedPlacesList);
