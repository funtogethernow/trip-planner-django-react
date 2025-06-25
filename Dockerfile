# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        nodejs \
        npm \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Install Node.js dependencies and build React app
WORKDIR /app/frontend
RUN npm install
RUN npm run build
WORKDIR /app

# Copy React build to Django static files
RUN mkdir -p trip_planner/templates
RUN mkdir -p staticfiles
RUN cp -r frontend/build/* staticfiles/
RUN cp frontend/build/index.html trip_planner/templates/

# Run Django migrations and collect static files
RUN python manage.py migrate
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run the application
CMD ["gunicorn", "trip_planner.wsgi:application", "--bind", "0.0.0.0:8000"] 