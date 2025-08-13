#!/bin/bash

# Wait for server to be ready
# Usage: ./wait-for-server.sh <url> <max_attempts>

URL=${1:-"http://localhost:8001"}
MAX_ATTEMPTS=${2:-30}
SLEEP_TIME=2

echo "Waiting for server at $URL to be ready..."

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
  if curl -f -s "$URL" > /dev/null 2>&1; then
    echo "✅ Server is ready after $attempt attempts"
    exit 0
  fi
  
  echo "Attempt $attempt/$MAX_ATTEMPTS: Server not ready yet, waiting ${SLEEP_TIME}s..."
  sleep $SLEEP_TIME
  attempt=$((attempt + 1))
done

echo "❌ Server failed to start after $MAX_ATTEMPTS attempts"
exit 1