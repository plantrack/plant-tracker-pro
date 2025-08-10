#!/bin/bash

echo "🌱 Starting Plant Tracker Pro"
echo "============================"
echo ""

# Check if node_modules exist
if [ ! -d "backend/node_modules" ] || [ ! -d "mobile/node_modules" ]; then
    echo "❌ Dependencies not installed. Please run ./setup.sh first"
    exit 1
fi

# Start backend in background
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait for backend to start
sleep 3

# Test if backend is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start mobile app
echo "Starting mobile app..."
cd ../mobile
npx expo start --clear

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT