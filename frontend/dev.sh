#!/bin/bash

# Load nvm (if it exists)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  

# Install Node.js 18.17.0 if not already installed
nvm install 18.17.0

# Use Node.js 18.17.0
nvm use 18.17.0

# Start the development server
npm run dev
