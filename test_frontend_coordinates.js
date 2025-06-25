// Test script to verify frontend coordinate handling
const testPOIs = [
  {
    "id": 1,
    "name": "John F. Kennedy International Airport",
    "type": "transport",
    "keyword": "John F. Kennedy International Airport",
    "line": "  - Arrive at <poi type=\"transport\" name=\"John F. Kennedy International Airport\" icon=\"✈️\">John F. Kennedy International Airport</poi>.",
    "line_index": 4,
    "context": "  - Arrive at <poi type=\"transport\" name=\"John F. Kennedy International Airport\" icon=\"✈️\">John F. Kennedy International Airport</poi>.",
    "icon": "✈️",
    "coordinates": {
      "lat": 40.6446124,
      "lng": -73.7797278
    }
  },
  {
    "id": 2,
    "name": "The Plaza Hotel",
    "type": "hotel",
    "keyword": "The Plaza Hotel",
    "line": "Consider staying at <poi type=\"hotel\" name=\"The Plaza Hotel\" icon=\"🏨\">The Plaza Hotel</poi>.",
    "line_index": 4,
    "context": "Consider staying at <poi type=\"hotel\" name=\"The Plaza Hotel\" icon=\"🏨\">The Plaza Hotel</poi>.",
    "icon": "🏨",
    "coordinates": {
      "lat": 40.7646318,
      "lng": -73.9743251
    }
  }
];

// Simulate the frontend coordinate handling logic
function testCoordinateHandling(pois) {
  console.log('Testing coordinate handling for POIs:');
  
  pois.forEach((poi, index) => {
    console.log(`\nPOI ${index + 1}: ${poi.name}`);
    console.log(`Type: ${poi.type}`);
    console.log(`Raw coordinates:`, poi.coordinates);
    
    if (poi.coordinates && poi.coordinates.lat && poi.coordinates.lng) {
      const lat = parseFloat(poi.coordinates.lat);
      const lng = parseFloat(poi.coordinates.lng);
      
      console.log(`Parsed coordinates: lat=${lat}, lng=${lng}`);
      console.log(`Coordinate type check: lat=${typeof lat}, lng=${typeof lng}`);
      
      // Check if coordinates are valid
      if (isNaN(lat) || isNaN(lng)) {
        console.log('❌ ERROR: Invalid coordinates (NaN)');
      } else if (lat < -90 || lat > 90) {
        console.log('❌ ERROR: Invalid latitude (must be between -90 and 90)');
      } else if (lng < -180 || lng > 180) {
        console.log('❌ ERROR: Invalid longitude (must be between -180 and 180)');
      } else {
        console.log('✅ Coordinates are valid');
      }
    } else {
      console.log('❌ ERROR: Missing or invalid coordinates structure');
    }
  });
}

// Test the coordinate handling
testCoordinateHandling(testPOIs);

// Test with some edge cases
console.log('\n\nTesting edge cases:');
const edgeCases = [
  { name: "String coordinates", coordinates: { lat: "40.6446124", lng: "-73.7797278" } },
  { name: "Missing coordinates", coordinates: null },
  { name: "Empty coordinates", coordinates: {} },
  { name: "Invalid lat", coordinates: { lat: "invalid", lng: -73.7797278 } },
  { name: "Invalid lng", coordinates: { lat: 40.6446124, lng: "invalid" } }
];

edgeCases.forEach((testCase, index) => {
  console.log(`\nEdge case ${index + 1}: ${testCase.name}`);
  console.log(`Coordinates:`, testCase.coordinates);
  
  if (testCase.coordinates && testCase.coordinates.lat && testCase.coordinates.lng) {
    const lat = parseFloat(testCase.coordinates.lat);
    const lng = parseFloat(testCase.coordinates.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.log('❌ Invalid coordinates (NaN)');
    } else {
      console.log('✅ Valid coordinates');
    }
  } else {
    console.log('❌ Missing coordinates');
  }
}); 