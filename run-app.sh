#!/bin/bash

echo "🌱 Plant Tracker Pro - Quick Start"
echo "=================================="
echo ""

# Check dependencies
if [ ! -d "backend/node_modules" ] || [ ! -d "mobile/node_modules" ]; then
    echo "⚠️  Dependencies not installed. Running setup..."
    ./setup.sh
fi

# Fix macOS file watcher limit
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Setting file watcher limit for macOS..."
    sudo launchctl limit maxfiles 524288 524288 2>/dev/null || true
    ulimit -n 10240
fi

# Get local IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    LOCAL_IP=$(ipconfig | grep -A 10 "Wireless LAN" | grep "IPv4" | awk '{print $NF}')
fi

echo ""
echo "📱 Instructions:"
echo "----------------"
echo ""
echo "1. Open a NEW terminal and run:"
echo "   cd $(pwd)/backend"
echo "   npm start"
echo ""
echo "2. Open ANOTHER terminal and run:"
echo "   cd $(pwd)/mobile"
echo "   npx expo start"
echo ""
echo "3. Install Expo Go on your phone"
echo "4. Scan the QR code"
echo ""
echo "📍 Your API URL: http://$LOCAL_IP:3000"
echo "👤 Demo Login: username: demo, password: demo123"
echo ""
echo "Press Enter to start the backend server..."
read

# Start backend
cd backend
echo "Starting backend server..."
npm start