from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from django.utils.decorators import method_decorator
import openai
import os
from geopy.geocoders import Nominatim
import json

openai.api_key = os.getenv('OPENAI_API_KEY')

@method_decorator(csrf_exempt, name='dispatch')
class TripPlanView(View):
    def post(self, request):
        data = json.loads(request.body)
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        language = data.get('language', 'en')  # Get language from frontend, default to English

        # Map language code to language name for OpenAI prompt
        lang_map = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
            'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh-cn': 'Chinese',
            'zh-tw': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 'nl': 'Dutch',
            'pl': 'Polish', 'sv': 'Swedish', 'da': 'Danish', 'no': 'Norwegian', 'fi': 'Finnish',
            'cs': 'Czech', 'sk': 'Slovak', 'hu': 'Hungarian', 'ro': 'Romanian', 'bg': 'Bulgarian',
            'el': 'Greek', 'he': 'Hebrew', 'th': 'Thai', 'vi': 'Vietnamese', 'id': 'Indonesian',
            'ms': 'Malay', 'uk': 'Ukrainian', 'fa': 'Persian', 'sr': 'Serbian', 'hr': 'Croatian',
            'sl': 'Slovenian', 'et': 'Estonian', 'lv': 'Latvian', 'lt': 'Lithuanian'
        }
        language_name = lang_map.get(language, 'English')

        # Geocode destination
        geolocator = Nominatim(user_agent="trip_planner")
        location = geolocator.geocode(destination)
        if not location:
            return JsonResponse({'error': 'Location not found'}, status=400)

        # Compose prompt for OpenAI
        prompt = f"""
        Plan a trip to {destination} (lat: {location.latitude}, lon: {location.longitude}) from {start_date} to {end_date}.
        Suggest a detailed itinerary with activities, places to visit, and local tips.
        Please answer in {language_name}.
        """
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}]
            )
            plan = response.choices[0].message.content.strip()
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

        return JsonResponse({
            'destination': destination,
            'coordinates': {'lat': location.latitude, 'lon': location.longitude},
            'plan': plan
        })
