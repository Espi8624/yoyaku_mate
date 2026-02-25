import React from 'react';

function RecommendedPlacesList({
    nearbyPlaces,
    activeCategory,
    setActiveCategory,
    CATEGORIES,
    onPlaceClick,
    isFullScreen
}) {
    return (
        <div className={isFullScreen ? 'nearby-places-list-fullscreen' : 'nearby-places-list'}
            style={isFullScreen ? {} : { marginTop: '16px', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
            <div className="nearby-places-title-container">
                <div className="preview-label nearby-places-title">おすすめスポット一覧</div>
                <div className="nearby-places-tabs">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`nearby-places-tab ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {nearbyPlaces.length > 0 ? (
                nearbyPlaces.map((place) => (
                    <div
                        key={place.place_id}
                        className="nearby-place-item"
                        onClick={() => onPlaceClick(place)}
                    >
                        <div className="nearby-place-body">
                            <div className="nearby-place-header">
                                <span className="nearby-place-name">
                                    {place.name}
                                </span>
                                {place.walking_time && (
                                    <span className="nearby-place-walking-badge">
                                        徒歩{place.walking_time}分
                                    </span>
                                )}
                            </div>
                            <div className="nearby-place-address">
                                {place.vicinity}
                            </div>
                            <div className="nearby-place-rating-row">
                                <span className="nearby-place-star">★</span>
                                <span className="nearby-place-rating-value">{place.rating || '-'}</span>
                                {place.user_ratings_total > 0 && (
                                    <span className="nearby-place-rating-count">
                                        ({place.user_ratings_total})
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="nearby-places-empty">
                    {CATEGORIES.find(c => c.id === activeCategory)?.label}は見つかりませんでした。
                </div>
            )}
        </div>
    );
}

export default React.memo(RecommendedPlacesList);
