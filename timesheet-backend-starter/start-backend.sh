#!/bin/bash

# Kill any existing backend processes
pkill -f "tsx src/server.ts" 2>/dev/null || true

# Start the backend server
echo "Starting backend server..."
npx tsx src/server.ts

# If the server exits, restart it
echo "Backend server stopped, restarting..."
exec "$0"

