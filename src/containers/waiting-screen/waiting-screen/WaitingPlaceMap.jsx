import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import CommonPopup from '../../../components/CommonPopup';
import RecommendedPlacesList from './RecommendedPlacesList';
import "./WaitingPlaceMap.css";
import useTranslation from '../../../hook/useTranslation';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px',
    marginTop: '20px'
};

const defaultCenter = {
    lat: 35.681236,
    lng: 139.767125
};

const libraries = ['places'];

// Pure utility: Haversine formula to calculate distance in meters between two coordinates
function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const CATEGORIES = [
    { id: 'cafe', label: 'カフェ', types: ['cafe'] },
    { id: 'park', label: '公園', types: ['park'] },
    { id: 'convenience', label: 'コンビニ', types: ['convenience_store'] },
    { id: 'shopping', label: 'ショッピングモール', types: ['shopping_mall'] },
    { id: 'library', types: ['library'] }
];

function WaitingPlaceMap({ storeInfo, texts, isFullScreen = false, selectedLanguageCode }) {
    const t = useTranslation(selectedLanguageCode);
    const mapText = useMemo(() => t.waiting_place_map || {}, [t]);

    const localizedCategories = useMemo(() => CATEGORIES.map(cat => ({
        ...cat,
        label: mapText[`category_${cat.id}`] || cat.id
    })), [mapText]);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    const [map, setMap] = useState(null);
    const [center, setCenter] = useState(defaultCenter);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [storeLocation, setStoreLocation] = useState(null);
    const [pendingUrl, setPendingUrl] = useState(null);

    const [isOpen, setIsOpen] = useState(isFullScreen);
    const [activeCategory, setActiveCategory] = useState('cafe');
    const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
    const placesCache = useRef({});
    const placesLibrary = useRef(null); // Cache the imported Places library
    const fetchRequestId = useRef(0); // Race condition guard

    useEffect(() => {
        if (isFullScreen) {
            setIsOpen(true);
        }
    }, [isFullScreen]);

    // Load the Places library once when the map is ready
    useEffect(() => {
        if (!isLoaded || placesLibrary.current) return;
        window.google.maps.importLibrary("places").then(lib => {
            placesLibrary.current = lib;
        });
    }, [isLoaded]);

    // Invalidate cache when language changes so results are re-fetched in correct language
    useEffect(() => {
        placesCache.current = {};
    }, [selectedLanguageCode]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Geocode store address
    useEffect(() => {
        if (isLoaded && storeInfo && storeInfo.address && !storeLocation) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: storeInfo.address }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    const newCenter = { lat: location.lat(), lng: location.lng() };
                    setCenter(newCenter);
                    setStoreLocation(newCenter);
                } else {
                    console.error('Geocode was not successful for the following reason: ' + status);
                }
            });
        }
    }, [isLoaded, storeInfo, storeLocation]);

    // Search nearby places
    // Search nearby places using New Places API
    useEffect(() => {
        const fetchPlaces = async () => {
            if (map && storeLocation) {
                if (placesCache.current[activeCategory]) {
                    setNearbyPlaces(placesCache.current[activeCategory]);
                    return;
                }

                setIsFetchingPlaces(true);
                setNearbyPlaces([]); // Clear list while loading

                // Race condition guard: if a new fetch was triggered, abandon this one
                const currentRequestId = ++fetchRequestId.current;

                try {
                    // Use the pre-loaded library, or fall back to importing it
                    const { Place, SearchNearbyRankPreference } = placesLibrary.current
                        || await window.google.maps.importLibrary("places");

                    const activeCategoryTypes = CATEGORIES.find(c => c.id === activeCategory)?.types;

                    const request = {
                        fields: ['displayName', 'location', 'businessStatus', 'rating', 'userRatingCount', 'formattedAddress', 'svgIconMaskURI', 'photos'],
                        locationRestriction: {
                            center: storeLocation,
                            radius: 1000.0,
                        },
                        includedPrimaryTypes: activeCategoryTypes || CATEGORIES[0].types,
                        maxResultCount: 20,
                        rankPreference: SearchNearbyRankPreference.POPULARITY,
                        language: selectedLanguageCode?.startsWith('ja') ? 'ja' : 'en',
                    };

                    // Execute search
                    const { places } = await Place.searchNearby(request);

                    // Abandon stale response if a newer request has been triggered
                    if (currentRequestId !== fetchRequestId.current) return;

                    // Map new result format to existing state structure
                    const mappedPlaces = places.map(p => {
                        let walkingTime = null;
                        let distanceStr = null;
                        if (storeLocation && p.location) {
                            const lat1 = storeLocation.lat;
                            const lng1 = storeLocation.lng;
                            const lat2 = typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat;
                            const lng2 = typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng;

                            if (lat1 && lng1 && lat2 && lng2) {
                                const distMeters = calculateDistanceMeters(lat1, lng1, lat2, lng2);
                                distanceStr = Math.round(distMeters);
                                walkingTime = Math.ceil(distMeters / 80);
                            }
                        }

                        let photoUrl = null;
                        if (p.photos && p.photos.length > 0) {
                            if (typeof p.photos[0].getURI === 'function') {
                                photoUrl = p.photos[0].getURI({ maxWidth: 200, maxHeight: 150 });
                            }
                        }

                        return {
                            place_id: p.id,
                            geometry: { location: p.location },
                            name: p.displayName,
                            vicinity: distanceStr ? `${distanceStr}m` : '',
                            rating: p.rating,
                            user_ratings_total: p.userRatingCount,
                            icon: p.svgIconMaskURI,
                            walking_time: walkingTime,
                            distance: distanceStr,
                            photoUrl: photoUrl
                        };
                    });

                    // Sort places by calculated distance (ascending)
                    mappedPlaces.sort((a, b) => {
                        const distA = a.distance || Infinity;
                        const distB = b.distance || Infinity;
                        return distA - distB;
                    });

                    placesCache.current[activeCategory] = mappedPlaces;
                    setNearbyPlaces(mappedPlaces);

                } catch (error) {
                    console.error('[WaitingPlaceMap] New Places API Error:', error);
                    if (error.message && error.message.includes("is not enabled")) {
                        console.warn("Please enable 'Places API (New)' in Google Cloud Console.");
                    }
                } finally {
                    setIsFetchingPlaces(false);
                }
            }
        };

        fetchPlaces();
    }, [map, storeLocation, activeCategory, selectedLanguageCode]);

    // Extract the list item click logic into a handler to pass to the new component
    const handlePlaceClick = useCallback((place) => {
        setSelectedPlace(place);
        const lat = typeof place.geometry.location.lat === 'function'
            ? place.geometry.location.lat()
            : place.geometry.location.lat;
        const lng = typeof place.geometry.location.lng === 'function'
            ? place.geometry.location.lng()
            : place.geometry.location.lng;

        if (map) {
            map.panTo({ lat: lat + 0.0025, lng: lng });
        }

        if (!isFullScreen) {
            const mapElement = document.querySelector('.menu-container');
            if (mapElement) {
                mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [map, isFullScreen]);

    if (!isLoaded) {
        return null; // Or a loading spinner if preferred, but null prevents layout shift until loaded
    }

    // Map container style - GoogleMap fills 100% of its wrapper div
    const finalContainerStyle = isFullScreen ? {
        width: '100%',
        height: '100%',
        borderRadius: '0',
    } : containerStyle;

    return (
        <div
            className={isFullScreen ? "map-full-screen-container" : "menu-container"}
        >
            {/* Header - Only show if NOT full screen (Full screen has its own modal header usually) */}
            {!isFullScreen && (
                <div
                    className="menu-category-header"
                    onClick={() => setIsOpen(prev => !prev)}
                >
                    <span className="menu-category-icon">
                        {isOpen ? (
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
                        {isOpen ? (mapText?.close_map || "地図を閉じる") : (mapText?.open_map || "周辺の待機スポットを見る")}
                    </span>
                </div>
            )}

            {/* Content (Map + List) */}
            {isOpen && (
                <div
                    className={isFullScreen ? "map-content-full" : "menu-content"}
                    style={isFullScreen ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 } : { padding: '0 0 16px 0' }}
                >
                    {/* Map takes 60% of the content area */}
                    <div style={isFullScreen ? { height: '60%', position: 'relative', flexShrink: 0, overflow: 'hidden' } : { position: 'relative' }}>
                        <GoogleMap
                            mapContainerStyle={finalContainerStyle}
                            center={center}
                            zoom={16}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            onClick={() => setSelectedPlace(null)}
                            options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                zoomControl: true, // Enable zoom control for better UX in full screen
                                fullscreenControl: false, // Disable default fullscreen control as we are already in modal
                                clickableIcons: false, // Disable default Google POI InfoWindow
                            }}
                        >
                            {/* Store Marker (Blue) */}
                            {storeLocation && (
                                <Marker
                                    position={storeLocation}
                                    title={storeInfo.store_name || "店舗"}
                                    icon={{
                                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                                    }}
                                />
                            )}

                            {/* Nearby Places Markers (Red) */}
                            {nearbyPlaces.map((place) => (
                                <Marker
                                    key={place.place_id}
                                    position={place.geometry.location}
                                    onClick={() => {
                                        setSelectedPlace(place);
                                        const lat = typeof place.geometry.location.lat === 'function'
                                            ? place.geometry.location.lat()
                                            : place.geometry.location.lat;
                                        const lng = typeof place.geometry.location.lng === 'function'
                                            ? place.geometry.location.lng()
                                            : place.geometry.location.lng;

                                        if (map) {
                                            map.panTo({ lat: lat + 0.0025, lng: lng });
                                        }
                                    }}
                                    icon={{
                                        url: place.icon,
                                        scaledSize: new window.google.maps.Size(25, 25)
                                    }}
                                />
                            ))}

                            {/* Info Window for Selected Place */}
                            {selectedPlace && (
                                <InfoWindow
                                    position={selectedPlace.geometry.location}
                                    onCloseClick={() => {
                                        setSelectedPlace(null);
                                    }}
                                    options={{
                                        disableAutoPan: false,
                                        pixelOffset: new window.google.maps.Size(0, -40)
                                    }}
                                >
                                    <div className="infowindow-container">
                                        <div className="infowindow-header">
                                            <h4 className="infowindow-title">
                                                {selectedPlace.name}
                                            </h4>
                                            <button
                                                className="infowindow-close-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPlace(null);
                                                }}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="infowindow-content">
                                            {/* Rating and Meta row */}
                                            <div>

                                                <div className="infowindow-meta">
                                                    <div className="infowindow-rating">
                                                        <span className="infowindow-star">★</span>
                                                        <span className="infowindow-rating-value">
                                                            {selectedPlace.rating || '-'}
                                                        </span>
                                                        <span className="infowindow-rating-count">
                                                            ({selectedPlace.user_ratings_total || 0})
                                                        </span>
                                                    </div>
                                                    <div className="infowindow-badges-container" style={{ display: 'flex', gap: '4px' }}>
                                                        {selectedPlace.distance && (
                                                            <span className="infowindow-walking-badge">
                                                                {selectedPlace.distance}m
                                                            </span>
                                                        )}
                                                        {selectedPlace.walking_time && (
                                                            <span className="infowindow-walking-badge">
                                                                {mapText?.walking || "徒歩"}{selectedPlace.walking_time}{mapText?.minutes || "分"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Image */}
                                            <div className="infowindow-image">
                                                {selectedPlace.photoUrl ? (
                                                    <img
                                                        src={selectedPlace.photoUrl}
                                                        alt={selectedPlace.name}
                                                    />
                                                ) : (
                                                    <div className="infowindow-no-image">
                                                        {mapText?.no_image || "No Image"}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Button */}
                                            <button
                                                className="infowindow-open-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const place = selectedPlace;
                                                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
                                                    setPendingUrl(url);
                                                }}
                                            >
                                                {mapText?.view_on_map || "View on Google Maps"}
                                            </button>
                                        </div>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </div>

                    {/* List of nearby places - takes the other 50% */}
                    <RecommendedPlacesList
                        nearbyPlaces={nearbyPlaces}
                        activeCategory={activeCategory}
                        setActiveCategory={setActiveCategory}
                        CATEGORIES={localizedCategories}
                        onPlaceClick={handlePlaceClick}
                        isFullScreen={isFullScreen}
                        mapText={mapText}
                        isFetchingPlaces={isFetchingPlaces}
                    />
                </div>
            )}

            {/* Google Maps Confirmation Popup */}
            <CommonPopup
                isOpen={!!pendingUrl}
                onClose={() => setPendingUrl(null)}
                message={t?.google_map_popup?.message || "Google Mapを開きますか？"}
                actions={
                    <button
                        className="confirmation-btn"
                        onClick={() => {
                            if (pendingUrl) {
                                window.open(pendingUrl, '_blank');
                                setPendingUrl(null);
                            }
                        }}
                    >
                        {t?.google_map_popup?.confirm || "開く"}
                    </button>
                }
            />
        </div>
    );
}


export default React.memo(WaitingPlaceMap);
