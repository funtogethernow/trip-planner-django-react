# Trip Planner - Django + React + OpenAI

A full-stack trip planning application that uses Django backend with OpenAI API for intelligent trip recommendations and React frontend for a modern user experience with comprehensive internationalization (I18N) support.

## 🌍 Internationalization (I18N) Features

### Frontend I18N (React + i18next)
- **40+ Supported Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese (Simplified/Traditional), Arabic, Hindi, Turkish, Dutch, Polish, and many more
- **RTL Language Support**: Full support for Arabic, Hebrew, Persian, and Urdu with proper right-to-left layout
- **Smart Language Detection**: 
  - Browser language preference detection
  - URL parameter support (`?lng=es`)
  - LocalStorage persistence
  - Fallback chain handling
- **Dynamic Content**: All UI text, placeholders, and messages are fully translated
- **Date Localization**: Dates formatted according to user's language preference
- **Accessibility**: Proper ARIA labels and screen reader support

### Backend I18N (Django)
- **Language-Aware API**: Backend responds in the user's preferred language
- **Enhanced Error Messages**: Localized error responses with error codes
- **Accept-Language Header Support**: Automatic language detection from browser headers
- **Comprehensive Language Mapping**: 40+ languages supported for OpenAI responses

### Key I18N Features
- **URL Language Switching**: Change language via URL parameter
- **Persistent Language Selection**: Language choice saved in localStorage
- **RTL Layout Support**: Automatic layout switching for RTL languages
- **Cultural Sensitivity**: AI responses adapted to cultural context
- **Responsive Design**: I18N works seamlessly across all device sizes

## Features

- **AI-Powered Trip Planning**: Uses OpenAI GPT-3.5-turbo to generate personalized trip itineraries
- **Geolocation Integration**: Automatically geocodes destinations using Nominatim
- **Modern React UI**: Clean, responsive interface built with React
- **Django REST API**: Robust backend with CORS support for cross-origin requests
- **HTTPS Support**: Secure connections with SSL/TLS encryption
- **Multi-Language Support**: Comprehensive I18N with 40+ languages
- **RTL Language Support**: Full support for Arabic, Hebrew, Persian, and Urdu
- **Nginx Reverse Proxy**: Production-ready deployment with load balancing

## Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key
- EC2 instance (or similar cloud server)
- Domain name (optional, for proper SSL certificates)

## Complete Setup Instructions

### 1. Environment Setup

Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Backend Setup

```bash
# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install django openai python-dotenv requests geopy django-cors-headers

# Run migrations
python manage.py migrate

# Start Django server (for development)
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup

```bash
# Install Node.js dependencies
cd frontend
npm install

# Build for production
npm run build

# Start React development server (for development)
npm start
```

### 4. Nginx Installation & Configuration

```bash
# Install nginx and certbot
sudo yum install -y nginx certbot python3-certbot-nginx

# Create web directory
sudo mkdir -p /var/www/html

# Copy React build to nginx directory
sudo cp -r frontend/build /var/www/html/trip-planner

# Create nginx configuration
sudo tee /etc/nginx/conf.d/trip-planner-ssl.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # Replace with your domain or IP
    
    ssl_certificate /etc/ssl/certs/trip-planner.crt;
    ssl_certificate_key /etc/ssl/certs/trip-planner.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Serve React app
    location / {
        root /var/www/html/trip-planner;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # Proxy API requests to Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
EOF

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. SSL Certificate Setup

#### Option A: Self-Signed Certificate (Development)
```bash
# Create self-signed certificate
sudo mkdir -p /etc/ssl/certs
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/certs/trip-planner.key \
    -out /etc/ssl/certs/trip-planner.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

#### Option B: Let's Encrypt Certificate (Production)
```bash
# Get free SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Enable automatic renewal
sudo systemctl start certbot-renew.timer
sudo systemctl enable certbot-renew.timer
```

### 6. Production Deployment

```bash
# Stop any running Django servers
pkill -f "manage.py runserver"

# Start Django in production mode
source venv/bin/activate
nohup python manage.py runserver 0.0.0.0:8000 &

# Reload nginx
sudo systemctl reload nginx

# Check services status
sudo systemctl status nginx
ps aux | grep runserver
```

### 7. Security Group Configuration

Ensure your EC2 security group allows:
- **Port 80** (HTTP - for redirects)
- **Port 443** (HTTPS)
- **Port 22** (SSH)

## API Endpoints

- `POST /api/plan/` - Generate trip plan
  - Body: `{"destination": "Paris, France", "start_date": "2024-07-01", "end_date": "2024-07-07", "language": "es"}`
  - Headers: `Accept-Language: es` (optional)
  - Response language automatically matches the requested language

## Multi-Language Support

### Supported Languages (40+)
- **Western European**: English, Spanish, French, German, Italian, Portuguese, Dutch
- **Eastern European**: Russian, Polish, Czech, Slovak, Hungarian, Romanian, Bulgarian, Ukrainian, Serbian, Croatian, Slovenian, Estonian, Latvian, Lithuanian
- **Asian**: Japanese, Korean, Chinese (Simplified/Traditional), Thai, Vietnamese, Indonesian, Malay
- **Middle Eastern**: Arabic, Hebrew, Persian, Turkish
- **Other**: Hindi, Swedish, Danish, Norwegian, Finnish, Greek

### Language Features
- **Automatic Detection**: Browser language preference detection
- **URL Switching**: Change language via `?lng=es` parameter
- **Persistent Selection**: Language choice saved in localStorage
- **RTL Support**: Full right-to-left layout for Arabic, Hebrew, Persian, Urdu
- **Cultural Adaptation**: AI responses adapted to cultural context
- **Fallback Chain**: Graceful fallback to English if translation missing

### Using Different Languages

1. **Via Language Selector**: Use the dropdown in the UI
2. **Via URL**: Add `?lng=es` to the URL (e.g., `https://yoursite.com?lng=es`)
3. **Via Browser**: Set your browser's preferred language
4. **Via API**: Send `language` parameter in API requests

### RTL Language Support
The application automatically detects RTL languages and adjusts:
- Text direction (right-to-left)
- Layout alignment
- Navigation arrows
- Form field positioning
- Calendar navigation

## Deployment Scripts

### Quick Deploy Script
```bash
#!/bin/bash
# Save as deploy.sh and run: chmod +x deploy.sh && ./deploy.sh

echo "Building React app..."
cd frontend && npm run build && cd ..

echo "Deploying to nginx..."
sudo cp -r frontend/build/* /var/www/html/trip-planner/

echo "Restarting services..."
sudo systemctl reload nginx
pkill -f "manage.py runserver"
cd .. && source venv/bin/activate && nohup python manage.py runserver 0.0.0.0:8000 &

echo "Deployment complete!"
```

## Development

### Adding New Languages

1. **Frontend**: Add new language file in `frontend/src/locales/`
2. **Backend**: Add language to `LANGUAGES` in `settings.py`
3. **Language Mapping**: Update language mapping in `views.py`

### Translation Management

The application uses i18next for frontend translations and Django's built-in translation system for backend messages. All user-facing text is externalized and can be easily translated.

## Troubleshooting

### Common Issues

1. **Language not switching**: Clear browser cache and localStorage
2. **RTL layout issues**: Ensure proper CSS direction properties
3. **Translation missing**: Check if language file exists in locales directory
4. **API language errors**: Verify language code is in supported list

### Debug Mode

Enable debug mode in `frontend/src/i18n.js`:
```javascript
debug: true, // Enable debug mode for development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add translations for new languages
4. Test RTL support if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 