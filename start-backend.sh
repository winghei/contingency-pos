#!/bin/bash

# Start the backend server
echo "Starting Contingency POS Backend Server..."
echo "Server will run on http://localhost:3001"
echo "Health check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js
