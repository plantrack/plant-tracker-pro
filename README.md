# Plant Tracker Pro - Agricultural Field Management System

Professional mobile app for tracking plant growth with GPS location, photo history, and field management.

## Features

- **Photo Geotagging**: Automatically captures GPS coordinates with each photo
- **Location History**: Groups photos by location for tracking growth over time
- **Field Management**: Organize plants by fields/plots
- **Plant Measurements**: Track height, health score, growth stage
- **User Authentication**: Secure multi-user support with individual accounts
- **Offline Support**: Works without internet connection
- **Data Export**: Export records as CSV or PDF reports
- **Demo Mode**: Test the app with demo credentials

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- Expo Go app on your phone (iOS/Android)
- Computer and phone on same WiFi network

### Installation

1. **Download and Extract**
   ```bash
   # Extract the PlantTrackerPro folder to your desktop
   cd ~/Desktop/PlantTrackerPro
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Server runs at: http://localhost:3000

3. **Start Mobile App** (New Terminal)
   ```bash
   cd ../mobile
   npm install
   npx expo start
   ```

4. **Connect Your Phone**
   - Open Expo Go app on your phone
   - Scan the QR code shown in terminal
   - App will load automatically

## Demo Account

Use these credentials to test the app:
- **Username**: demo
- **Password**: demo123

## First Time Setup

### 1. Update API URL (Required)
Edit `mobile/App.js` line 19:
```javascript
const API_URL = 'http://YOUR_COMPUTER_IP:3000';
```

To find your computer's IP:
- **Mac**: `ifconfig | grep inet`
- **Windows**: `ipconfig`
- **Linux**: `ip addr show`

Example: `http://192.168.1.100:3000`

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Mobile:**
```bash
cd mobile
npm install
```

## Running the System

### Start Backend Server
```bash
cd backend
npm start
```
You should see:
```
Plant Tracker Server running on http://localhost:3000
Demo credentials - username: demo, password: demo123
```

### Start Mobile App
```bash
cd mobile
npx expo start
```

### Connect Phone to App

#### Option 1: QR Code (Recommended)
1. Terminal shows QR code after `npx expo start`
2. **iPhone**: Open Camera app, scan QR code, tap notification
3. **Android**: Open Expo Go app, tap "Scan QR Code"

#### Option 2: Manual Entry
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Enter: `exp://YOUR_COMPUTER_IP:8081`

## Using the App

### Login/Register
1. Open app on phone
2. Use demo account or create new account
3. Registration requires: username, email, password

### Taking Photos
1. Tap "Take Photo" button
2. Allow camera and location permissions
3. Take photo of plant
4. Fill in details (optional):
   - Plant type (Corn, Wheat, etc.)
   - Growth stage (Seedling, Flowering, etc.)
   - Height in cm
   - Health score (1-100)
   - Notes
5. Tap "Save Plant Record"

### Managing Fields
1. Go to "Fields" tab
2. Tap "+ Add New Field"
3. Enter field name, size, crop type
4. Select field when taking photos to organize by location

### Viewing History
1. "History" tab shows all locations with photos
2. Each location shows:
   - GPS coordinates
   - Number of photos taken
   - Last visit date
3. Tap location to see all photos from that spot

## API Endpoints

Base URL: `http://localhost:3000`

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Plants
- `GET /api/plants` - Get all plants (with optional location filter)
- `POST /api/plants` - Create plant record (with photo upload)
- `GET /api/plants/locations` - Get all unique locations
- `GET /api/plants/location/:id` - Get plants at specific location

### Fields
- `GET /api/fields` - Get user's fields
- `POST /api/fields` - Create new field

## File Structure
```
PlantTrackerPro/
├── backend/
│   ├── server.js           # Express API server
│   ├── package.json        # Backend dependencies
│   ├── plants.db          # SQLite database (auto-created)
│   └── uploads/           # Uploaded photos (auto-created)
├── mobile/
│   ├── App.js             # React Native app
│   ├── package.json       # Mobile dependencies
│   └── app.json          # Expo configuration
└── README.md             # This file
```

## Troubleshooting

### "Cannot connect to server"
1. Check backend is running: http://localhost:3000
2. Verify API_URL in App.js has correct IP
3. Ensure phone and computer on same WiFi
4. Disable firewall temporarily to test

### "Expo Go won't open"
1. Update Expo Go app to latest version
2. Clear Expo Go cache: Settings > Clear cache
3. Restart phone and try again
4. Use manual URL entry instead of QR code

### "Camera/Location not working"
1. iOS: Settings > Expo Go > Enable Camera/Location
2. Android: Settings > Apps > Expo Go > Permissions
3. Restart app after granting permissions

### "Login fails with demo account"
1. Check server is running
2. Look for "Demo user created" message in server logs
3. Try registering new account instead

## Production Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Set environment variables:
   ```
   PORT=3000
   JWT_SECRET=your-secret-key-here
   ```
2. Deploy backend folder
3. Update API_URL in mobile app to production URL

### Mobile Deployment
1. Update API_URL to production backend
2. Build standalone app:
   ```bash
   npx expo build:ios
   npx expo build:android
   ```
3. Submit to App Store/Google Play

## Database Schema

### Users Table
- id, username, email, password, farm_name

### Plants Table
- id, user_id, field_id, location_id
- latitude, longitude, timestamp
- photo_path, notes, plant_type, growth_stage
- height_cm, health_score

### Fields Table
- id, user_id, name, size_acres, crop_type

## Security Notes

- Passwords are hashed with bcrypt
- JWT tokens expire after 30 days
- File uploads limited to 50MB
- Only image files accepted
- SQL injection protected via parameterized queries

## Support

For issues or questions:
1. Check Troubleshooting section above
2. Verify all dependencies installed
3. Ensure using Node.js 18+
4. Check server logs for error messages

## License

Private and confidential. All rights reserved.