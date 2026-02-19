import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import CommonPopup from '../../../components/CommonPopup';
import "./WaitingScreen.css";
import "./WaitingPlaceMap.css";

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

function WaitingPlaceMap({ storeInfo, texts, isFullScreen = false }) {
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

    // Accordion state (Only used when NOT full screen, though we will likely only use full screen now)
    const [isOpen, setIsOpen] = useState(isFullScreen);

    useEffect(() => {
        if (isFullScreen) {
            setIsOpen(true);
        }
    }, [isFullScreen]);

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
                try {
                    // Use modern importLibrary
                    const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary("places");

                    const request = {
                        fields: ['displayName', 'location', 'businessStatus', 'rating', 'userRatingCount', 'formattedAddress', 'svgIconMaskURI', 'photos'],
                        locationRestriction: {
                            center: storeLocation,
                            radius: 500, // meters
                        },
                        includedPrimaryTypes: ['cafe', 'park', 'shopping_mall', 'library'],
                        maxResultCount: 20,
                        rankPreference: SearchNearbyRankPreference.POPULARITY,
                        language: 'ja',
                    };

                    // Execute search
                    const { places } = await Place.searchNearby(request);



                    // Map new result format to existing state structure
                    const mappedPlaces = places.map(p => {
                        // Calculate walking time (80m/min)
                        let walkingTime = null;
                        if (storeLocation && p.location) {
                            const lat1 = storeLocation.lat;
                            const lng1 = storeLocation.lng;
                            const lat2 = typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat;
                            const lng2 = typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng;

                            if (lat1 && lng1 && lat2 && lng2) {
                                const R = 6371e3; // metres
                                const φ1 = lat1 * Math.PI / 180;
                                const φ2 = lat2 * Math.PI / 180;
                                const Δφ = (lat2 - lat1) * Math.PI / 180;
                                const Δλ = (lng2 - lng1) * Math.PI / 180;

                                const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                                    Math.cos(φ1) * Math.cos(φ2) *
                                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                const d = R * c;
                                walkingTime = Math.ceil(d / 80);
                            }
                        }

                        let photoUrl = null;
                        if (p.photos && p.photos.length > 0) {
                            // Correctly accessing the photo URI for New Places API
                            // Check if getURI exists, otherwise fallback or skip
                            if (typeof p.photos[0].getURI === 'function') {
                                photoUrl = p.photos[0].getURI({ maxWidth: 200, maxHeight: 150 });
                            }
                        }

                        return {
                            place_id: p.id,
                            geometry: { location: p.location },
                            name: p.displayName,
                            vicinity: p.formattedAddress,
                            rating: p.rating,
                            user_ratings_total: p.userRatingCount,
                            icon: p.svgIconMaskURI,
                            walking_time: walkingTime,
                            photoUrl: photoUrl
                        };
                    });

                    setNearbyPlaces(mappedPlaces);

                } catch (error) {
                    console.error('[WaitingPlaceMap] New Places API Error:', error);
                    if (error.message && error.message.includes("is not enabled")) {
                        console.warn("Please enable 'Places API (New)' in Google Cloud Console.");
                    }
                }
            }
        };

        fetchPlaces();
    }, [map, storeLocation]);

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
                        {isOpen ? "地図を閉じる" : "周辺の待機スポットを見る"}
                    </span>
                </div>
            )}

            {/* Content (Map + List) */}
            {isOpen && (
                <div
                    className={isFullScreen ? "map-content-full" : "menu-content"}
                    style={isFullScreen ? { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 } : { padding: '0 0 16px 0' }}
                >
                    {/* Map takes 50% of the content area */}
                    <div style={isFullScreen ? { height: '50%', position: 'relative', flexShrink: 0, overflow: 'hidden' } : { position: 'relative' }}>
                        <GoogleMap
                            mapContainerStyle={finalContainerStyle}
                            center={center}
                            zoom={16}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
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
                                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
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
                                        <div className="infowindow-content">
                                            {/* Title and rating row */}
                                            <div>
                                                <h4 className="infowindow-title">
                                                    {selectedPlace.name}
                                                </h4>
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
                                                    {selectedPlace.walking_time && (
                                                        <span className="infowindow-walking-badge">
                                                            徒歩{selectedPlace.walking_time}分
                                                        </span>
                                                    )}
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
                                                        No Image
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
                                                Google Mapで見る
                                            </button>
                                        </div>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </div>

                    {/* List of nearby places - takes the other 50% */}
                    {nearbyPlaces.length > 0 && (
                        <div className={isFullScreen ? 'nearby-places-list-fullscreen' : 'nearby-places-list'}
                            style={isFullScreen ? {} : { marginTop: '16px', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                        >
                            <div className="preview-label nearby-places-title">おすすめスポット一覧</div>
                            {nearbyPlaces.map((place) => (
                                <div
                                    key={place.place_id}
                                    className="nearby-place-item"
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
                                        if (!isFullScreen) {
                                            const mapElement = document.querySelector('.menu-container');
                                            if (mapElement) {
                                                mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }
                                    }}
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
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Google Maps Confirmation Popup */}
            <CommonPopup
                isOpen={!!pendingUrl}
                onClose={() => setPendingUrl(null)}
                message={texts?.google_map_popup?.message || "Google Mapを開きますか？"}
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
                        {texts?.google_map_popup?.confirm || "開く"}
                    </button>
                }
            />
        </div>
    );
}


export default React.memo(WaitingPlaceMap);
