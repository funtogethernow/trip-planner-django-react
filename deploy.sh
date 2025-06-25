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

# Build the frontend React application
build_frontend() {
    print_status "Building frontend React application..."
    
    cd frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Build the React app
    print_status "Building React app..."
    npm run build
    
    cd ..
    print_success "Frontend built successfully"
}

# Collect Django static files
collect_static() {
    print_status "Collecting Django static files..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Collect static files
    python manage.py collectstatic --noinput
    
    print_success "Static files collected successfully"
}

# Build the application (frontend + static files)
build_app() {
    print_status "Building complete application..."
    build_frontend
    collect_static
    print_success "Application built successfully"
}

# Deploy to development server
deploy_dev() {
    print_status "Deploying to development server..."
    
    # Build the application
    build_app
    
    # Check if port 8000 is already in use
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 8000 is already in use. Stopping existing process..."
        pkill -f "python manage.py runserver" || true
        sleep 2
    fi
    
    # Start Django development server
    print_status "Starting Django development server..."
    source venv/bin/activate
    nohup python manage.py runserver 0.0.0.0:8000 > nohup.out 2>&1 &
    
    print_success "Development server started successfully!"
    print_status "Application is running at http://localhost:8000"
    print_status "Check nohup.out for server logs"
}

# Stop development server
stop_dev() {
    print_status "Stopping development server..."
    
    pkill -f "python manage.py runserver" || true
    print_success "Development server stopped"
}

# Restart development server
restart_dev() {
    print_status "Restarting development server..."
    stop_dev
    sleep 2
    deploy_dev
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

# Show server status
show_status() {
    print_status "Checking server status..."
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        print_success "Development server is running on port 8000"
        echo "Process info:"
        ps aux | grep "python manage.py runserver" | grep -v grep || true
    else
        print_warning "No development server running on port 8000"
    fi
    
    if [ -f "nohup.out" ]; then
        print_status "Recent server logs (last 10 lines):"
        tail -10 nohup.out
    fi
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    # Check environment variables
    check_env_vars
    
    # Parse command line arguments
    case "${1:-help}" in
        "dev")
            deploy_dev
            ;;
        "stop")
            stop_dev
            ;;
        "restart")
            restart_dev
            ;;
        "status")
            show_status
            ;;
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
        "frontend")
            build_frontend
            ;;
        "static")
            collect_static
            ;;
        "help"|*)
            echo "Usage: $0 {dev|stop|restart|status|heroku|docker|docker-compose|production|build|frontend|static|help}"
            echo ""
            echo "Deployment options:"
            echo "  dev            - Deploy to development server (build + run Django dev server)"
            echo "  stop           - Stop development server"
            echo "  restart        - Restart development server"
            echo "  status         - Show server status and recent logs"
            echo "  heroku         - Deploy to Heroku"
            echo "  docker         - Deploy using Docker"
            echo "  docker-compose - Deploy using Docker Compose"
            echo "  production     - Deploy to production server"
            echo "  build          - Build the complete application (frontend + static files)"
            echo "  frontend       - Build frontend React application only"
            echo "  static         - Collect Django static files only"
            echo "  help           - Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  OPENAI_API_KEY              - OpenAI API key"
            echo "  REACT_APP_GOOGLE_MAPS_API_KEY - Google Maps API key"
            echo ""
            echo "Examples:"
            echo "  $0 dev        # Build and start development server"
            echo "  $0 restart    # Restart development server"
            echo "  $0 status     # Check server status"
            echo "  $0 build      # Build without starting server"
            ;;
    esac
}

# Run main function
main "$@" 