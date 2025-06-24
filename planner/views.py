from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from django.utils.decorators import method_decorator
from django.utils.translation import gettext as _
from django.conf import settings
import openai
import os
from geopy.geocoders import Nominatim
import json
import logging
import re

# Set up logging
logger = logging.getLogger(__name__)

openai.api_key = os.getenv('OPENAI_API_KEY')

def extract_pois_from_plan(plan_text, language='en'):
    """
    Extract Points of Interest from the trip plan text using OpenAI-generated POI tags.
    Returns a list of POI objects with id, name, type, and context info.
    """
    pois = []
    poi_id = 1
    
    # Find all POI tags in the format <poi type="..." name="...">...</poi>
    poi_pattern = r'<poi\s+type="([^"]+)"\s+name="([^"]+)">([^<]+)</poi>'
    matches = re.findall(poi_pattern, plan_text)
    
    for match in matches:
        poi_type, poi_name, poi_text = match
        
        # Find the line containing this POI
        lines = plan_text.split('\n')
        line_index = -1
        for i, line in enumerate(lines):
            if poi_text in line:
                line_index = i
                break
        
        # Create POI object
        poi = {
            'id': poi_id,
            'name': poi_name,
            'type': poi_type,
            'keyword': poi_text,
            'line': lines[line_index] if line_index >= 0 else poi_text,
            'line_index': line_index if line_index >= 0 else 0,
            'context': lines[line_index] if line_index >= 0 else poi_text
        }
        
        # Avoid duplicates based on name
        if not any(existing_poi['name'].lower() == poi['name'].lower() for existing_poi in pois):
            pois.append(poi)
            poi_id += 1
    
    return pois

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
            geolocator = Nominatim(user_agent="trip_planner")
            try:
                location = geolocator.geocode(destination)
                if not location:
                    return JsonResponse({
                        'error': _('Location not found. Please check the destination name and try again.'),
                        'error_code': 'LOCATION_NOT_FOUND',
                        'destination': destination
                    }, status=400)
            except Exception as e:
                logger.error(f"Geocoding error for destination '{destination}': {str(e)}")
                return JsonResponse({
                    'error': _('Unable to locate the destination. Please try again later.'),
                    'error_code': 'GEOCODING_ERROR'
                }, status=500)

            # Compose enhanced prompt for OpenAI
            prompt = f"""
            Plan a detailed trip to {destination} (latitude: {location.latitude}, longitude: {location.longitude}) from {start_date} to {end_date}.
            
            Please provide a comprehensive itinerary that includes:
            1. Day-by-day activities and attractions
            2. Local restaurants and food recommendations
            3. Transportation tips within the destination
            4. Cultural insights and local customs
            5. Practical travel tips (weather, what to pack, etc.)
            6. Budget-friendly and luxury options where applicable
            
            IMPORTANT: For each point of interest (POI) mentioned in your plan, please highlight it using this format:
            <poi type="attraction" name="Eiffel Tower">Eiffel Tower</poi>
            <poi type="restaurant" name="Le Jules Verne">Le Jules Verne restaurant</poi>
            <poi type="hotel" name="Hotel Ritz">Hotel Ritz</poi>
            <poi type="museum" name="Louvre Museum">Louvre Museum</poi>
            <poi type="park" name="Luxembourg Gardens">Luxembourg Gardens</poi>
            <poi type="shopping" name="Champs-Élysées">Champs-Élysées shopping district</poi>
            <poi type="transport" name="Charles de Gaulle Airport">Charles de Gaulle Airport</poi>
            
            POI types to use:
            - attraction: landmarks, monuments, towers, bridges, palaces, castles, churches, temples, etc.
            - restaurant: restaurants, cafes, bars, bistros, pubs, etc.
            - hotel: hotels, hostels, inns, resorts, guesthouses, etc.
            - museum: museums, galleries, exhibitions, etc.
            - park: parks, gardens, zoos, aquariums, etc.
            - shopping: malls, markets, shopping districts, boutiques, etc.
            - transport: airports, train stations, metro stations, ports, etc.
            
            Make the plan engaging, practical, and culturally sensitive. Include specific place names, addresses, and estimated costs where possible.
            
            Please answer in {language_name} and format the response in a clear, readable structure.
            """
            
            try:
                response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
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
            pois = extract_pois_from_plan(plan, language)

            # Return enhanced response
            return JsonResponse({
                'destination': destination,
                'coordinates': {
                    'lat': location.latitude, 
                    'lon': location.longitude,
                    'formatted_address': location.address
                },
                'dates': {
                    'start': start_date,
                    'end': end_date
                },
                'language': language,
                'plan': plan,
                'generated_at': location.raw.get('timestamp', ''),
                'attribution': 'Powered by OpenAI GPT-3.5-turbo',
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
