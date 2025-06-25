// Test script to debug POI matching logic
const testPOIMatching = () => {
  // Simulate backend POI data
  const backendPOIs = [
    {
      "id": 1,
      "name": "John F. Kennedy International Airport",
      "type": "transport",
      "keyword": "John F. Kennedy International Airport",
      "icon": "✈️",
      "coordinates": {
        "lat": 40.6446124,
        "lng": -73.7797278
      }
    },
    {
      "id": 2,
      "name": "Pod 39 Hotel",
      "type": "hotel",
      "keyword": "Pod 39 Hotel",
      "icon": "🏨",
      "coordinates": {
        "lat": 40.7493602,
        "lng": -73.9765358
      }
    },
    {
      "id": 3,
      "name": "The Plaza Hotel",
      "type": "hotel",
      "keyword": "The Plaza Hotel",
      "icon": "🏨",
      "coordinates": {
        "lat": 40.7646318,
        "lng": -73.9743251
      }
    }
  ];

  // Simulate POI tags from trip plan
  const poiTags = [
    { type: "transport", name: "John F. Kennedy International Airport", icon: "✈️" },
    { type: "hotel", name: "Pod 39 Hotel", icon: "🏨" },
    { type: "hotel", name: "The Plaza Hotel", icon: "🏨" }
  ];

  console.log("🔍 Testing POI matching logic...");
  console.log("=" * 50);
  
  console.log("Backend POIs:", backendPOIs.length);
  backendPOIs.forEach(poi => {
    console.log(`  - ${poi.name} (${poi.type})`);
  });
  
  console.log("\nPOI Tags:", poiTags.length);
  poiTags.forEach(tag => {
    console.log(`  - ${tag.name} (${tag.type})`);
  });

  console.log("\n🔍 Testing matches:");
  
  poiTags.forEach((tag, index) => {
    console.log(`\n${index + 1}. Looking for: ${tag.name} (${tag.type})`);
    
    // Test exact match
    const exactMatch = backendPOIs.find(p => p.name === tag.name && p.type === tag.type);
    if (exactMatch) {
      console.log(`   ✅ Exact match found: ${exactMatch.name} (ID: ${exactMatch.id})`);
    } else {
      console.log(`   ❌ No exact match found`);
      
      // Test partial matches
      const partialMatches = backendPOIs.filter(p => 
        p.name.includes(tag.name) || tag.name.includes(p.name)
      );
      if (partialMatches.length > 0) {
        console.log(`   🔍 Partial matches found:`);
        partialMatches.forEach(match => {
          console.log(`      - ${match.name} (${match.type})`);
        });
      }
      
      // Test type-only matches
      const typeMatches = backendPOIs.filter(p => p.type === tag.type);
      if (typeMatches.length > 0) {
        console.log(`   🔍 Type matches for ${tag.type}:`);
        typeMatches.forEach(match => {
          console.log(`      - ${match.name}`);
        });
      }
    }
  });

  console.log("\n🎯 Summary:");
  const successfulMatches = poiTags.filter(tag => 
    backendPOIs.find(p => p.name === tag.name && p.type === tag.type)
  );
  console.log(`Successful matches: ${successfulMatches.length}/${poiTags.length}`);
  
  if (successfulMatches.length < poiTags.length) {
    console.log("❌ Some POIs couldn't be matched!");
  } else {
    console.log("✅ All POIs matched successfully!");
  }
};

// Run the test
testPOIMatching(); 