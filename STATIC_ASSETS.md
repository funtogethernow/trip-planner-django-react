# Static Asset Management

This document explains the clean, maintainable static asset mapping system for the Trip Planner application.

## Overview

The static asset system has been refactored to be more maintainable and scalable. Instead of hardcoded URL patterns, we now use a centralized configuration approach.

## Files

- `trip_planner/static_config.py` - Centralized configuration for all static assets
- `trip_planner/views.py` - Contains the `static_asset_serve` function
- `trip_planner/urls.py` - Clean URL patterns using the new system

## How It Works

### 1. Special Asset Configuration

Special assets (like service workers, manifests, favicons) are defined in `static_config.py`:

```python
SPECIAL_ASSETS = {
    'service-worker.js': 'service-worker.js',
    'static/service-worker.js': 'service-worker.js',
    'manifest.json': 'manifest.json',
    # ... more mappings
}
```

### 2. Content Type Mapping

Content types are automatically determined based on file extensions:

```python
CONTENT_TYPES = {
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    # ... more types
}
```

### 3. Cache Control

Different assets get different cache settings:

```python
ASSET_CACHE = {
    'service-worker.js': 'none',      # No cache for service workers
    'manifest.json': 'medium',        # Medium cache for manifests
    'favicon.ico': 'long',           # Long cache for icons
    'default': 'long',               # Default for other assets
}
```

## Adding New Assets

To add a new special asset:

1. **Add to `SPECIAL_ASSETS`** in `static_config.py`:
   ```python
   'new-asset.js': 'new-asset.js',
   'static/new-asset.js': 'new-asset.js',  # If you want it at both paths
   ```

2. **Add cache setting** (optional):
   ```python
   'new-asset.js': 'medium',  # or 'long', 'none'
   ```

3. **The system will automatically**:
   - Serve the file at the specified path
   - Set the correct content type based on file extension
   - Apply appropriate cache headers

## URL Patterns

The system uses these URL patterns:

- `/service-worker.js` - Service worker at root (for full scope)
- `/manifest.json` - Web app manifest
- `/favicon.ico` - Favicon
- `/static/*` - All other static files (CSS, JS, images, etc.)

## Benefits

1. **Maintainable**: All asset mappings in one place
2. **Scalable**: Easy to add new assets without touching views or URLs
3. **Performance**: Proper cache headers for different asset types
4. **Flexible**: Supports multiple paths for the same asset
5. **Clean**: No hardcoded URL patterns cluttering the codebase

## Example Usage

```python
# In static_config.py
SPECIAL_ASSETS = {
    'my-custom-asset.js': 'custom/my-asset.js',
    'static/my-custom-asset.js': 'custom/my-asset.js',
}

ASSET_CACHE = {
    'my-custom-asset.js': 'medium',
}
```

This will:
- Serve `/custom/my-asset.js` at both `/my-custom-asset.js` and `/static/my-custom-asset.js`
- Set content type to `application/javascript`
- Apply medium cache settings (1 day)

## Troubleshooting

If an asset isn't being served:

1. Check that it's listed in `SPECIAL_ASSETS`
2. Verify the file exists in `STATIC_ROOT`
3. Check the Django logs for 404 errors
4. Ensure the URL pattern is correct in `urls.py` 