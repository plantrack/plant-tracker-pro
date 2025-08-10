#!/bin/bash

echo "🌍 Starting Plant Tracker Pro with PUBLIC Internet Access"
echo "=========================================================="
echo ""

# Check if backend is running
if ! lsof -i :3000 > /dev/null; then
    echo "⚠️  Backend not running. Starting it first..."
    cd backend
    npm start &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
    sleep 3
fi

# Start localtunnel
echo ""
echo "📡 Creating public tunnel..."
npx localtunnel --port 3000 --print-requests &
TUNNEL_PID=$!

# Wait for tunnel URL
sleep 5

echo ""
echo "===================================="
echo "🎉 YOUR APP IS NOW PUBLIC!"
echo "===================================="
echo ""
echo "Share this URL with your friend:"
echo "👉 The URL appears above (https://....loca.lt)"
echo ""
echo "Instructions for your friend:"
echo "1. Open Expo Go app"
echo "2. Scan YOUR QR code"
echo "3. When prompted by localtunnel, enter any password"
echo "4. Login: username: demo, password: demo123"
echo ""
echo "⚠️  IMPORTANT: Keep this terminal open!"
echo "Press Ctrl+C to stop the public access"
echo ""

# Keep running
wait $TUNNEL_PID

# Cleanup
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
fi