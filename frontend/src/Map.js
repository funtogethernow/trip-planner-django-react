import React, { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different POI types
const createCustomIcon = (type) => {
  const iconColors = {
    attraction: '#e74c3c',    // Red for attractions
    restaurant: '#f39c12',    // Orange for restaurants
    hotel: '#3498db',         // Blue for hotels
    museum: '#9b59b6',        // Purple for museums
    park: '#27ae60',          // Green for parks
    shopping: '#e67e22',      // Dark orange for shopping
    transport: '#34495e',     // Dark gray for transport
    default: '#95a5a6'        // Gray for others
  };
  
  const color = iconColors[type] || iconColors.default;
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color.replace('#', '')}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

// Function to extract POIs from trip plan text
const extractPOIs = (tripPlan) => {
  if (!tripPlan) return [];
  
  const pois = [];
  const lines = tripPlan.split('\n');
  
  // Common POI keywords in different languages
  const poiKeywords = {
    attraction: ['attraction', 'landmark', 'monument', 'tower', 'bridge', 'palace', 'castle', 'cathedral', 'church', 'temple', 'mosque', 'synagogue', 'plaza', 'square', 'fountain', 'statue', 'attracción', 'monumento', 'torre', 'puente', 'palacio', 'castillo', 'catedral', 'iglesia', 'templo', 'mezquita', 'sinagoga', 'plaza', 'fuente', 'estatua', 'attraction', 'monument', 'tour', 'pont', 'palais', 'château', 'cathédrale', 'église', 'temple', 'mosquée', 'synagogue', 'place', 'fontaine', 'statue', 'attraktion', 'denkmal', 'turm', 'brücke', 'palast', 'schloss', 'kathedrale', 'kirche', 'tempel', 'moschee', 'synagoge', 'platz', 'brunnen', 'statue'],
    restaurant: ['restaurant', 'café', 'bistro', 'pub', 'bar', 'tavern', 'diner', 'eatery', 'restaurante', 'café', 'bistró', 'pub', 'bar', 'taberna', 'comedor', 'restaurant', 'café', 'bistrot', 'pub', 'bar', 'taverne', 'restaurant', 'café', 'bistro', 'kneipe', 'bar', 'taverne'],
    hotel: ['hotel', 'hostel', 'inn', 'lodge', 'resort', 'guesthouse', 'hotel', 'hostal', 'posada', 'albergue', 'resort', 'casa de huéspedes', 'hôtel', 'auberge', 'gîte', 'résidence', 'hotel', 'herberge', 'gasthaus', 'pension', 'resort'],
    museum: ['museum', 'gallery', 'exhibition', 'museo', 'galería', 'exposición', 'musée', 'galerie', 'exposition', 'museum', 'galerie', 'ausstellung'],
    park: ['park', 'garden', 'botanical', 'zoo', 'aquarium', 'parque', 'jardín', 'botánico', 'zoológico', 'acuario', 'parc', 'jardin', 'botanique', 'zoo', 'aquarium', 'park', 'garten', 'botanischer', 'zoo', 'aquarium'],
    shopping: ['mall', 'market', 'shop', 'store', 'boutique', 'shopping', 'centro comercial', 'mercado', 'tienda', 'boutique', 'centre commercial', 'marché', 'magasin', 'boutique', 'einkaufszentrum', 'markt', 'geschäft', 'boutique'],
    transport: ['station', 'airport', 'port', 'terminal', 'metro', 'subway', 'bus', 'train', 'estación', 'aeropuerto', 'puerto', 'terminal', 'metro', 'autobús', 'tren', 'gare', 'aéroport', 'port', 'terminal', 'métro', 'bus', 'train', 'bahnhof', 'flughafen', 'hafen', 'terminal', 'u-bahn', 'bus', 'zug']
  };
  
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Check for POI types
    Object.entries(poiKeywords).forEach(([type, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerLine.includes(keyword)) {
          // Extract the POI name (usually after the keyword or in quotes)
          let poiName = line.trim();
          
          // Try to extract name from quotes
          const quoteMatch = line.match(/["""]([^"""]+)["""]/);
          if (quoteMatch) {
            poiName = quoteMatch[1];
          } else {
            // Try to extract name after common patterns
            const patterns = [
              /visit\s+(.+?)(?:\s|$|\.|,)/i,
              /see\s+(.+?)(?:\s|$|\.|,)/i,
              /go\s+to\s+(.+?)(?:\s|$|\.|,)/i,
              /check\s+out\s+(.+?)(?:\s|$|\.|,)/i,
              /explore\s+(.+?)(?:\s|$|\.|,)/i,
              /visit\s+(.+?)(?:\s|$|\.|,)/i,
              /visitar\s+(.+?)(?:\s|$|\.|,)/i,
              /ver\s+(.+?)(?:\s|$|\.|,)/i,
              /aller\s+à\s+(.+?)(?:\s|$|\.|,)/i,
              /visiter\s+(.+?)(?:\s|$|\.|,)/i,
              /besuchen\s+(.+?)(?:\s|$|\.|,)/i,
              /sehen\s+(.+?)(?:\s|$|\.|,)/i
            ];
            
            for (const pattern of patterns) {
              const match = line.match(pattern);
              if (match) {
                poiName = match[1].trim();
                break;
              }
            }
          }
          
          // Clean up the name
          poiName = poiName.replace(/^[•\-\*]\s*/, '').trim();
          
          if (poiName && poiName.length > 2 && poiName.length < 100) {
            pois.push({
              id: `${type}-${index}`,
              name: poiName,
              type: type,
              line: line.trim(),
              lineIndex: index
            });
          }
        }
      });
    });
  });
  
  // Remove duplicates based on name
  const uniquePois = pois.filter((poi, index, self) => 
    index === self.findIndex(p => p.name.toLowerCase() === poi.name.toLowerCase())
  );
  
  return uniquePois.slice(0, 10); // Limit to 10 POIs to avoid clutter
};

// Component to handle map updates when destination changes
function MapUpdater({ destination, coordinates, pois }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.lat && coordinates.lon) {
      const lat = parseFloat(coordinates.lat);
      const lon = parseFloat(coordinates.lon);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        // Calculate appropriate zoom based on POI count - improved zoom levels
        let zoom = 14; // Default zoom for just destination
        if (pois && pois.length > 0) {
          if (pois.length <= 3) {
            zoom = 15; // Very close zoom for few POIs
          } else if (pois.length <= 6) {
            zoom = 14; // Close zoom for moderate number of POIs
          } else if (pois.length <= 10) {
            zoom = 13; // Medium zoom for many POIs
          } else {
            zoom = 12; // Slightly wider zoom for very many POIs
          }
        }
        
        map.setView([lat, lon], zoom);
      }
    }
  }, [coordinates, pois, map]);
  
  return null;
}

const Map = ({ destination, coordinates, tripPlan, pois: externalPOIs, selectedPOI, highlightedPOI, onPOISelection, isRTL }) => {
  const { t } = useTranslation();
  const mapRef = useRef();
  // Add marker refs
  const markerRefs = useRef({});

  // Use external POIs from backend
  const pois = externalPOIs || [];

  // Default coordinates (world view)
  const defaultPosition = [20, 0];
  const defaultZoom = 2;

  // Check if we have valid coordinates
  const hasValidCoordinates = coordinates && 
    coordinates.lat && 
    coordinates.lon && 
    !isNaN(parseFloat(coordinates.lat)) && 
    !isNaN(parseFloat(coordinates.lon));

  const position = hasValidCoordinates 
    ? [parseFloat(coordinates.lat), parseFloat(coordinates.lon)]
    : defaultPosition;

  // Calculate appropriate zoom level based on POI count and distribution
  const calculateZoomLevel = () => {
    if (!hasValidCoordinates) return defaultZoom;
    
    if (pois.length === 0) {
      return 14; // Much closer zoom for just the destination
    }
    
    // Calculate zoom based on number of POIs - much closer zoom levels
    if (pois.length <= 3) {
      return 15; // Very close zoom for few POIs
    } else if (pois.length <= 6) {
      return 14; // Close zoom for moderate number of POIs
    } else if (pois.length <= 10) {
      return 13; // Medium zoom for many POIs
    } else {
      return 12; // Slightly wider zoom for very many POIs
    }
  };

  const zoom = calculateZoomLevel();

  // Calculate POI positions with better distribution
  const getPOIPositions = () => {
    if (!hasValidCoordinates || pois.length === 0) return [];
    
    const positions = [];
    const baseDistance = pois.length <= 3 ? 0.005 : 0.008; // Adjust distance based on POI count
    
    pois.forEach((poi, index) => {
      // Use a spiral pattern for better distribution
      const angle = (index * 137.5) * (Math.PI / 180); // Golden angle for better distribution
      const distance = baseDistance * (1 + index * 0.2); // Gradually increase distance
      
      const lat = position[0] + distance * Math.cos(angle);
      const lon = position[1] + distance * Math.sin(angle);
      
      positions.push({
        ...poi,
        position: [lat, lon]
      });
    });
    
    return positions;
  };

  const poiPositions = getPOIPositions();

  // Center and open popup for selectedPOI
  useEffect(() => {
    if (!selectedPOI || !markerRefs.current[selectedPOI.id]) return;
    const marker = markerRefs.current[selectedPOI.id];
    if (marker && marker._map) {
      marker._map.setView(marker.getLatLng(), marker._map.getZoom(), { animate: true });
      marker.openPopup();
    }
  }, [selectedPOI]);

  return (
    <div className={`map-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="map-header">
        <h3>{destination || t('map.worldMap')}</h3>
        {hasValidCoordinates && (
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
        <MapContainer
          ref={mapRef}
          center={position}
          zoom={zoom}
          className="map"
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Main destination marker */}
          {hasValidCoordinates && (
            <Marker position={position} icon={createCustomIcon('default')}>
              <Popup>
                <div className="marker-popup">
                  <h4>{destination}</h4>
                  <p>📍 {coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}</p>
                  {tripPlan && (
                    <div className="trip-summary">
                      <p><strong>{t('map.tripPlanGenerated')}</strong></p>
                      <p>{t('map.clickForDetails')}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* POI markers - positioned around the main destination */}
          {hasValidCoordinates && pois.length > 0 && poiPositions.map((poi, index) => {
            // Create links for different map services
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ', ' + destination)}`;
            const openStreetMapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(poi.name + ', ' + destination)}`;
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(poi.name + ', ' + destination)}&origin=${encodeURIComponent(destination)}`;
            
            // Check if this POI is selected/highlighted
            const isSelected = highlightedPOI === poi.id;
            
            return (
              <Marker 
                key={poi.id} 
                position={poi.position} 
                icon={createCustomIcon(poi.type)}
                eventHandlers={{
                  click: () => {
                    if (onPOISelection) {
                      onPOISelection(poi);
                    }
                  }
                }}
                ref={ref => { if (ref) markerRefs.current[poi.id] = ref; }}
              >
                <Popup>
                  <div className={`marker-popup poi-popup ${isSelected ? 'selected' : ''}`}>
                    <h4>{poi.name}</h4>
                    <p className="poi-type">{t(`map.poiTypes.${poi.type}`)}</p>
                    <p className="poi-context">{poi.line || poi.context}</p>
                    {isSelected && (
                      <div className="poi-selected-indicator">
                        <span>📍 {t('map.selectedPOI')}</span>
                      </div>
                    )}
                    <div className="poi-links">
                      <a 
                        href={googleMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="poi-link google-maps"
                      >
                        🔍 {t('map.viewOnGoogleMaps')}
                      </a>
                      <a 
                        href={directionsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="poi-link directions"
                      >
                        🗺️ {t('map.getDirections')}
                      </a>
                      <a 
                        href={openStreetMapUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="poi-link openstreetmap"
                      >
                        🌐 {t('map.viewOnOSM')}
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          <MapUpdater destination={destination} coordinates={coordinates} pois={pois} />
        </MapContainer>
      </div>
      
      {!hasValidCoordinates && (
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