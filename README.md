# Trip Planner - Django + React + OpenAI

A full-stack trip planning application that uses Django backend with OpenAI API for intelligent trip recommendations and React frontend for a modern user experience with comprehensive internationalization (I18N) support, interactive maps, and Points of Interest (POI) management.

## 🌟 Key Features

### 🗺️ Interactive Map & POI System
- **Interactive Google Maps Integration**: Real-time map display with POI markers
- **Bidirectional POI Selection**: Click POIs on map or in plan text for seamless interaction
- **Smart POI Highlighting**: Visual feedback with info windows and selection indicators
- **Unique POI Identification**: Backend generates unique IDs for accurate POI tracking
- **Race Condition Prevention**: Robust state management prevents selection conflicts

### 🌍 Internationalization (I18N) Features

#### Frontend I18N (React + i18next)
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

#### Backend I18N (Django)
- **Language-Aware API**: Backend responds in the user's preferred language
- **Enhanced Error Messages**: Localized error responses with error codes
- **Accept-Language Header Support**: Automatic language detection from browser headers
- **Comprehensive Language Mapping**: 40+ languages supported for OpenAI responses

### 🚀 Core Features
- **AI-Powered Trip Planning**: Uses OpenAI GPT-3.5-turbo to generate personalized trip itineraries
- **Google Maps Geocoding**: Advanced destination search with autocomplete suggestions
- **Date Range Picker**: Intuitive calendar interface with multi-language support
- **Modern React UI**: Clean, responsive interface built with React
- **Django REST API**: Robust backend with CORS support for cross-origin requests
- **HTTPS Support**: Secure connections with SSL/TLS encryption
- **Production-Ready Deployment**: Comprehensive deployment scripts and nginx configuration

## 🛠️ Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key
- Google Maps API key
- EC2 instance (or similar cloud server)
- Domain name (optional, for proper SSL certificates)

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=your-openai-api-key
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 2. One-Command Deployment

Use our comprehensive deployment script:
```bash
# Development deployment
./deploy.sh dev

# Production deployment with nginx
./deploy.sh production-stack

# Check status
./deploy.sh status
```

### 3. Manual Setup (Alternative)

#### Backend Setup
```bash
# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start Django server (for development)
python manage.py runserver 0.0.0.0:8000
```

#### Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Build for production
npm run build

# Start React development server (for development)
npm start
```

## 📋 Deployment Options

### Development Deployment
```bash
./deploy.sh dev          # Build and start development server
./deploy.sh restart      # Restart development server
./deploy.sh stop         # Stop development server
./deploy.sh status       # Check server status
```

### Production Deployment
```bash
./deploy.sh production-stack  # Full production deployment (nginx + gunicorn)
./deploy.sh nginx             # Deploy nginx configuration
./deploy.sh setup-nginx       # Prepare nginx config (non-root)
```

### Modular Build Options
```bash
./deploy.sh build        # Build complete application
./deploy.sh frontend     # Build frontend only
./deploy.sh static       # Collect static files only
```

### Nginx Management
```bash
sudo ./deploy.sh start-nginx    # Start nginx service
sudo ./deploy.sh stop-nginx     # Stop nginx service
sudo ./deploy.sh restart-nginx  # Restart nginx service
./deploy.sh nginx-status        # Check nginx status
```

## 🗺️ Interactive Map Features

### POI (Points of Interest) System
- **Backend POI Generation**: AI generates POIs with unique IDs and metadata
- **Frontend POI Parsing**: Intelligent parsing of POI tags in plan text
- **Map Integration**: POIs displayed as interactive markers on Google Maps
- **Bidirectional Linking**: Click POIs on map or in plan text for seamless interaction
- **Info Windows**: Rich POI information displayed in map popups
- **Selection Indicators**: Visual feedback for selected POIs

### Map Functionality
- **Google Maps API**: Full integration with Google Maps JavaScript API
- **Geocoding**: Advanced destination search with autocomplete
- **Marker Management**: Dynamic marker creation and management
- **Info Window Control**: Programmatic info window management
- **Map Centering**: Automatic map centering on POI selection
- **Zoom Control**: Smart zoom levels for optimal viewing

## 🌐 API Endpoints

### Trip Planning API
- `POST /api/plan-trip/` - Generate comprehensive trip plan
  - Body: `{"destination": "Paris, France", "start_date": "2024-07-01", "end_date": "2024-07-07", "language": "es"}`
  - Headers: `Accept-Language: es` (optional)
  - Response includes: plan text, POIs with coordinates, destination coordinates

### Response Format
```json
{
  "destination": "Paris, France",
  "coordinates": {"lat": 48.8566, "lon": 2.3522},
  "plan": "Day 1: Visit the <poi id=\"1\" type=\"attraction\" name=\"Eiffel Tower\">Eiffel Tower</poi>...",
  "pois": [
    {
      "id": 1,
      "name": "Eiffel Tower",
      "type": "attraction",
      "lat": 48.8584,
      "lon": 2.2945,
      "context": "Iconic iron lattice tower on the Champ de Mars"
    }
  ]
}
```

## 🌍 Multi-Language Support

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

## 🔧 Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your-openai-api-key
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Optional
DEBUG=True/False
DJANGO_SETTINGS_MODULE=trip_planner.settings_production
```

### Google Maps Setup
1. Create a Google Cloud Project
2. Enable Maps JavaScript API and Geocoding API
3. Create API key with appropriate restrictions
4. Add key to environment variables

See `GOOGLE_MAPS_SETUP.md` for detailed instructions.

## 🚀 Production Deployment

### Complete Production Stack
```bash
# Deploy everything (nginx + gunicorn + frontend + backend)
./deploy.sh production-stack
```

### Manual Production Setup
```bash
# Build application
./deploy.sh build

# Setup nginx (requires root)
sudo ./deploy.sh nginx

# Start gunicorn
source venv/bin/activate
gunicorn trip_planner.wsgi:application --bind 127.0.0.1:8000 --workers 4 --daemon
```

### SSL Certificate Setup
```bash
# Let's Encrypt (recommended for production)
sudo certbot --nginx -d your-domain.com

# Self-signed (development only)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/certs/trip-planner.key \
    -out /etc/ssl/certs/trip-planner.crt
```

## 🐳 Docker Deployment

### Docker Compose
```bash
# Deploy with Docker Compose
./deploy.sh docker-compose
```

### Manual Docker
```bash
# Build and run Docker container
./deploy.sh docker
```

## 🏗️ Development

### Project Structure
```
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── locales/         # Translation files
│   │   ├── App.js           # Main application
│   │   ├── Map.js           # Google Maps component
│   │   └── i18n.js          # Internationalization setup
│   └── package.json
├── planner/                  # Django app
│   ├── views.py             # API endpoints
│   ├── models.py            # Data models
│   └── urls.py              # URL routing
├── trip_planner/            # Django project
│   ├── settings.py          # Development settings
│   ├── settings_production.py # Production settings
│   └── urls.py              # Main URL configuration
├── deploy.sh                # Comprehensive deployment script
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

### Adding New Languages
1. **Frontend**: Add new language file in `frontend/src/locales/`
2. **Backend**: Add language to `LANGUAGES` in `settings.py`
3. **Language Mapping**: Update language mapping in `views.py`

### Development Commands
```bash
# Frontend development
cd frontend && npm start

# Backend development
source venv/bin/activate && python manage.py runserver

# Build and deploy
./deploy.sh dev
```

## 🔍 Troubleshooting

### Common Issues
1. **POI selection not working**: Check browser console for errors
2. **Map not loading**: Verify Google Maps API key
3. **Language not switching**: Clear browser cache and localStorage
4. **Deployment issues**: Check `./deploy.sh status` for service status

### Debug Mode
```bash
# Enable Django debug mode
export DEBUG=True

# Enable React development mode
cd frontend && npm start
```

### Logs and Monitoring
```bash
# Check Django logs
tail -f nohup.out

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check service status
./deploy.sh status
./deploy.sh nginx-status
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add translations for new languages
4. Test POI functionality and map integration
5. Test RTL support if applicable
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for AI-powered trip planning
- Google Maps for mapping and geocoding services
- React and Django communities for excellent frameworks
- i18next for internationalization support 