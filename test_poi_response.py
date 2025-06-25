#!/usr/bin/env python3
"""
Test script to check POI response structure from backend
"""

import requests
import json

def test_poi_response():
    """Test POI response structure for New York City"""
    
    # Test data
    test_data = {
        "destination": "New York City",
        "start_date": "2024-01-15", 
        "end_date": "2024-01-20",
        "interests": ["culture", "food"],
        "budget": "medium"
    }
    
    print("Testing POI response structure for New York City...")
    print("=" * 60)
    
    try:
        # Make request to backend
        response = requests.post(
            'http://localhost:8000/api/plan-trip/',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ Backend response successful")
            print(f"Destination: {data.get('destination')}")
            print(f"Coordinates: {data.get('coordinates')}")
            
            # Check POIs
            pois = data.get('pois', [])
            print(f"\n📍 POIs found: {len(pois)}")
            
            if pois:
                print("\nPOI Details:")
                for i, poi in enumerate(pois, 1):
                    print(f"\n{i}. {poi.get('name', 'N/A')}")
                    print(f"   Type: {poi.get('type', 'N/A')}")
                    print(f"   ID: {poi.get('id', 'N/A')}")
                    print(f"   Icon: {poi.get('icon', 'N/A')}")
                    print(f"   Coordinates: {poi.get('coordinates', 'N/A')}")
                    print(f"   Keyword: {poi.get('keyword', 'N/A')}")
                    print(f"   Context: {poi.get('context', 'N/A')[:100]}...")
                    
                    # Check if coordinates are valid
                    coords = poi.get('coordinates')
                    if coords and isinstance(coords, dict):
                        lat = coords.get('lat')
                        lng = coords.get('lng')
                        if lat is not None and lng is not None:
                            print(f"   ✅ Valid coordinates: {lat}, {lng}")
                        else:
                            print(f"   ❌ Invalid coordinates: {coords}")
                    else:
                        print(f"   ❌ No coordinates: {coords}")
            else:
                print("❌ No POIs found in response")
                
            # Check trip plan for POI tags
            plan = data.get('plan', '')
            if plan:
                print(f"\n📋 Trip plan length: {len(plan)} characters")
                
                # Count POI tags
                poi_tags = plan.count('<poi')
                print(f"POI tags in plan: {poi_tags}")
                
                # Show first few POI tags
                import re
                poi_matches = re.findall(r'<poi[^>]*>([^<]+)</poi>', plan)
                if poi_matches:
                    print(f"First 5 POI matches: {poi_matches[:5]}")
                else:
                    print("No POI tags found in plan")
        else:
            print(f"❌ Backend error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_poi_response() 