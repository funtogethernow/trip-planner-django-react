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
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=${selectedLanguage}`);
      const data = await response.json();
      
      const formattedSuggestions = data.map(item => ({
        display_name: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        country: item.address?.country || '',
        state: item.address?.state || '',
        city: item.address?.city || item.address?.town || '',
        lat: item.lat,
        lon: item.lon,
        type: item.type
      }));
      
      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
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
      console.log('Backend POIs received:', backendPOIs);
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
    setSelectedPOI(poi);
    setHighlightedPOI(poi.id);
  }, []);

  // Clear POI selection
  const clearPOISelection = () => {
    setSelectedPOI(null);
    setHighlightedPOI(null);
  };

  // Set up global POI click handler
  useEffect(() => {
    window.handlePOIClick = (poiId) => {
      const poi = pois.find(p => p.id === poiId);
      if (poi) {
        console.log(`🎯 POI clicked: ${poi.name} (ID: ${poi.id})`);
        // Use the same handler that the map uses
        handleMapPOISelection(poi);
      } else {
        console.log(`❌ POI not found for ID: ${poiId}`);
      }
    };

    return () => {
      delete window.handlePOIClick;
    };
  }, [pois, handleMapPOISelection]);

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
                      // Strip POI tags from display text
                      const displayLine = line.replace(/<poi[^>]*>([^<]+)<\/poi>/g, '$1');
                      
                      // Check if this line contains any POIs by looking for POI tags
                      const poiTags = line.match(/<poi[^>]*>/g);
                      
                      if (poiTags) {
                        // Extract POI information from tags
                        const linePOIs = [];
                        const poiMatches = line.match(/<poi\s+type="([^"]+)"\s+name="([^"]+)">([^<]+)<\/poi>/g);
                        
                        if (poiMatches) {
                          poiMatches.forEach((match, index) => {
                            const typeMatch = match.match(/type="([^"]+)"/);
                            const nameMatch = match.match(/name="([^"]+)"/);
                            const textMatch = match.match(/>([^<]+)</);
                            
                            if (typeMatch && nameMatch && textMatch) {
                              const poiType = typeMatch[1];
                              const poiName = nameMatch[1];
                              const poiText = textMatch[1];
                              
                              // Find corresponding POI in the pois array
                              // Try exact name and type match first (most reliable)
                              let poi = pois.find(p => p.name === poiName && p.type === poiType);
                              
                              // If no match, try matching by keyword (text content)
                              if (!poi) {
                                poi = pois.find(p => p.keyword === poiText);
                              }
                              
                              // If still no match, try case-insensitive name matching
                              if (!poi) {
                                poi = pois.find(p => 
                                  p.name.toLowerCase() === poiName.toLowerCase() ||
                                  p.keyword.toLowerCase() === poiText.toLowerCase()
                                );
                              }
                              
                              if (poi) {
                                linePOIs.push(poi);
                                console.log(`✅ Matched POI: ${poiName} (${poiType}) -> ${poi.name} (ID: ${poi.id})`);
                              } else {
                                // Debug: log unmatched POIs
                                console.log('❌ Unmatched POI:', { 
                                  poiType, 
                                  poiName, 
                                  poiText, 
                                  availablePOIs: pois.map(p => ({ 
                                    id: p.id,
                                    name: p.name, 
                                    type: p.type, 
                                    keyword: p.keyword 
                                  })) 
                                });
                              }
                            }
                          });
                        }
                        
                        if (linePOIs.length > 0) {
                          // Highlight POIs in the display text
                          let highlightedLine = displayLine;
                          linePOIs.forEach(poi => {
                            const poiRegex = new RegExp(`(${poi.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                            highlightedLine = highlightedLine.replace(poiRegex, (match, poiText) => {
                              const isHighlighted = highlightedPOI === poi.id;
                              return `<span class="poi-highlight ${isHighlighted ? 'poi-selected' : ''}" data-poi-id="${poi.id}" onclick="window.handlePOIClick(${poi.id})">${poiText}</span>`;
                            });
                          });
                          
                          return (
                            <p 
                              key={lineIndex} 
                              dangerouslySetInnerHTML={{ __html: highlightedLine }}
                              className="poi-line"
                            />
                          );
                        }
                      }
                      
                      // Return regular line without POI tags
                      return <p key={lineIndex}>{displayLine}</p>;
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
          <h4>{selectedPOI.name}</h4>
          <p>{selectedPOI.context}</p>
        </div>
      )}
    </div>
  );
}

export default App;
