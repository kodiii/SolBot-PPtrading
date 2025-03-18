#!/bin/bash

# Check for nvm and try to use correct Node.js version
if command -v nvm &> /dev/null; then
  echo "Using nvm to set Node.js version..."
  . "$NVM_DIR/nvm.sh"  # Source nvm
  nvm use 18.17.0 || nvm install 18.17.0
  if [ $? -ne 0 ]; then
    echo "Failed to set Node.js version using nvm"
    exit 1
  fi
else
  # Check Node.js version directly if nvm is not available
  required_version="18.17.0"
  current_version=$(node -v)

  if [[ "$current_version" < "v$required_version" ]]; then
    echo "Error: Next.js requires Node.js version >= $required_version"
    echo "Current version: $current_version"
    echo "Please install nvm or update Node.js manually"
    exit 1
  fi
fi

# Install dependencies for API server
echo "Installing API server dependencies..."
(cd src/api-server && npm install)
if [ $? -ne 0 ]; then
    echo "Failed to install API server dependencies"
    exit 1
fi

echo "=============================================="
echo "          System Startup Guide                "
echo "=============================================="
echo "Terminal 1 (this terminal):                   "
echo "- Starting API server (port 3002)             "
echo "- Starting frontend (port 3010)               "
echo "                                              "
echo "Terminal 2 (open a new terminal):             "
echo "Start the trading bot with:                   "
echo "    npm run dev                               "
echo "                                              "
echo "Wait to see 'ready - started server on        "
echo "0.0.0.0:3010' before starting the bot         "
echo "=============================================="

# Function to start the API server
start_api_server() {
  echo "Starting API server on port 3002..."
  (cd src/api-server && NODE_PATH=.. PORT=3002 npm run dev) &
  API_PID=$!
  echo "API server started with PID: $API_PID"
  
  # Wait a moment to ensure API server starts
  sleep 3
  
  # Check if API server is running
  if ! ps -p $API_PID > /dev/null; then
    echo "API server failed to start. Retrying..."
    start_api_server
  fi
}

# Start API server from project root to maintain correct paths
start_api_server

# Monitor for restart flag
(
  while true; do
    if [ -f "src/api-server/restart.flag" ]; then
      echo "Restart flag detected, restarting API server..."
      kill $API_PID 2>/dev/null || true
      rm -f "src/api-server/restart.flag"
      start_api_server
    fi
    sleep 1
  done
) &
MONITOR_PID=$!

# Clear port 3010 if it's in use
echo "Ensuring port 3010 is available..."
lsof -i :3010 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true

# Start frontend
echo "Starting frontend on port 3010..."
(cd frontend && PORT=3010 npm run dev) &
FRONTEND_PID=$!

# Handle shutdown
function cleanup {
    echo "Shutting down frontend and API server..."
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $MONITOR_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for remaining processes
wait $API_PID $FRONTEND_PID
