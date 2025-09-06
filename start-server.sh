#!/bin/bash

# Start the Contingency POS server using PM2
# This script will start the server and keep it running even if the terminal is closed

echo "Starting Contingency POS Server with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Stop any existing instance
pm2 stop contingency-pos-server 2>/dev/null || true
pm2 delete contingency-pos-server 2>/dev/null || true

# Start the server
pm2 start ecosystem.config.js

# Show status
echo ""
echo "Server started! Here's the current status:"
pm2 status

echo ""
echo "Useful commands:"
echo "  npm run server:pm2:status  - Check server status"
echo "  npm run server:pm2:logs    - View server logs"
echo "  npm run server:pm2:stop    - Stop the server"
echo "  npm run server:pm2:restart - Restart the server"
echo ""
echo "The server will continue running even if you close this terminal."
echo "Access your app at: http://localhost:8080"
