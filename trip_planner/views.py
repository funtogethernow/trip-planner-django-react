import json
import os
from django.views.generic import TemplateView
from django.conf import settings
from django.http import JsonResponse, Http404
from django.views.static import serve as static_serve
from django.http import HttpResponse
from pathlib import Path
from .static_config import SPECIAL_ASSETS, CONTENT_TYPES, CACHE_SETTINGS, ASSET_CACHE


class ReactAppView(TemplateView):
    """
    Custom view for serving the React application with dynamic asset loading.
    Reads the asset manifest to provide the correct file names for CSS and JS bundles.
    """
    template_name = 'index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Try to read asset manifest for dynamic asset loading
        try:
            manifest_path = os.path.join(settings.STATIC_ROOT, 'asset-manifest.json')
            if os.path.exists(manifest_path):
                with open(manifest_path, 'r') as f:
                    manifest = json.load(f)
                
                # Extract main CSS and JS files
                context['main_css'] = manifest.get('files', {}).get('main.css', 'css/main.98bfbf88.css')
                context['main_js'] = manifest.get('files', {}).get('main.js', 'js/main.aaa2335a.js')
                
                # Clean up paths (remove ./static/ prefix if present)
                context['main_css'] = context['main_css'].replace('./static/', '')
                context['main_js'] = context['main_js'].replace('./static/', '')
                
                # Get additional chunks
                context['additional_chunks'] = []
                for key, value in manifest.get('files', {}).items():
                    if key.startswith('static/js/') and key != 'static/js/main.js' and key.endswith('.js'):
                        chunk_path = value.replace('./static/', '')
                        context['additional_chunks'].append(chunk_path)
            else:
                # Fallback to default assets if manifest doesn't exist
                context['main_css'] = 'css/main.98bfbf88.css'
                context['main_js'] = 'js/main.aaa2335a.js'
                context['additional_chunks'] = []
                
        except (json.JSONDecodeError, IOError, KeyError) as e:
            # Fallback to default assets if there's any error
            context['main_css'] = 'css/main.98bfbf88.css'
            context['main_js'] = 'js/main.aaa2335a.js'
            context['additional_chunks'] = []
            print(f"Warning: Could not read asset manifest: {e}")
        
        return context


def health_check(request):
    """
    Simple health check endpoint for monitoring.
    """
    return JsonResponse({
        'status': 'healthy',
        'message': 'Trip Planner API is running'
    })


def static_asset_serve(request, path):
    """
    Clean static asset serving that handles special cases like service workers.
    Uses centralized configuration for better maintainability.
    """
    # Check if this is a special asset that needs custom handling
    if path in SPECIAL_ASSETS:
        file_path = SPECIAL_ASSETS[path]
        full_path = os.path.join(settings.STATIC_ROOT, file_path)
        
        if os.path.exists(full_path):
            with open(full_path, 'rb') as f:
                content = f.read()
            
            # Determine content type based on file extension
            file_ext = Path(file_path).suffix.lower()
            content_type = CONTENT_TYPES.get(file_ext, 'application/octet-stream')
            
            response = HttpResponse(content, content_type=content_type)
            
            # Set appropriate cache headers
            cache_setting = ASSET_CACHE.get(file_path, ASSET_CACHE.get('default', 'long'))
            response['Cache-Control'] = CACHE_SETTINGS[cache_setting]
            
            return response
    
    # For regular static files, use Django's built-in static serving
    try:
        return static_serve(request, path, document_root=settings.STATIC_ROOT)
    except Http404:
        # If file not found in STATIC_ROOT, try looking in static subdirectories
        for subdir in ['css', 'js', 'static']:
            subdir_path = os.path.join(settings.STATIC_ROOT, subdir, path)
            if os.path.exists(subdir_path):
                return static_serve(request, f"{subdir}/{path}", document_root=settings.STATIC_ROOT)
        
        # If still not found, raise 404
        raise Http404(f"Static file '{path}' not found") 