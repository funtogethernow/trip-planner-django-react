import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DateRangePicker from './DateRangePicker';
import LanguageSelector from './LanguageSelector';
import Map from './Map';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [tripPlan, setTripPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Destination suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // POI selection state for linking text and map
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [highlightedPOI, setHighlightedPOI] = useState(null);
  const [pois, setPOIs] = useState([]);

  
  // Check if current language is RTL
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  // Update HTML lang attribute and direction when language changes
  useEffect(() => {
    document.documentElement.lang = i18n.language || 'en';
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    
    // Update document title
    document.title = t('app.title');
  }, [i18n.language, isRTL, t]);

  // Listen for i18n language changes
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setSelectedLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const handleDateChange = (newStartDate, newEndDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    
    // Update URL with language parameter
    const url = new URL(window.location);
    url.searchParams.set('lng', newLanguage);
    window.history.replaceState({}, '', url);
  };

  // Destination suggestion functionality
  const searchDestinations = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionLoading(true);
    try {
      // Use Google Maps Geocoding API instead of OpenStreetMap
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&language=${selectedLanguage}&types=geocode`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        const formattedSuggestions = data.results.slice(0, 5).map(item => {
          const addressComponents = item.address_components;
          let country = '', state = '', city = '';
          
          addressComponents.forEach(component => {
            if (component.types.includes('country')) {
              country = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            } else if (component.types.includes('locality')) {
              city = component.long_name;
            }
          });
          
          return {
            display_name: item.formatted_address,
            name: item.formatted_address.split(',')[0],
            country,
            state,
            city,
            lat: item.geometry.location.lat,
            lon: item.geometry.location.lng,
            type: 'geocode'
          };
        });
        
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    
    // Debounce the search
    clearTimeout(window.suggestionTimeout);
    window.suggestionTimeout = setTimeout(() => {
      searchDestinations(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setDestination(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) {
      alert(t('form.validation.allFieldsRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setTripPlan(null);
    setPOIs([]);
    console.log('[NEW TRIP] Clearing highlightedPOI when planning new trip');
    clearPOISelection();

    try {
      const response = await fetch('/api/plan-trip/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': selectedLanguage,
        },
        body: JSON.stringify({
          destination,
          start_date: startDate,
          end_date: endDate,
          language: selectedLanguage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTripPlan(data);
      
      // Use POIs from backend response
      const backendPOIs = data.pois || [];
      setPOIs(backendPOIs);
      
    } catch (err) {
      console.error('Error planning trip:', err);
      setError(t('form.error.general'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle POI selection from map
  const handleMapPOISelection = useCallback((poi) => {
    console.log('[MAP SELECTION] Setting highlightedPOI to:', poi.id, 'from map selection');
    setSelectedPOI(poi);
    setHighlightedPOI(poi.id);
  }, []);

  // Clear POI selection
  const clearPOISelection = () => {
    console.log('[CLEAR SELECTION] Setting highlightedPOI to null');
    setSelectedPOI(null);
    setHighlightedPOI(null);
  };

  return (
    <div className={`App ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="app-container">
        <div className="app-content">
          <header className="App-header">
            <h1>{t('app.title')}</h1>
            <p className="app-subtitle">{t('app.subtitle')}</p>
            
            <form onSubmit={handleSubmit} className="trip-form">
              <div className="form-group">
                <label htmlFor="destination">{t('app.destination')}</label>
                <div className="destination-input-container">
                  <input
                    id="destination"
                    type="text"
                    placeholder={t('app.destinationPlaceholder')}
                    value={destination}
                    onChange={handleDestinationChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    required
                    aria-label={t('app.destination')}
                    dir="auto" // Auto-detect text direction
                    autoComplete="off"
                  />
                  {suggestionLoading && (
                    <div className="suggestion-loading">
                      <div className="loading-spinner-small"></div>
                    </div>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="suggestion-name">{suggestion.name}</div>
                          <div className="suggestion-details">
                            {suggestion.city && suggestion.city !== suggestion.name && `${suggestion.city}, `}
                            {suggestion.state && `${suggestion.state}, `}
                            {suggestion.country}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
                startDateLabel={t('app.startDate')}
                endDateLabel={t('app.endDate')}
                startDatePlaceholder={t('app.startDatePlaceholder')}
                endDatePlaceholder={t('app.endDatePlaceholder')}
                clearText={t('calendar.clear')}
                closeText={t('calendar.close')}
                prevMonthText={t('calendar.previousMonth')}
                nextMonthText={t('calendar.nextMonth')}
                isRTL={isRTL}
              />
              
              <div className="form-group">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={handleLanguageChange}
                  label={t('app.language')}
                  isRTL={isRTL}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || !startDate || !endDate || !destination}
                className="submit-button"
              >
                {loading ? (
                  <span>
                    <span className="loading-spinner"></span>
                    {t('app.planning')}
                  </span>
                ) : (
                  t('app.planTrip')
                )}
              </button>
            </form>
            
            {error && (
              <div className="error-message" role="alert">
                <p>{t('app.error')}: {error}</p>
              </div>
            )}
            
            {tripPlan && (
              <div className="trip-result">
                <h2>{t('app.tripPlanFor')} {tripPlan.destination}</h2>
                <div className="trip-details">
                  <p><strong>{t('app.coordinates')}:</strong> {tripPlan.coordinates.lat}, {tripPlan.coordinates.lon}</p>
                  <p><strong>{t('app.duration')}:</strong> {formatDate(startDate)} - {formatDate(endDate)}</p>
                </div>
                <div className="trip-plan">
                  <h3>{t('app.itinerary')}</h3>
                  <div className="plan-content" dir="auto">
                    {tripPlan.plan.split('\n').map((line, lineIndex) => {
                      // Check if this line contains any POIs by looking for POI tags
                      const poiTags = line.match(/<poi[^>]*>/g);
                      
                      if (poiTags) {
                        // Extract POI information from tags using a unified approach
                        const linePOIs = [];
                        // Updated regex that handles POI tags with IDs
                        const poiMatches = line.match(/<poi\s+id="([^"]+)"\s+type="([^"]+)"\s+name="([^"]+)"(?:\s+icon="([^"]+)")?>([^<]+)<\/poi>/g);
                        
                        if (poiMatches) {
                          let currentPosition = 0;
                          poiMatches.forEach((match, index) => {
                            const idMatch = match.match(/id="([^"]+)"/);
                            const typeMatch = match.match(/type="([^"]+)"/);
                            const nameMatch = match.match(/name="([^"]+)"/);
                            const iconMatch = match.match(/icon="([^"]+)"/);
                            const textMatch = match.match(/>([^<]+)</);
                            
                            if (idMatch && typeMatch && nameMatch && textMatch) {
                              const poiId = parseInt(idMatch[1]);
                              const poiType = typeMatch[1];
                              const poiName = nameMatch[1];
                              const poiIcon = iconMatch ? iconMatch[1] : '📍'; // Default icon if not provided
                              const poiText = textMatch[1];
                              
                              // Find the POI by ID directly - much simpler!
                              const poi = pois.find(p => p.id === poiId);
                              
                              if (poi) {
                                // Find the actual position of this specific POI in the line
                                const matchStartIndex = line.indexOf(match, currentPosition);
                                linePOIs.push({ 
                                  ...poi, 
                                  icon: poiIcon, 
                                  originalMatch: match, 
                                  poiText,
                                  matchIndex: index,
                                  startIndex: matchStartIndex,
                                  lineIndex: lineIndex, // Add line index for better identification
                                  uniqueId: poiId // Use the POI ID as unique identifier
                                });
                                // Update position for next search
                                currentPosition = matchStartIndex + match.length;
                              } else {
                                // POI not found in backend data
                              }
                            }
                          });
                        }
                        
                        if (linePOIs.length > 0) {
                          // Sort POIs by their position in the line
                          linePOIs.sort((a, b) => a.startIndex - b.startIndex);
                          
                          // Create React elements in the correct order
                          const lineParts = [];
                          let currentLine = line;
                          let offset = 0;
                          
                          linePOIs.forEach((poi, poiIndex) => {
                            const parts = currentLine.split(poi.originalMatch);
                            if (parts.length === 2) {
                              // Add text before POI
                              if (parts[0]) {
                                lineParts.push(parts[0]);
                              }
                              
                              // Add POI element with unique key and isolated event handler
                              const isHighlighted = highlightedPOI === poi.id;
                              const uniqueKey = `poi-${poi.id}-${lineIndex}-${poiIndex}-${poi.name}-${poi.startIndex}`;
                              
                              lineParts.push(
                                <span 
                                  key={uniqueKey}
                                  className={`poi-highlight ${isHighlighted ? 'poi-selected' : ''}`}
                                  data-poi-id={poi.id}
                                  data-poi-name={poi.name}
                                  data-poi-index={poiIndex}
                                  data-poi-start-index={poi.startIndex}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    console.log('[PLAN BOX] POI clicked:', poi);
                                    console.log('[PLAN BOX] Clicked POI details:', {
                                      id: poi.id,
                                      name: poi.name,
                                      type: poi.type,
                                      startIndex: poi.startIndex,
                                      lineIndex: poi.lineIndex,
                                      matchIndex: poi.matchIndex
                                    });
                                    // Use setTimeout to ensure this is the only event being processed
                                    setTimeout(() => {
                                      console.log('[PLAN CLICK] Setting highlightedPOI to:', poi.id, 'from plan text click');
                                      setSelectedPOI(poi);
                                      setHighlightedPOI(poi.id);
                                      console.log('[MAP] Highlighting POI on map:', poi);
                                    }, 0);
                                  }}
                                >
                                  {poi.icon || '📍'} {poi.poiText}
                                </span>
                              );
                              
                              // Update current line to remaining text
                              currentLine = parts[1];
                            }
                          });
                          
                          // Add any remaining text
                          if (currentLine) {
                            lineParts.push(currentLine);
                          }
                          
                          return (
                            <p key={lineIndex} className="poi-line">
                              {lineParts}
                            </p>
                          );
                        }
                      }
                      
                      // Return regular line without POI tags (strip any remaining tags)
                      const cleanLine = line.replace(/<poi[^>]*>([^<]+)<\/poi>/g, '$1');
                      return <p key={lineIndex}>{cleanLine}</p>;
                    })}
                  </div>
                </div>
                <button 
                  onClick={() => setTripPlan(null)}
                  className="new-plan-button"
                >
                  {t('app.createNewPlan')}
                </button>
              </div>
            )}
          </header>
        </div>
        
        <div className="map-section">
          <div className="destination-map-container">
            <div className="map-container">
              <Map 
                destination={destination}
                coordinates={tripPlan?.coordinates}
                tripPlan={tripPlan}
                pois={pois}
                selectedPOI={selectedPOI}
                highlightedPOI={highlightedPOI}
                onPOISelection={handleMapPOISelection}
                isRTL={isRTL}
              />
            </div>
          </div>
        </div>
      </div>

      {/* POI Selection Indicator */}
      {selectedPOI && (
        <div className="poi-selection-indicator">
          <button className="close-btn" onClick={clearPOISelection}>×</button>
          <div className="poi-indicator-header">
            <span className="poi-indicator-icon">{selectedPOI.icon || '📍'}</span>
            <h4>{selectedPOI.name}</h4>
          </div>
          <p>{selectedPOI.context}</p>
        </div>
      )}
    </div>
  );
}

export default App;
