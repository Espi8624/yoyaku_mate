import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import CommonPopup from '../../../components/CommonPopup';
import "./WaitingScreen.css";

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

function WaitingPlaceMap({ storeInfo, texts }) {
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

    // Accordion state
    const [isOpen, setIsOpen] = useState(false);

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

    return (
        <div className="menu-container"> {/* Reusing menu styling */}
            {/* Header */}
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
                    {/* Default text or from texts prop if available */}
                    {isOpen ? "地図を閉じる" : "周辺の待機スポットを見る"}
                </span>
            </div>

            {/* Content (Map) */}
            {isOpen && (
                <div className="menu-content" style={{ padding: '0 0 16px 0' }}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={16}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false,
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
                                    // Move center slightly North so the marker is lower and InfoWindow is visible
                                    // zoom 16: approx 0.002 degrees is good for mobile view
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
                                    url: place.icon, // Use Google's category icons or default red dot
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
                                    disableAutoPan: true,
                                    pixelOffset: new window.google.maps.Size(0, -30)
                                }}
                            >
                                <div style={{ width: '260px', padding: '0', position: 'relative' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPlace(null);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '-4px', // Pull up slightly
                                            right: '-4px', // Pull right slightly
                                            background: 'transparent',
                                            border: 'none',
                                            fontSize: '28px', // Larger size
                                            fontWeight: 'bold',
                                            color: '#999',
                                            cursor: 'pointer',
                                            padding: '8px', // Larger touch target
                                            lineHeight: '1',
                                            zIndex: 10
                                        }}
                                    >
                                        ×
                                    </button>

                                    <div style={{ padding: '2px 8px 8px 8px' }}>
                                        {/* Name - Single line with ellipsis */}
                                        <h4 style={{
                                            margin: '0 0 2px 0',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: '#333',
                                            lineHeight: '1.3',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'block',
                                            maxWidth: '100%',
                                            paddingRight: '36px' // increased for larger close button
                                        }}>
                                            {selectedPlace.name}
                                        </h4>

                                        {/* Rating & Time - Second line */}
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', gap: '6px' }}>
                                            {/* Rating */}
                                            <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                <span style={{ color: '#fbbc04', fontSize: '11px', marginRight: '2px' }}>★</span>
                                                <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#333' }}>
                                                    {selectedPlace.rating || '-'}
                                                </span>
                                                <span style={{ fontSize: '10px', color: '#999', marginLeft: '2px' }}>
                                                    ({selectedPlace.user_ratings_total || 0})
                                                </span>
                                            </div>

                                            {/* Walking Time */}
                                            {selectedPlace.walking_time && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: '#0066cc',
                                                    backgroundColor: '#e6f0ff',
                                                    padding: '1px 5px',
                                                    borderRadius: '10px',
                                                    fontWeight: '600',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    徒歩{selectedPlace.walking_time}分
                                                </span>
                                            )}
                                        </div>

                                        {/* Image - Fixed Height */}
                                        <div style={{
                                            width: '100%',
                                            height: '110px',
                                            backgroundColor: '#eee', // Placeholder bg
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            marginBottom: '6px'
                                        }}>
                                            {selectedPlace.photoUrl ? (
                                                <img
                                                    src={selectedPlace.photoUrl}
                                                    alt={selectedPlace.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#999',
                                                    fontSize: '11px'
                                                }}>
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        {/* Google Maps Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent map click
                                                const place = selectedPlace;
                                                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
                                                setPendingUrl(url);
                                            }}
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '4px 0',
                                                backgroundColor: '#fff',
                                                color: '#0066cc',
                                                border: '1px solid #0066cc',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}
                                        >
                                            Google Mapで見る
                                        </button>
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>

                    {/* List of nearby places (Bonus UX) */}
                    {nearbyPlaces.length > 0 && (
                        <div className="menu-items-list" style={{ marginTop: '16px', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="preview-label" style={{ fontSize: '0.9em', marginBottom: '8px' }}>おすすめスポット一覧</div>
                            {nearbyPlaces.slice(0, 3).map((place) => (
                                <div
                                    key={place.place_id}
                                    className="menu-item"
                                    style={{ marginBottom: '12px', cursor: 'pointer', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                                    onClick={() => {
                                        setSelectedPlace(place);
                                        // Same offset logic as marker click
                                        const lat = typeof place.geometry.location.lat === 'function'
                                            ? place.geometry.location.lat()
                                            : place.geometry.location.lat;
                                        const lng = typeof place.geometry.location.lng === 'function'
                                            ? place.geometry.location.lng()
                                            : place.geometry.location.lng;
                                        if (map) {
                                            map.panTo({ lat: lat + 0.0025, lng: lng });
                                        }

                                        // Scroll to map for better UX
                                        const mapElement = document.querySelector('.menu-container');
                                        if (mapElement) {
                                            mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                >
                                    <div className="menu-item-details" style={{ width: '100%', padding: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#333', lineHeight: '1.4', flex: 1 }}>
                                                {place.name}
                                            </span>
                                            {place.walking_time && (
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: '#0066cc',
                                                    backgroundColor: '#e6f0ff',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    whiteSpace: 'nowrap',
                                                    marginLeft: '8px',
                                                    fontWeight: '600',
                                                    height: 'fit-content'
                                                }}>
                                                    徒歩{place.walking_time}分
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.4' }}>
                                            {place.vicinity}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                            <span style={{ color: '#fbbc04', marginRight: '4px' }}>★</span>
                                            <span style={{ fontWeight: 'bold', color: '#333' }}>{place.rating || '-'}</span>
                                            {place.user_ratings_total > 0 && (
                                                <span style={{ color: '#999', fontSize: '11px', marginLeft: '4px' }}>
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
                message={texts?.google_map_popup?.message || "Google Mapを開きますか？"} // Fallback text just in case
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
