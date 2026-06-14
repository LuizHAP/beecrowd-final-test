#!/bin/bash
# Export Swagger JSON from the running NestJS API
# Usage: npm run swagger:export

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="$PROJECT_DIR/swagger.json"

# Start the app in the background
cd "$PROJECT_DIR"
PORT=3099 node dist/main.js &
APP_PID=$!

# Wait for the app to be ready
echo "Waiting for API to start..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:3099/api-json > /dev/null 2>&1; then
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: API did not start in time"
    kill $APP_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Fetch swagger JSON
echo "Fetching swagger.json from running API..."
curl -s http://127.0.0.1:3099/api-json > "$OUTPUT_FILE"

# Stop the app
kill $APP_PID 2>/dev/null
wait $APP_PID 2>/dev/null

echo "Swagger JSON exported to $OUTPUT_FILE"
echo "Size: $(wc -c < "$OUTPUT_FILE") bytes"
