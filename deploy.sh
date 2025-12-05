#!/bin/bash
# PythonAnywhere Auto-Deploy Script
# This script pulls latest changes from GitHub and restarts the web app

# Set up variables
PROJECT_DIR="/home/YOURUSERNAME/gistme_backend"
VENV_PATH="/home/YOURUSERNAME/.virtualenvs/gistme_env"

# Navigate to project directory
cd "$PROJECT_DIR"

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Pull latest changes from GitHub
echo "Pulling latest changes..."
git fetch origin master
git reset --hard origin/master

# Install any new dependencies
echo "Installing dependencies..."
pip install -r requirements.txt --quiet

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Touch WSGI file to reload the web app
echo "Reloading web app..."
touch /var/www/YOURUSERNAME_pythonanywhere_com_wsgi.py

echo "Deployment complete!"
