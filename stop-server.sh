#!/bin/bash

# Stop the Contingency POS server

echo "Stopping Contingency POS Server..."

# Stop the PM2 process
pm2 stop contingency-pos-server

echo "Server stopped successfully!"
echo ""
echo "To start the server again, run: ./start-server.sh"
echo "Or use: npm run server:pm2"
