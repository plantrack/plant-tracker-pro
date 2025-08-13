# Deploy to Render - One Click!

## Automatic Deployment Link

Click this link to deploy instantly:
https://dashboard.render.com/select-repo?type=web

## Manual Steps (if needed):

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Sign in with GitHub (using plantrack account)

2. **Connect Your Repository**
   - Click "New +" → "Web Service"
   - Connect to `plantrack/plant-tracker-pro`
   - Select the `main` branch

3. **Configure Service**
   - Name: `plant-tracker-pro`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server-public.js`

4. **Deploy**
   - Click "Create Web Service"
   - Wait 5 minutes for deployment

5. **Get Your URL**
   - Your backend will be at: `https://plant-tracker-pro.onrender.com`

## Update Mobile App

Once deployed, update `mobile/config.js`:
```javascript
export const API_URL = 'https://plant-tracker-pro.onrender.com';
```

Then run:
```bash
cd mobile
npm start
```

Scan the QR code with Expo Go - it works from anywhere!