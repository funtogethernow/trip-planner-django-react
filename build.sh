#!/bin/bash

echo "🚀 Starting deployment build process..."

# Activate virtual environment
echo "🐍 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies and build React app
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install --legacy-peer-deps
echo "🔨 Building React application..."
npm run build
cd ..

# Copy React build to Django static files
echo "📁 Copying React build to Django static files..."
mkdir -p trip_planner/templates
mkdir -p staticfiles
cp -r frontend/build/* staticfiles/
cp frontend/build/index.html trip_planner/templates/

# Run Django migrations
echo "🗄️ Running Django migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build process completed successfully!"
echo "🎯 Your application is ready for deployment!" 