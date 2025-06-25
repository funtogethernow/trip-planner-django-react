"""
URL configuration for trip_planner project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from .views import ReactAppView, health_check, static_asset_serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('planner.urls')),
    path('health/', health_check, name='health_check'),
]

# Clean static asset serving for development
if settings.DEBUG:
    # Serve React app
    urlpatterns += [
        path('', ReactAppView.as_view(), name='react_app'),
    ]
    
    # Clean static asset serving - handles all static files including service workers
    urlpatterns += [
        # Special assets that need to be served at root level
        path('service-worker.js', static_asset_serve, {'path': 'service-worker.js'}, name='service_worker'),
        path('manifest.json', static_asset_serve, {'path': 'manifest.json'}, name='manifest'),
        path('favicon.ico', static_asset_serve, {'path': 'favicon.ico'}, name='favicon'),
        
        # Catch-all for static files in /static/ directory
        re_path(r'^static/(?P<path>.*)$', static_asset_serve, name='static_files'),
    ]

# Production static file serving
if not settings.DEBUG:
    urlpatterns += [
        path('', ReactAppView.as_view(), name='react_app'),
        path('<path:path>', ReactAppView.as_view(), name='react_app_catch_all'),
    ]
