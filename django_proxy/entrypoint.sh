#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "---Starting Django Container ---"

# 1. Database readiness check (Optional for SQLite)
# python manage.py wait_for_db

# 2. Data Crawling Management (GeoPackage files)
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

# 3. Django Setup
echo "---Configuring Django (manage.py migrate)---"
# Apply database migrations
python manage.py migrate --noinput

# 4. Launch Server
echo "---Launching Server manage.py runserver 0.0.0.0:8000---"
# Use exec to let Django handle system signals (SIGTERM)
exec python manage.py runserver 0.0.0.0:8000