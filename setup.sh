#!/bin/bash

echo "🌱 Plant Tracker Pro Setup"
echo "========================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    LOCAL_IP=$(ipconfig | grep -A 10 "Wireless LAN" | grep "IPv4" | awk '{print $NF}')
fi

echo "📍 Your local IP: $LOCAL_IP"
echo ""

# Setup backend
echo "Setting up backend..."
cd backend
echo "Cleaning previous installation..."
rm -rf node_modules package-lock.json plants.db
npm install
if [ $? -eq 0 ]; then
  echo "✅ Backend dependencies installed"
else
  echo "❌ Backend setup failed"
  exit 1
fi
echo ""

# Setup mobile
echo "Setting up mobile app..."
cd ../mobile

# Update API URL in App.js
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:3000|http://$LOCAL_IP:3000|g" App.js
else
    sed -i "s|http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:3000|http://$LOCAL_IP:3000|g" App.js
fi

echo "Cleaning previous installation..."
rm -rf node_modules package-lock.json .expo
npm install
if [ $? -eq 0 ]; then
  echo "✅ Mobile dependencies installed"
  echo "✅ API URL updated to: http://$LOCAL_IP:3000"
else
  echo "❌ Mobile setup failed"
  exit 1
fi
echo ""

# Create placeholder images if they don't exist
if [ ! -f icon.png ]; then
    touch icon.png
fi
if [ ! -f splash.png ]; then
    touch splash.png
fi
echo "✅ Placeholder images ready"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend (Terminal 1):"
echo "   cd backend"
echo "   npm start"
echo ""
echo "2. Start Mobile App (Terminal 2):"
echo "   cd mobile" 
echo "   npx expo start --clear"
echo ""
echo "3. On your phone:"
echo "   - Install Expo Go app"
echo "   - Scan the QR code"
echo ""
echo "Demo Login:"
echo "   Username: demo"
echo "   Password: demo123"
echo ""
echo "Your API URL: http://$LOCAL_IP:3000"