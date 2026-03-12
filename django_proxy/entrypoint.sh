#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e
echo "---Starting Django Container ---"

# 1. Data Crawling Management (GeoPackage files)
DATA_DIR="/app/data"
FLAG_FILE="$DATA_DIR/crawling_done.flag"
# checking if someone set skip_crawl variable too true
if [ "$SKIP_CRAWL" = "true" ]; then
    echo "--- SKIP_CRAWL is true: Skipping data update ---"
    touch "$FLAG_FILE" # Creating flag
else
    # Normal behaviour
    rm -f "$FLAG_FILE"
    echo "--- Standard Start: Preparing to crawl ---"
fi
if [ ! -f "$FLAG_FILE" ]; then
    echo "---Flag not found: Launching data crawler ---"
    # Ensure the directory exists
    mkdir -p "$DATA_DIR"

    # Run the Django management command
    python manage.py crawler_main

    echo "---Data successfully crawled ---"
else
    echo "---Data already present (Flag file detected), skipping crawl ---"
fi

# 2. Django Setup
echo "---Configuring Django (manage.py migrate)---"
# Apply database migrations
python manage.py migrate --noinput

# 3. Launch Server
if [ "$ENVIRONMENT" = "development" ]; then
    echo "---Launching Development ASGI Server (Uvicorn with live-reload)---"
    exec uvicorn proxy_project.asgi:application \
        --host 0.0.0.0 --port 8000 \
        --reload --reload-dir /app
else
    echo "---Launching Production ASGI Server (Uvicorn)---"
    exec uvicorn proxy_project.asgi:application \
        --host 0.0.0.0 --port 8000 \
        --workers 4
fi