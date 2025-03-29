#!/bin/bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node.js 18.17.0
nvm install 18.17.0
nvm use 18.17.0

# Verify Node.js version
node -v

# Run the development environment
./dev.sh
