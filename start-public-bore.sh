#!/bin/bash

echo "🌍 Plant Tracker Pro - PUBLIC ACCESS SETUP"
echo "=========================================="
echo ""

# Kill any existing backend
pkill -f "node server" 2>/dev/null

# Start backend
echo "Starting backend server..."
cd backend
node server-public.js &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
sleep 2

# Download bore if not exists
if [ ! -f "../bore" ]; then
    echo "Downloading bore tunnel client..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Mac
        if [[ $(uname -m) == "arm64" ]]; then
            curl -L https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-aarch64-apple-darwin.tar.gz | tar xz
        else
            curl -L https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-apple-darwin.tar.gz | tar xz
        fi
    else
        # Linux
        curl -L https://github.com/ekzhang/bore/releases/download/v0.5.0/bore-v0.5.0-x86_64-unknown-linux-musl.tar.gz | tar xz
    fi
    mv bore ../
    chmod +x ../bore
fi

# Start bore tunnel
echo ""
echo "📡 Creating public tunnel..."
cd ..
./bore local 3000 --to bore.pub &
BORE_PID=$!

# Wait for tunnel to establish
sleep 3

echo ""
echo "=========================================="
echo "🎉 YOUR APP IS NOW PUBLIC!"
echo "=========================================="
echo ""
echo "Your public URL will appear above like:"
echo "https://bore.pub:XXXXX"
echo ""
echo "UPDATE App.js with this URL!"
echo ""
echo "For your friend:"
echo "1. Update mobile/App.js with the bore.pub URL"
echo "2. Restart Expo: cd mobile && npx expo start"
echo "3. Friend scans YOUR QR code"
echo "4. Login: demo / demo123"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep running
wait

# Cleanup
kill $BACKEND_PID 2>/dev/null
kill $BORE_PID 2>/dev/null