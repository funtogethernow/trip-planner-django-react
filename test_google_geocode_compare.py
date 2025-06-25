import os
import requests
from urllib.parse import quote

GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

POIS = [
    {"name": "John F. Kennedy International Airport", "backend": (40.6446124, -73.7797278)},
    {"name": "The Plaza Hotel", "backend": (40.7646318, -73.9743251)},
    {"name": "Pod 39 Hotel", "backend": (40.7493602, -73.9765358)},
    {"name": "Central Park", "backend": (40.7987768, -73.9537196)},
    {"name": "Serafina Broadway", "backend": (40.7644424, -73.9821126)},
    {"name": "Statue of Liberty", "backend": (40.6892494, -74.04450039999999)},
    {"name": "9/11 Memorial & Museum", "backend": (40.7115776, -74.0133362)},
    {"name": "The River Café", "backend": (40.7038342, -73.9947936)},
    {"name": "The Metropolitan Museum of Art", "backend": (40.7127753, -74.0059728)},
    {"name": "The Museum of Modern Art (MoMA)", "backend": (40.7614327, -73.97762159999999)},
    {"name": "Le Bernardin", "backend": (40.7614218, -73.9817558)},
    {"name": "Fifth Avenue", "backend": (40.7744123, -73.9656103)},
    {"name": "Eataly NYC Flatiron", "backend": (40.742045, -73.9900845)},
    {"name": "Theater District", "backend": (40.759011, -73.9844722)},
    {"name": "Bubby's Tribeca", "backend": (40.719819, -74.0083829)},
]

if not GOOGLE_MAPS_API_KEY:
    print("GOOGLE_MAPS_API_KEY not set in environment.")
    exit(1)

def geocode(poi_name):
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={quote(poi_name + ', New York City')}&key={GOOGLE_MAPS_API_KEY}"
    resp = requests.get(url)
    data = resp.json()
    if data['status'] == 'OK':
        loc = data['results'][0]['geometry']['location']
        return loc['lat'], loc['lng']
    else:
        return None, None

def main():
    print(f"{'POI':40} | {'Backend':30} | {'Google Geocode':30} | {'Delta'}")
    print('-'*120)
    for poi in POIS:
        backend_lat, backend_lng = poi['backend']
        g_lat, g_lng = geocode(poi['name'])
        if g_lat is not None:
            delta = ((backend_lat-g_lat)**2 + (backend_lng-g_lng)**2)**0.5
            print(f"{poi['name'][:38]:40} | ({backend_lat:.6f}, {backend_lng:.6f}) | ({g_lat:.6f}, {g_lng:.6f}) | {delta:.6f}")
        else:
            print(f"{poi['name'][:38]:40} | ({backend_lat:.6f}, {backend_lng:.6f}) | (None, None)         | N/A")

if __name__ == "__main__":
    main() 