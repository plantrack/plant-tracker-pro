#!/bin/bash

# Automated Render Deployment Script
echo "🚀 Starting automated deployment to Render..."

# Create a Blueprint for one-click deployment
cat > render.yaml << 'EOF'
services:
  - type: web
    name: plant-tracker-pro-live
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server-public.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
    healthCheckPath: /health
    repo: https://github.com/plantrack/plant-tracker-pro
EOF

echo "✅ Blueprint created"

# Create deployment URL
DEPLOY_URL="https://render.com/deploy?repo=https://github.com/plantrack/plant-tracker-pro"

echo ""
echo "📱 DEPLOYMENT READY!"
echo ""
echo "Your app is configured for deployment. Here's your one-click deploy link:"
echo ""
echo "👉 $DEPLOY_URL"
echo ""
echo "This link will:"
echo "1. Deploy your backend automatically"
echo "2. Give you a live URL (https://plant-tracker-pro-live.onrender.com)"
echo "3. Keep it running 24/7 for free"
echo ""
echo "After deployment, update mobile/config.js with your Render URL"