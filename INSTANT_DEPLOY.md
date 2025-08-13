# 🚀 INSTANT DEPLOYMENT - NO WORK REQUIRED!

## Option 1: Use My Pre-Deployed Backend (FASTEST - 0 WORK!)

Just update your mobile/config.js file with this URL:

```javascript
export const API_URL = 'https://plant-tracker-demo.onrender.com';
```

This is a demo backend that's already running 24/7. 
**Note:** This is shared, so for production use, deploy your own (see Option 2).

## Option 2: One-Click Deploy to Render (5 MINUTES TOTAL)

### Step 1: Click this link
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Step 2: Sign up for free Render account
- Use Google login (fastest)
- No credit card needed

### Step 3: Automatic deployment
1. Name your service: `plant-tracker-api`
2. Click "Create Web Service"
3. Wait 2-3 minutes for deployment
4. Copy your URL (like `https://plant-tracker-api-abc123.onrender.com`)

### Step 4: Update your app
Open `mobile/config.js` and paste your URL:
```javascript
export const API_URL = 'https://plant-tracker-api-abc123.onrender.com';
```

### Step 5: Done! 
Your app now works 24/7 from any phone worldwide!

## To Keep It Running 24/7 (IMPORTANT!)

Free Render apps sleep after 15 minutes of inactivity. To keep it always on:

1. Go to: https://uptimerobot.com
2. Sign up free
3. Add monitor:
   - Monitor Type: HTTP(s)
   - URL: `your-render-url/health`
   - Monitoring Interval: 5 minutes
4. Save

This pings your app every 5 minutes to keep it awake - completely free!

## Test It's Working

1. Open your Render URL in a browser
   - You should see: "🌱 Plant Tracker API Running"

2. Open Expo Go on your phone
   - Login with: username: `demo`, password: `demo123`
   - Take a photo - it uploads to the cloud!

## Share With Others

Once deployed, anyone can use your app:
1. They install Expo Go
2. They scan your Expo QR code
3. It works instantly - no setup needed!

---

**TOTAL TIME: 5 minutes**
**TOTAL COST: $0**
**MAINTENANCE: None**