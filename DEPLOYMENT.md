# Trip Planner Deployment Guide

## Recent Updates (June 2025)

### ✅ Fixed OpenAI API Compatibility Issue
- **Problem**: `openai==1.3.0` had compatibility issues with `httpx==0.28.1` causing `proxies` argument errors
- **Solution**: Updated to `openai==1.91.0` in requirements.txt
- **Prevention**: Added comment in requirements.txt to document the minimum version requirement

### ✅ Implemented Unified POI Parsing System
- **Problem**: Duplicate code paths for handling POI tags with and without icons
- **Solution**: Single regex pattern that handles both formats: `<poi type="..." name="..." icon="...">` and `<poi type="..." name="...">`
- **Benefits**: Cleaner code, better maintainability, consistent behavior

## Deployment Instructions

### Prerequisites
- Python 3.9+
- Node.js 14+
- Virtual environment

### Quick Deploy
```bash
# Clone and setup
git clone <repository>
cd Playground

# Install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Build frontend
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

# Setup Django
python manage.py migrate
python manage.py collectstatic --noinput

# Run server
python manage.py runserver 0.0.0.0:8000
```

### Environment Variables
Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `REACT_APP_GOOGLE_MAPS_API_KEY`: Your Google Maps API key

### Production Deployment
For production deployment, use:
```bash
./deploy.sh production
```

## Architecture

### Backend (Django)
- **API Endpoint**: `/api/plan-trip/`
- **Features**: 
  - OpenAI GPT-4o integration for trip planning
  - Google Maps Geocoding for location data
  - POI extraction and geocoding
  - Multi-language support

### Frontend (React)
- **Features**:
  - Interactive map with POI markers
  - Unified POI parsing system
  - Multi-language support (15+ languages)
  - Responsive design with RTL support

### POI System
- **Format**: `<poi type="attraction" name="Eiffel Tower" icon="🗼">Eiffel Tower</poi>`
- **Types**: attraction, restaurant, hotel, museum, park, shopping, transport
- **Features**: Automatic geocoding, icon mapping, interactive selection

## Troubleshooting

### Common Issues
1. **OpenAI API errors**: Ensure `openai>=1.91.0` in requirements.txt
2. **Static files not loading**: Check DEBUG=True in settings.py for development
3. **POI parsing issues**: Verify the unified regex pattern in App.js

### Version Requirements
- `openai>=1.91.0` (prevents httpx compatibility issues)
- `httpx>=0.23.0` (required by OpenAI)
- `Django>=4.2.23`
- `React>=18.0.0`

## Prerequisites

Before deploying, ensure you have:

1. **API Keys**:
   - OpenAI API key for AI-powered trip planning
   - Google Maps API key for interactive maps

2. **Environment Variables**:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   export REACT_APP_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
   ```

## Deployment Options

### 1. Quick Local Deployment

For local development and testing:

```bash
# Install dependencies and build
./build.sh

# Run the application
python manage.py runserver 0.0.0.0:8000
```

### 2. Docker Deployment

#### Using Docker Compose (Recommended for local development):

```bash
# Start the application with PostgreSQL database
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

#### Using Docker directly:

```bash
# Build and run with Docker
./deploy.sh docker
```

### 3. Heroku Deployment

#### Prerequisites:
- Install Heroku CLI: `curl https://cli-assets.heroku.com/install.sh | sh`
- Login to Heroku: `heroku login`

#### Deploy:
```bash
# Deploy to Heroku
./deploy.sh heroku
```

#### Manual Heroku Setup:
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set OPENAI_API_KEY="your-openai-api-key"
heroku config:set REACT_APP_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Deploy
git push heroku main

# Open the app
heroku open
```

### 4. Production Server Deployment

#### Using the deployment script:
```bash
# Deploy to production server
./deploy.sh production
```

#### Manual production deployment:
```bash
# Set production environment
export DEBUG=False
export DJANGO_SETTINGS_MODULE=trip_planner.settings_production

# Build the application
./build.sh

# Run with Gunicorn
gunicorn trip_planner.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### 5. AWS EC2 Deployment

#### Setup EC2 instance:
```bash
# Update system
sudo yum update -y

# Install Python 3.11
sudo yum install python3.11 python3.11-pip -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y

# Install Docker (optional)
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -a -G docker ec2-user
```

#### Deploy application:
```bash
# Clone your repository
git clone <your-repo-url>
cd Playground

# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"
export REACT_APP_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Deploy using Docker Compose
./deploy.sh docker-compose
```

### 6. DigitalOcean App Platform

1. Connect your GitHub repository to DigitalOcean App Platform
2. Set environment variables in the DigitalOcean dashboard:
   - `OPENAI_API_KEY`
   - `REACT_APP_GOOGLE_MAPS_API_KEY`
3. Deploy using the provided Dockerfile

### 7. Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically detect the Dockerfile and deploy

## Environment Configuration

### Development (.env file):
```env
DEBUG=True
OPENAI_API_KEY=your-openai-api-key
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Production:
```env
DEBUG=False
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-api-key
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## Database Configuration

### SQLite (Default):
The application uses SQLite by default, which is suitable for small to medium applications.

### PostgreSQL (Production):
For production deployments, consider using PostgreSQL:

```bash
# Install PostgreSQL dependencies
pip install psycopg2-binary

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@host:port/database"
```

## Static Files

The application automatically handles static files:
- React build files are served by Django in production
- Static files are collected using `python manage.py collectstatic`
- WhiteNoise middleware serves static files efficiently

## Monitoring and Logging

### Application Logs:
```bash
# View application logs
docker-compose logs -f web

# View Django logs
python manage.py runserver --verbosity=2
```

### Health Check:
The application includes a health check endpoint at `/api/health/`

## Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Restrict CORS origins to your domain
4. **Django Security**: Keep Django and dependencies updated
5. **Database**: Use strong passwords and restrict access

## Support

For deployment issues:
1. Check the application logs
2. Verify environment variables
3. Test locally before deploying
4. Review the troubleshooting section above 