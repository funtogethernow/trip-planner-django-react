"""
Static asset configuration for the Trip Planner application.
This centralizes all static asset mappings and makes them easy to maintain.
"""

# Special assets that need to be served at specific paths
# Format: 'requested_path': 'actual_file_path_in_static_root'
SPECIAL_ASSETS = {
    # Service workers - can be served at root or /static/
    'service-worker.js': 'service-worker.js',
    'static/service-worker.js': 'service-worker.js',
    
    # Web app manifest
    'manifest.json': 'manifest.json',
    'static/manifest.json': 'manifest.json',
    
    # Favicon
    'favicon.ico': 'favicon.ico',
    'static/favicon.ico': 'favicon.ico',
    
    # App icons
    'logo192.png': 'logo192.png',
    'static/logo192.png': 'logo192.png',
    'logo512.png': 'logo512.png',
    'static/logo512.png': 'logo512.png',
    
    # Robots.txt
    'robots.txt': 'robots.txt',
    'static/robots.txt': 'robots.txt',
}

# Content type mappings for special assets
CONTENT_TYPES = {
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.css': 'text/css',
    '.html': 'text/html',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
}

# Cache settings for different asset types
CACHE_SETTINGS = {
    # Long cache for static assets that rarely change
    'long': 'public, max-age=31536000',  # 1 year
    # Medium cache for assets that might change occasionally
    'medium': 'public, max-age=86400',   # 1 day
    # No cache for assets that change frequently
    'none': 'no-cache, no-store, must-revalidate',
}

# Asset cache mapping
ASSET_CACHE = {
    'service-worker.js': 'none',      # Service workers should not be cached
    'manifest.json': 'medium',        # Manifest might change
    'favicon.ico': 'long',           # Favicon rarely changes
    'logo192.png': 'long',           # App icons rarely change
    'logo512.png': 'long',           # App icons rarely change
    'robots.txt': 'medium',          # Robots.txt might change
    'default': 'long',               # Default for other assets
} 