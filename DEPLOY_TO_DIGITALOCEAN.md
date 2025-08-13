# Deploy Plant Tracker to DigitalOcean App Platform

## Quick Deploy Steps (No Git Required!)

### Option 1: Deploy via DigitalOcean Dashboard (Easiest)

1. **Go to DigitalOcean App Platform**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Choose "Upload your code directly"**
   - Select "Upload your code" option (no GitHub needed)
   - Upload the `backend` folder as a ZIP file

3. **Configure the App**
   - Name: `plant-tracker-api`
   - Region: Choose closest to you (e.g., New York)
   - Instance: Basic ($5/month plan is enough)

4. **Set Build & Run Commands**
   - Build Command: `npm install`
   - Run Command: `node server-public.js`
   - HTTP Port: `3000`

5. **Add Environment Variables**
   - Click "Add Environment Variable"
   - Add these:
     - `NODE_ENV` = `production`
     - `PORT` = `3000`
     - `JWT_SECRET` = `your-secret-key-here-change-this`

6. **Deploy**
   - Click "Next" then "Create Resources"
   - Wait 2-3 minutes for deployment

7. **Get Your App URL**
   - Once deployed, you'll get a URL like:
   - `https://plant-tracker-api-xxxxx.ondigitalocean.app`

### Option 2: Using DigitalOcean CLI

```bash
# Install doctl (DigitalOcean CLI)
brew install doctl  # Mac
# or
snap install doctl  # Linux

# Authenticate
doctl auth init

# Create the app
doctl apps create --spec app.yaml

# Deploy the backend folder
cd backend
doctl apps create-deployment <app-id>
```

## Update Mobile App to Use Your DigitalOcean URL

1. Open `mobile/config.js`
2. Replace the API_URL with your DigitalOcean app URL:

```javascript
export const API_URL = 'https://your-app-name.ondigitalocean.app';
```

3. Save the file
4. Restart your Expo app

## Test Your Deployment

1. Visit your app URL in a browser: `https://your-app-name.ondigitalocean.app`
   - You should see the Plant Tracker API welcome message

2. Open the mobile app in Expo Go
   - Login with demo account (username: demo, password: demo123)
   - Take a photo and upload
   - It should work from anywhere now!

## Costs

- Basic plan: $5/month
- Includes: 512 MB RAM, 1 vCPU, 10 GB bandwidth
- Perfect for personal/small farm use
- Can handle ~100 users easily

## Troubleshooting

**App won't start?**
- Check logs in DigitalOcean dashboard
- Make sure PORT is set to 3000
- Verify build command is `npm install`

**Mobile app can't connect?**
- Verify the URL in config.js is correct
- Make sure it starts with https://
- Check that the backend is running (visit URL in browser)

**Database issues?**
- The SQLite database (plants.db) will be created automatically
- Data persists between deployments

## Free Alternative: Railway.app

If you want a free option with similar ease:
1. Visit https://railway.app
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo" or "Deploy a Template"
4. Railway offers $5 free credit monthly (enough for small apps)

## Support

The app is now accessible 24/7 from anywhere in the world!
No more localhost, no more network issues.