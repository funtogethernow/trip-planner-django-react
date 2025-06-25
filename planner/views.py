from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django.conf import settings
from openai import OpenAI
import os
import requests
import json
import logging
import re

# Set up logging
logger = logging.getLogger(__name__)

# Define Google Maps API key at module level
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'YOUR_GOOGLE_MAPS_API_KEY')

def geocode_with_google_maps(destination):
    """
    Geocode destination using Google Maps Geocoding API
    """
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': destination,
            'key': GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] == 'OK' and data['results']:
            result = data['results'][0]
            location = result['geometry']['location']
            
            return {
                'latitude': location['lat'],
                'longitude': location['lng'],
                'address': result['formatted_address'],
                'raw': result
            }
        else:
            logger.error(f"Google Maps geocoding failed for '{destination}': {data.get('status')} - {data.get('error_message', 'Unknown error')}")
            return None
            
    except requests.RequestException as e:
        logger.error(f"Google Maps API request error for destination '{destination}': {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in Google Maps geocoding for destination '{destination}': {str(e)}")
        return None

def extract_pois_from_plan(plan_text, language='en', destination=None):
    """
    Extract Points of Interest from the trip plan text using OpenAI-generated POI tags.
    Returns a list of POI objects with id, name, type, context info, and generated icon.
    Also replaces the POI tags in the plan text with ones that include the POI ID.
    """
    pois = []
    poi_id = 1
    modified_plan = plan_text
    
    # First try the new format with icons
    poi_pattern = r'<poi\s+type="([^"]+)"\s+name="([^"]+)"\s+icon="([^"]+)">([^<]+)</poi>'
    matches = re.findall(poi_pattern, plan_text)
    
    if matches:
        # New format with icons found
        for match in matches:
            poi_type, poi_name, poi_icon, poi_text = match
            poi_object = create_poi_object(poi_id, poi_name, poi_type, poi_text, plan_text, poi_icon, destination)
            pois.append(poi_object)
            
            # Replace the original tag with one that includes the POI ID
            original_tag = f'<poi type="{poi_type}" name="{poi_name}" icon="{poi_icon}">{poi_text}</poi>'
            new_tag = f'<poi id="{poi_id}" type="{poi_type}" name="{poi_name}" icon="{poi_icon}">{poi_text}</poi>'
            modified_plan = modified_plan.replace(original_tag, new_tag, 1)  # Replace only the first occurrence
            
            poi_id += 1
    else:
        # Fallback to old format without icons
        poi_pattern_old = r'<poi\s+type="([^"]+)"\s+name="([^"]+)">([^<]+)</poi>'
        matches_old = re.findall(poi_pattern_old, plan_text)
        
        if matches_old:
            for match in matches_old:
                poi_type, poi_name, poi_text = match
                # Generate fallback icon
                fallback_icon = get_fallback_icon(poi_name, poi_type)
                poi_object = create_poi_object(poi_id, poi_name, poi_type, poi_text, plan_text, fallback_icon, destination)
                pois.append(poi_object)
                
                # Replace the original tag with one that includes the POI ID and icon
                original_tag = f'<poi type="{poi_type}" name="{poi_name}">{poi_text}</poi>'
                new_tag = f'<poi id="{poi_id}" type="{poi_type}" name="{poi_name}" icon="{fallback_icon}">{poi_text}</poi>'
                modified_plan = modified_plan.replace(original_tag, new_tag, 1)  # Replace only the first occurrence
                
                poi_id += 1
    
    # Remove duplicates based on name
    unique_pois = []
    seen_names = set()
    for poi in pois:
        if poi['name'].lower() not in seen_names:
            unique_pois.append(poi)
            seen_names.add(poi['name'].lower())
    
    return unique_pois, modified_plan

def create_poi_object(poi_id, poi_name, poi_type, poi_text, plan_text, icon, destination=None):
    """Create a POI object with all necessary fields."""
    # Find the line containing this POI
    lines = plan_text.split('\n')
    line_index = -1
    for i, line in enumerate(lines):
        if poi_text in line:
            line_index = i
            break
    
    # Geocode the POI to get its actual coordinates
    poi_coordinates = None
    try:
        # Try to geocode the POI name with the destination context
        search_query = f"{poi_name}, {destination}" if destination else poi_name
        poi_location = geocode_with_google_maps(search_query)
        if poi_location:
            poi_coordinates = {
                'lat': poi_location['latitude'],
                'lon': poi_location['longitude']
            }
            logger.info(f"Successfully geocoded POI '{poi_name}' to {poi_coordinates}")
        else:
            logger.warning(f"Failed to geocode POI '{poi_name}' - no results from Google Maps")
    except Exception as e:
        logger.warning(f"Failed to geocode POI '{poi_name}': {str(e)}")
    
    return {
        'id': poi_id,
        'name': poi_name,
        'type': poi_type,
        'keyword': poi_text,
        'line': lines[line_index] if line_index >= 0 else poi_text,
        'line_index': line_index if line_index >= 0 else 0,
        'context': lines[line_index] if line_index >= 0 else poi_text,
        'icon': icon,
        'coordinates': poi_coordinates
    }

def get_fallback_icon(poi_name, poi_type):
    """Generate a fallback icon based on POI name and type."""
    poi_name_lower = poi_name.lower()
    
    # Smart icon mapping based on common POI names and types
    smart_icons = {
        # Attractions
        'tower': '🗼', 'eiffel': '🗼', 'monument': '🗽', 'statue': '🗽', 'bridge': '🌉', 'palace': '🏰',
        'castle': '🏰', 'church': '⛪', 'cathedral': '⛪', 'temple': '🛕', 'mosque': '🕌', 'synagogue': '🕍',
        'plaza': '🏛️', 'square': '🏛️', 'fountain': '⛲', 'museum': '🏛️', 'gallery': '🖼️',
        
        # Restaurants
        'restaurant': '🍽️', 'cafe': '☕', 'bistro': '🍽️', 'pub': '🍺', 'bar': '🍺', 'tavern': '🍺',
        'diner': '🍽️', 'eatery': '🍽️', 'pizzeria': '🍕', 'bakery': '🥐', 'ice cream': '🍦',
        
        # Hotels
        'hotel': '🏨', 'hostel': '🏨', 'inn': '🏨', 'lodge': '🏨', 'resort': '🏖️', 'guesthouse': '🏨',
        'motel': '🏨', 'apartment': '🏢', 'villa': '🏡',
        
        # Parks
        'park': '🌳', 'garden': '🌺', 'botanical': '🌺', 'zoo': '🦁', 'aquarium': '🐠', 'forest': '🌲',
        'beach': '🏖️', 'lake': '🏞️', 'mountain': '⛰️', 'trail': '🥾',
        
        # Shopping
        'mall': '🛍️', 'market': '🛒', 'shop': '🛍️', 'store': '🛍️', 'boutique': '👗', 'shopping': '🛍️',
        'outlet': '🛍️', 'department': '🏬',
        
        # Transport
        'airport': '✈️', 'station': '🚉', 'metro': '🚇', 'subway': '🚇', 'bus': '🚌', 'train': '🚂',
        'port': '🚢', 'terminal': '🚉', 'garage': '🅿️', 'parking': '🅿️'
    }
    
    # Check for specific keywords in the POI name
    for keyword, icon in smart_icons.items():
        if keyword in poi_name_lower:
            return icon
    
    # Fallback to type-based icons
    fallback_icons = {
        'attraction': '🗽',
        'restaurant': '🍽️',
        'hotel': '🏨',
        'museum': '🏛️',
        'park': '🌳',
        'shopping': '🛍️',
        'transport': '🚇'
    }
    
    return fallback_icons.get(poi_type, '📍')

@method_decorator(csrf_exempt, name='dispatch')
class TripPlanView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            destination = data.get('destination')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            language = data.get('language', 'en')  # Get language from frontend, default to English
            
            # Also check Accept-Language header
            accept_language = request.headers.get('Accept-Language', '')
            if not language and accept_language:
                # Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
                primary_lang = accept_language.split(',')[0].split(';')[0].split('-')[0]
                if primary_lang in [lang[0] for lang in settings.LANGUAGES]:
                    language = primary_lang

            # Validate required fields
            if not destination:
                return JsonResponse({
                    'error': _('Destination is required'),
                    'error_code': 'MISSING_DESTINATION'
                }, status=400)
            
            if not start_date:
                return JsonResponse({
                    'error': _('Start date is required'),
                    'error_code': 'MISSING_START_DATE'
                }, status=400)
            
            if not end_date:
                return JsonResponse({
                    'error': _('End date is required'),
                    'error_code': 'MISSING_END_DATE'
                }, status=400)

            # Map language code to language name for OpenAI prompt
            lang_map = {
                'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
                'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh-cn': 'Chinese',
                'zh-tw': 'Chinese', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 
                'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian', 
                'fi': 'Finnish', 'cs': 'Czech', 'sk': 'Slovak', 'hu': 'Hungarian', 'ro': 'Romanian', 
                'bg': 'Bulgarian', 'el': 'Greek', 'he': 'Hebrew', 'th': 'Thai', 'vi': 'Vietnamese', 
                'id': 'Indonesian', 'ms': 'Malay', 'uk': 'Ukrainian', 'fa': 'Persian', 'sr': 'Serbian', 
                'hr': 'Croatian', 'sl': 'Slovenian', 'et': 'Estonian', 'lv': 'Latvian', 'lt': 'Lithuanian'
            }
            language_name = lang_map.get(language, 'English')

            # Geocode destination
            location_data = geocode_with_google_maps(destination)
            if not location_data:
                return JsonResponse({
                    'error': _('Unable to locate the destination. Please try again later.'),
                    'error_code': 'GEOCODING_ERROR'
                }, status=500)

            # Compose enhanced prompt for OpenAI
            prompt = f"""
            Plan a detailed trip to {destination} (latitude: {location_data['latitude']}, longitude: {location_data['longitude']}) from {start_date} to {end_date}.
            
            Please provide a comprehensive itinerary that includes:
            1. Day-by-day activities and attractions
            2. Local restaurants and food recommendations
            3. Transportation tips within the destination
            4. Cultural insights and local customs
            5. Practical travel tips (weather, what to pack, etc.)
            6. Budget-friendly and luxury options where applicable
            
            CRITICAL: For each point of interest (POI) mentioned in your plan, you MUST highlight it using this exact format:
            <poi type="attraction" name="Eiffel Tower" icon="🗼">Eiffel Tower</poi>
            <poi type="restaurant" name="Le Jules Verne" icon="🍽️">Le Jules Verne restaurant</poi>
            <poi type="hotel" name="Hotel Ritz" icon="🏨">Hotel Ritz</poi>
            <poi type="museum" name="Louvre Museum" icon="🏛️">Louvre Museum</poi>
            <poi type="park" name="Luxembourg Gardens" icon="🌳">Luxembourg Gardens</poi>
            <poi type="shopping" name="Champs-Élysées" icon="🛍️">Champs-Élysées shopping district</poi>
            <poi type="transport" name="Charles de Gaulle Airport" icon="✈️">Charles de Gaulle Airport</poi>
            
            POI types and suggested icons:
            - attraction: landmarks, monuments, towers, bridges, palaces, castles, churches, temples (🗽🗼🏰⛪🛕🕌🕍🏛️⛲)
            - restaurant: restaurants, cafes, bars, bistros, pubs (🍽️☕🍺🍕🥐🍦)
            - hotel: hotels, hostels, inns, resorts, guesthouses (🏨🏖️🏢🏡)
            - museum: museums, galleries, exhibitions (🏛️🖼️)
            - park: parks, gardens, zoos, aquariums (🌳🌺🦁🐠🌲🏖️🏞️⛰️)
            - shopping: malls, markets, shopping districts, boutiques (🛍️🛒👗🏬)
            - transport: airports, train stations, metro stations, ports (✈️🚉🚇🚌🚂🚢🅿️)
            
            IMPORTANT: You MUST include at least 5-10 POIs in your plan, each wrapped in the <poi> tags with appropriate icons. Choose the most relevant emoji for each specific place.
            
            Make the plan engaging, practical, and culturally sensitive. Include specific place names, addresses, and estimated costs where possible.
            
            Please answer in {language_name} and format the response in a clear, readable structure.
            """
            
            try:
                # Initialize OpenAI client inside the view method
                client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=2000,
                    temperature=0.7
                )
                plan = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                return JsonResponse({
                    'error': _('Unable to generate trip plan. Please try again later.'),
                    'error_code': 'OPENAI_ERROR'
                }, status=500)

            # Extract POIs from the plan
            pois, modified_plan = extract_pois_from_plan(plan, language, destination)

            # Return enhanced response
            return JsonResponse({
                'destination': destination,
                'coordinates': {
                    'lat': location_data['latitude'], 
                    'lon': location_data['longitude'],
                    'formatted_address': location_data['address']
                },
                'dates': {
                    'start': start_date,
                    'end': end_date
                },
                'language': language,
                'plan': modified_plan,
                'generated_at': location_data['raw'].get('timestamp', ''),
                'attribution': 'Powered by OpenAI GPT-4o',
                'pois': pois
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'error': _('Invalid JSON data provided'),
                'error_code': 'INVALID_JSON'
            }, status=400)
        except Exception as e:
            logger.error(f"Unexpected error in TripPlanView: {str(e)}")
            return JsonResponse({
                'error': _('An unexpected error occurred. Please try again later.'),
                'error_code': 'UNEXPECTED_ERROR'
            }, status=500)
