#!/bin/bash

# Check the status of the Contingency POS server

echo "Contingency POS Server Status:"
echo "=============================="

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed."
    exit 1
fi

# Show PM2 status
pm2 status

echo ""
echo "Recent logs:"
echo "============"
pm2 logs contingency-pos-server --lines 10 --nostream

echo ""
echo "Useful commands:"
echo "  ./start-server.sh     - Start the server"
echo "  ./stop-server.sh      - Stop the server"
echo "  npm run server:pm2:logs - View full logs"
