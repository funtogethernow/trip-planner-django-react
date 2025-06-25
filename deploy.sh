#!/bin/bash

# Deployment script for Trip Planner application
# Supports multiple deployment platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ -z "$OPENAI_API_KEY" ]; then
        print_warning "OPENAI_API_KEY is not set"
    else
        print_success "OPENAI_API_KEY is set"
    fi
    
    if [ -z "$REACT_APP_GOOGLE_MAPS_API_KEY" ]; then
        print_warning "REACT_APP_GOOGLE_MAPS_API_KEY is not set"
    else
        print_success "REACT_APP_GOOGLE_MAPS_API_KEY is set"
    fi
}

# Build the application
build_app() {
    print_status "Building application..."
    ./build.sh
    print_success "Application built successfully"
}

# Deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Heroku app exists
    if ! heroku apps:info &> /dev/null; then
        print_status "Creating new Heroku app..."
        heroku create
    fi
    
    # Set environment variables
    if [ ! -z "$OPENAI_API_KEY" ]; then
        heroku config:set OPENAI_API_KEY="$OPENAI_API_KEY"
    fi
    
    if [ ! -z "$REACT_APP_GOOGLE_MAPS_API_KEY" ]; then
        heroku config:set REACT_APP_GOOGLE_MAPS_API_KEY="$REACT_APP_GOOGLE_MAPS_API_KEY"
    fi
    
    # Deploy
    git add .
    git commit -m "Deploy to Heroku"
    git push heroku main
    
    print_success "Deployed to Heroku successfully!"
    heroku open
}

# Deploy using Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Build Docker image
    docker build -t trip-planner .
    
    # Run container
    docker run -d \
        --name trip-planner-app \
        -p 8000:8000 \
        -e OPENAI_API_KEY="$OPENAI_API_KEY" \
        -e REACT_APP_GOOGLE_MAPS_API_KEY="$REACT_APP_GOOGLE_MAPS_API_KEY" \
        trip-planner
    
    print_success "Docker container started successfully!"
    print_status "Application is running at http://localhost:8000"
}

# Deploy using Docker Compose
deploy_docker_compose() {
    print_status "Deploying with Docker Compose..."
    
    docker-compose up -d
    
    print_success "Docker Compose deployment completed!"
    print_status "Application is running at http://localhost:8000"
}

# Deploy to production server
deploy_production() {
    print_status "Deploying to production server..."
    
    # Set production environment variables
    export DEBUG=False
    export DJANGO_SETTINGS_MODULE=trip_planner.settings_production
    
    # Build the application
    build_app
    
    # Start with gunicorn
    gunicorn trip_planner.wsgi:application --bind 0.0.0.0:8000 --workers 4
    
    print_success "Production deployment completed!"
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    # Check environment variables
    check_env_vars
    
    # Parse command line arguments
    case "${1:-help}" in
        "heroku")
            deploy_heroku
            ;;
        "docker")
            deploy_docker
            ;;
        "docker-compose")
            deploy_docker_compose
            ;;
        "production")
            deploy_production
            ;;
        "build")
            build_app
            ;;
        "help"|*)
            echo "Usage: $0 {heroku|docker|docker-compose|production|build|help}"
            echo ""
            echo "Deployment options:"
            echo "  heroku         - Deploy to Heroku"
            echo "  docker         - Deploy using Docker"
            echo "  docker-compose - Deploy using Docker Compose"
            echo "  production     - Deploy to production server"
            echo "  build          - Build the application only"
            echo "  help           - Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  OPENAI_API_KEY              - OpenAI API key"
            echo "  REACT_APP_GOOGLE_MAPS_API_KEY - Google Maps API key"
            ;;
    esac
}

# Run main function
main "$@" 