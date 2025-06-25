#!/usr/bin/env python3
"""
Test script to verify coordinate accuracy for POIs
"""

import requests
import json
import time

def test_poi_coordinates():
    """Test POI coordinates for New York City"""
    
    # Test data
    test_data = {
        "destination": "New York City",
        "start_date": "2024-01-15", 
        "end_date": "2024-01-20",
        "interests": ["culture", "food"],
        "budget": "medium"
    }
    
    print("Testing POI coordinates for New York City...")
    print("=" * 60)
    
    try:
        # Make request to backend
        response = requests.post(
            'http://localhost:8000/api/plan-trip/',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return
        
        data = response.json()
        pois = data.get('pois', [])
        
        if not pois:
            print("❌ No POIs returned")
            return
        
        print(f"✅ Found {len(pois)} POIs")
        print()
        
        # Known coordinates for verification
        known_locations = {
            "John F. Kennedy International Airport": {
                "expected": {"lat": 40.6413, "lng": -73.7781},
                "tolerance": 0.01  # ~1km tolerance
            },
            "The Plaza Hotel": {
                "expected": {"lat": 40.7645, "lng": -73.9740},
                "tolerance": 0.01
            },
            "Times Square": {
                "expected": {"lat": 40.7580, "lng": -73.9855},
                "tolerance": 0.01
            },
            "Central Park": {
                "expected": {"lat": 40.7829, "lng": -73.9654},
                "tolerance": 0.01
            },
            "Statue of Liberty": {
                "expected": {"lat": 40.6892, "lng": -74.0445},
                "tolerance": 0.01
            }
        }
        
        for poi in pois:
            print(f"📍 {poi['name']}")
            print(f"   Type: {poi['type']}")
            print(f"   Coordinates: {poi.get('coordinates', 'None')}")
            
            if poi.get('coordinates'):
                lat = poi['coordinates']['lat']
                lng = poi['coordinates']['lng']
                
                # Check if this POI matches any known location
                matched_location = None
                for known_name, known_data in known_locations.items():
                    if known_name.lower() in poi['name'].lower():
                        matched_location = known_data
                        break
                
                if matched_location:
                    expected = matched_location['expected']
                    tolerance = matched_location['tolerance']
                    
                    lat_diff = abs(lat - expected['lat'])
                    lng_diff = abs(lng - expected['lng'])
                    
                    if lat_diff <= tolerance and lng_diff <= tolerance:
                        print(f"   ✅ ACCURATE - Matches known location")
                        print(f"      Expected: {expected['lat']:.6f}, {expected['lng']:.6f}")
                        print(f"      Actual:   {lat:.6f}, {lng:.6f}")
                        print(f"      Diff:     {lat_diff:.6f}, {lng_diff:.6f}")
                    else:
                        print(f"   ⚠️  INACCURATE - Outside tolerance")
                        print(f"      Expected: {expected['lat']:.6f}, {expected['lng']:.6f}")
                        print(f"      Actual:   {lat:.6f}, {lng:.6f}")
                        print(f"      Diff:     {lat_diff:.6f}, {lng_diff:.6f}")
                        print(f"      Tolerance: {tolerance}")
                else:
                    print(f"   ℹ️  No known reference for comparison")
                
                # Check if coordinates are in reasonable range for NYC
                if 40.4 <= lat <= 41.0 and -74.3 <= lng <= -73.5:
                    print(f"   ✅ Coordinates are in NYC area")
                else:
                    print(f"   ⚠️  Coordinates are outside NYC area")
            
            print()
        
        # Summary
        print("=" * 60)
        print("SUMMARY:")
        print(f"Total POIs: {len(pois)}")
        
        pois_with_coords = [p for p in pois if p.get('coordinates')]
        print(f"POIs with coordinates: {len(pois_with_coords)}")
        
        pois_in_nyc = [p for p in pois_with_coords 
                      if 40.4 <= p['coordinates']['lat'] <= 41.0 
                      and -74.3 <= p['coordinates']['lng'] <= -73.5]
        print(f"POIs in NYC area: {len(pois_in_nyc)}")
        
        if len(pois_with_coords) > 0:
            accuracy_rate = len(pois_in_nyc) / len(pois_with_coords) * 100
            print(f"Accuracy rate: {accuracy_rate:.1f}%")
        
    except Exception as e:
        print(f"❌ Error testing coordinates: {e}")

if __name__ == "__main__":
    test_poi_coordinates() 