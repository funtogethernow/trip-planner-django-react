import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Map.css';

// Google Maps API Key - Replace with your actual API key
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

// Load Google Maps API
const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(window.google.maps);
    };
    script.onerror = (error) => {
      console.error('🗺️ Failed to load Google Maps API:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
};

// Enhanced custom marker icons for different POI types
const createCustomMarker = (map, position, type, isSelected = false, onClick) => {
  const iconConfigs = {
    attraction: {
      color: '#e74c3c',
      emoji: '🗽',
      size: 30,
      className: 'attraction-marker'
    },
    restaurant: {
      color: '#f39c12', 
      emoji: '🍽️',
      size: 28,
      className: 'restaurant-marker'
    },
    hotel: {
      color: '#3498db',
      emoji: '🏨', 
      size: 32,
      className: 'hotel-marker'
    },
    museum: {
      color: '#9b59b6',
      emoji: '🏛️',
      size: 30,
      className: 'museum-marker'
    },
    park: {
      color: '#27ae60',
      emoji: '🌳',
      size: 28,
      className: 'park-marker'
    },
    shopping: {
      color: '#e67e22',
      emoji: '🛍️',
      size: 30,
      className: 'shopping-marker'
    },
    transport: {
      color: '#34495e',
      emoji: '🚇',
      size: 26,
      className: 'transport-marker'
    },
    default: {
      color: '#95a5a6',
      emoji: '📍',
      size: 25,
      className: 'default-marker'
    }
  };
  
  const config = iconConfigs[type] || iconConfigs.default;
  const size = isSelected ? config.size + 5 : config.size;
  
  // Create custom SVG icon
  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${config.color}" stroke="white" stroke-width="2"/>
      <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle" font-size="${size * 0.4}" fill="white">${config.emoji}</text>
    </svg>
  `;
  
  const marker = new window.google.maps.Marker({
    position: position,
    map: map,
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size/2, size)
    },
    title: type,
    zIndex: isSelected ? 1000 : 1
  });
  
  if (onClick) {
    marker.addListener('click', onClick);
  }
  
  return marker;
};

const Map = ({ destination, coordinates, tripPlan, pois: externalPOIs, selectedPOI, highlightedPOI, onPOISelection, isRTL }) => {
  const { t } = useTranslation();
  const mapRef = useRef();
  const mapInstanceRef = useRef();
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Use external POIs from backend
  const pois = externalPOIs || [];

  // Load Google Maps API
  useEffect(() => {
    loadGoogleMapsAPI()
      .then(() => {
        setMapsLoaded(true);
      })
      .catch(error => {
        console.error('Failed to load Google Maps API:', error);
      });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;

    const defaultPosition = { lat: 20, lng: 0 };
    
    // Use 'lon' format consistently
    const hasCoordinates = coordinates && coordinates.lat && coordinates.lon;
    const position = hasCoordinates
      ? { 
          lat: parseFloat(coordinates.lat), 
          lng: parseFloat(coordinates.lon) 
        }
      : defaultPosition;

    const zoom = pois.length === 0 ? 14 : pois.length <= 3 ? 15 : pois.length <= 6 ? 14 : 13;

    const map = new window.google.maps.Map(mapRef.current, {
      center: position,
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    });

    mapInstanceRef.current = map;

    // Add main destination marker
    if (hasCoordinates) {
      const destinationMarker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: destination,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="20" fill="#2c3e50" stroke="white" stroke-width="3"/>
              <text x="20" y="25" text-anchor="middle" font-size="16" fill="white">📍</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 40)
        }
      });

      // Add destination info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="marker-popup">
            <h4>${destination}</h4>
            <p>📍 ${coordinates.lat.toFixed(4)}, ${coordinates.lon.toFixed(4)}</p>
            ${tripPlan ? `
              <div class="trip-summary">
                <p><strong>${t('map.tripPlanGenerated')}</strong></p>
                <p>${t('map.clickForDetails')}</p>
              </div>
            ` : ''}
          </div>
        `
      });

      destinationMarker.addListener('click', () => {
        infoWindow.open(map, destinationMarker);
      });
    }
  }, [mapsLoaded, coordinates, destination, tripPlan, t, pois.length]);

  // Add POI markers
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current || pois.length === 0) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers and info windows
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    infoWindowsRef.current.forEach(infoWindow => infoWindow.close());
    infoWindowsRef.current = [];

    // Calculate POI positions around the destination
    const hasDestinationCoordinates = coordinates && coordinates.lat && coordinates.lon;
    const basePosition = hasDestinationCoordinates
      ? { 
          lat: parseFloat(coordinates.lat), 
          lng: parseFloat(coordinates.lon) 
        }
      : { lat: 20, lng: 0 };

    const baseDistance = pois.length <= 3 ? 0.005 : 0.008;
    
    pois.forEach((poi, index) => {
      // Use actual coordinates if available, otherwise use spiral pattern
      let position;
      if (poi.coordinates && poi.coordinates.lat && poi.coordinates.lon) {
        // Use actual geocoded coordinates from backend
        position = {
          lat: parseFloat(poi.coordinates.lat),
          lng: parseFloat(poi.coordinates.lon)
        };
      } else {
        // Fallback to spiral pattern for distribution
        const angle = (index * 137.5) * (Math.PI / 180);
        const distance = baseDistance * (1 + index * 0.2);
        
        position = {
          lat: basePosition.lat + distance * Math.cos(angle),
          lng: basePosition.lng + distance * Math.sin(angle)
        };
      }

      const isSelected = highlightedPOI === poi.id;
      
      const marker = createCustomMarker(
        map, 
        position, 
        poi.type, 
        isSelected,
        () => {
          if (onPOISelection) {
            onPOISelection(poi);
          }
        }
      );

      // Create info window for POI
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ', ' + destination)}`;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(poi.name + ', ' + destination)}&origin=${encodeURIComponent(destination)}`;

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="marker-popup poi-popup ${isSelected ? 'selected' : ''}">
            <div class="poi-header">
              <span class="poi-icon">${poi.icon || '📍'}</span>
              <h4>${poi.name}</h4>
            </div>
            <p class="poi-type">${t(`map.poiTypes.${poi.type}`)}</p>
            <p class="poi-context">${poi.line || poi.context}</p>
            ${poi.coordinates ? `
              <p class="poi-coordinates">📍 ${poi.coordinates.lat.toFixed(4)}, ${poi.coordinates.lon.toFixed(4)}</p>
            ` : ''}
            ${isSelected ? `
              <div class="poi-selected-indicator">
                <span>📍 ${t('map.selectedPOI')}</span>
              </div>
            ` : ''}
            <div class="poi-links">
              <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="poi-link google-maps">
                🔍 ${t('map.viewOnGoogleMaps')}
              </a>
              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" class="poi-link directions">
                🗺️ ${t('map.getDirections')}
              </a>
            </div>
          </div>
        `
      });

      // Store marker and info window with POI ID for easy lookup
      marker.poiId = poi.id;
      infoWindow.poiId = poi.id;

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      infoWindowsRef.current.push(infoWindow);
    });
    
    // Fit map bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      if (hasDestinationCoordinates) {
        bounds.extend(new window.google.maps.LatLng(
          parseFloat(coordinates.lat), 
          parseFloat(coordinates.lon)
        ));
      }
      map.fitBounds(bounds);
    }
  }, [mapsLoaded, pois, highlightedPOI, destination, onPOISelection, t, coordinates]);

  // Center map on selected POI and open info window
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current || !selectedPOI) return;

    const map = mapInstanceRef.current;
    const marker = markersRef.current.find(m => m.poiId === selectedPOI.id);
    const infoWindow = infoWindowsRef.current.find(w => w.poiId === selectedPOI.id);
    
    if (marker && infoWindow) {
      map.panTo(marker.getPosition());
      map.setZoom(16);
      
      // Open info window directly without triggering click event
      infoWindow.open(map, marker);
    }
  }, [selectedPOI, mapsLoaded]);

  return (
    <div className={`map-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="map-header">
        <h3>{destination || t('map.worldMap')}</h3>
        {coordinates && coordinates.lat && (coordinates.lon) && (
          <div className="coordinates-info">
            <span>📍 {coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}</span>
          </div>
        )}
        {pois.length > 0 && (
          <div className="poi-count">
            <span>🎯 {pois.length} {t('map.pointsOfInterest')}</span>
          </div>
        )}
      </div>
      
      <div className="map-wrapper">
        <div ref={mapRef} className="map" style={{ height: '100%', width: '100%' }} />
      </div>
      
      {!mapsLoaded && (
        <div className="map-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">🗺️</div>
            <p>{t('map.loading')}</p>
          </div>
        </div>
      )}
      
      {!coordinates && mapsLoaded && (
        <div className="map-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">🗺️</div>
            <p>{t('map.enterDestination')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map; 