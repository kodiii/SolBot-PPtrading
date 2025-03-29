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

# Define the restart flag path
RESTART_FLAG="restart.flag"

# Start API server
echo "Starting API server on port 3002..."
# Remove any existing restart flag before starting
if [ -f "$RESTART_FLAG" ]; then
    echo "Removing existing restart flag..."
    rm "$RESTART_FLAG"
fi

# Start the API server
(cd src/api-server && NODE_PATH=.. PORT=3002 npm run dev) &
API_PID=$!
echo "API server started with PID: $API_PID"

# Wait a moment to ensure API server starts
sleep 3

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
    kill $FRONTEND_PID 2>/dev/null || true
    kill $API_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Monitor for restart flag in a loop
echo "Monitoring for restart flag at $RESTART_FLAG (in current working directory)"
while true; do
    # Check if the restart flag exists
    if [ -f "$RESTART_FLAG" ]; then
        echo "Restart flag detected at $(date)"
        
        # Kill the current API server process
        if [ -n "$API_PID" ]; then
            echo "Stopping API server with PID: $API_PID"
            kill $API_PID
            wait $API_PID 2>/dev/null || true
        fi
        
        # Remove the restart flag
        echo "Removing restart flag..."
        rm "$RESTART_FLAG"
        
        # Start a new API server
        echo "Starting new API server process..."
        (cd src/api-server && NODE_PATH=.. PORT=3002 npm run dev) &
        API_PID=$!
        echo "API server restarted with new PID: $API_PID"
    fi
    
    # Check if processes are still running
    if ! kill -0 $API_PID 2>/dev/null; then
        echo "API server process is no longer running. Restarting..."
        (cd src/api-server && NODE_PATH=.. PORT=3002 npm run dev) &
        API_PID=$!
        echo "API server restarted with new PID: $API_PID"
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Frontend process is no longer running. Exiting..."
        cleanup
    fi
    
    # Sleep for a short time before checking again
    sleep 2
done
