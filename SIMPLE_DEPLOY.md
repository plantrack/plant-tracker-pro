# SIMPLEST WAY - Deploy to Render (100% FREE)

## 1. Push to GitHub (2 minutes)
```bash
cd /Users/ponk/Desktop/chach/PlantTrackerPro
git init
git add .
git commit -m "plant tracker"
gh repo create plant-tracker --public --push
```

## 2. Deploy Backend to Render (3 minutes)
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - Name: plant-tracker-api
   - Root Directory: backend
   - Build Command: `npm install`
   - Start Command: `node server-public.js`
6. Click "Create Web Service"
7. Wait 2 minutes
8. Get URL like: `https://plant-tracker-api.onrender.com`

## 3. Update App.js with Render URL
```javascript
const API_URL = 'https://plant-tracker-api.onrender.com';
```

## 4. Publish to Expo
```bash
cd mobile
npx expo publish
```
This gives you a URL like: `exp://exp.host/@yourname/plant-tracker`

## 5. Your friend:
- Opens Expo Go
- Enters the exp.host URL
- DONE! Works from anywhere!

## That's it! No tunnels, no BS, just works!