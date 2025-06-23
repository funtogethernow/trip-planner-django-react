# Trip Planner - Django + React + OpenAI

A full-stack trip planning application that uses Django backend with OpenAI API for intelligent trip recommendations and React frontend for a modern user experience.

## Features

- **AI-Powered Trip Planning**: Uses OpenAI GPT-3.5-turbo to generate personalized trip itineraries
- **Geolocation Integration**: Automatically geocodes destinations using Nominatim
- **Modern React UI**: Clean, responsive interface built with React
- **Django REST API**: Robust backend with CORS support for cross-origin requests
- **HTTPS Support**: Secure connections with SSL/TLS encryption
- **Multi-Language Support**: Automatically detects query language and responds in the same language
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
pip install django openai python-dotenv requests geopy django-cors-headers langdetect

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
  - Body: `{"destination": "Paris, France", "start_date": "2024-07-01", "end_date": "2024-07-07"}`
  - Response language automatically matches the language of the destination

## Multi-Language Support

The application automatically detects the language of the destination field and generates the trip plan in that language. Supported languages include:
- English, Spanish, French, German, Italian
- Portuguese, Russian, Japanese, Korean, Chinese
- Arabic, Hindi, Turkish, Dutch, Polish
- And many more...

## Deployment Scripts

### Quick Deploy Script
```bash
#!/bin/bash
# Save as deploy.sh and run: chmod +x deploy.sh && ./deploy.sh

echo "Building React app..."
cd frontend && npm run build && cd ..

echo "Deploying to nginx..."
sudo cp -r frontend/build/* /var/www/html/trip-planner/

echo "Restarting Django..."
pkill -f "manage.py runserver"
source venv/bin/activate
nohup python manage.py runserver 0.0.0.0:8000 &

echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"
```

### Development Mode
```bash
# Run both services concurrently
npm start
```

## Troubleshooting

### Common Issues

1. **Nginx not starting**: Check configuration with `sudo nginx -t`
2. **Django not accessible**: Ensure it's running on `0.0.0.0:8000`
3. **SSL certificate issues**: Check certificate paths in nginx config
4. **CORS errors**: Verify Django CORS settings and nginx proxy headers

### Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Django logs (if using nohup)
tail -f nohup.out
```

### Service Management
```bash
# Restart nginx
sudo systemctl restart nginx

# Restart Django
pkill -f "manage.py runserver"
source venv/bin/activate
nohup python manage.py runserver 0.0.0.0:8000 &

# Check all services
sudo systemctl status nginx
ps aux | grep runserver
```

## Security Considerations

- **Production Settings**: Set `DEBUG = False` in Django settings
- **Secret Key**: Use environment variables for Django secret key
- **API Keys**: Never commit API keys to version control
- **SSL**: Use proper SSL certificates in production
- **Firewall**: Configure security groups and firewalls appropriately
- **Updates**: Keep all packages and system updated

## Performance Optimization

- **Static Files**: Configure Django static files serving
- **Caching**: Implement Redis or Memcached for caching
- **Database**: Use PostgreSQL for production
- **CDN**: Consider using a CDN for static assets
- **Monitoring**: Set up application monitoring and logging

## Usage

1. Open your browser to `https://your-domain.com` or `https://your-ec2-ip`
2. Enter destination, start date, and end date
3. Click "Plan Trip" to generate an AI-powered itinerary
4. View the detailed trip plan with coordinates and recommendations
5. The response will be in the same language as your destination input

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review nginx and Django logs
3. Verify all services are running
4. Test API endpoints directly with curl 