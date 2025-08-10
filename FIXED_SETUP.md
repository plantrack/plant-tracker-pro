# Plant Tracker Pro - Fixed Setup Guide

## Issues Fixed

1. ✅ **SQLite3 native module error on macOS** - Replaced with better-sqlite3
2. ✅ **Expo SDK version mismatch** - Using SDK 51 for compatibility
3. ✅ **React version conflicts** - Using React 18.2.0
4. ✅ **Metro bundler issues** - Proper dependencies configured

## Complete Working Setup

### 1. Clean Installation

```bash
# Run the setup script
./setup.sh
```

### 2. Start the Backend Server

Open Terminal 1:
```bash
cd backend
npm start
```

You should see:
```
Demo user created - username: demo, password: demo123
Plant Tracker Server running on http://localhost:3000
```

### 3. Start the Mobile App

Open Terminal 2:
```bash
cd mobile

# For macOS users with file watcher issues, first run:
sudo launchctl limit maxfiles 524288 524288

# Then start Expo:
npx expo start
```

### 4. Run on Your Phone

1. Install **Expo Go** app from App Store or Google Play
2. Scan the QR code shown in the terminal
3. Login with demo credentials:
   - Username: `demo`
   - Password: `demo123`

## Troubleshooting

### If you get "too many open files" error on macOS:

```bash
# Increase file watcher limit (temporary)
sudo launchctl limit maxfiles 524288 524288

# Or add to your shell profile for permanent fix:
echo "ulimit -n 10240" >> ~/.zshrc
source ~/.zshrc
```

### If mobile app can't connect to backend:

1. Check your IP address is correct in `mobile/App.js`
2. Make sure both devices are on the same network
3. Check firewall settings

### To completely reset and start fresh:

```bash
# Clean everything
cd backend
rm -rf node_modules package-lock.json plants.db

cd ../mobile  
rm -rf node_modules package-lock.json .expo

# Run setup again
cd ..
./setup.sh
```

## API Endpoints

The backend provides these endpoints:

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login (returns JWT token)
- `GET /api/fields` - Get user's fields
- `POST /api/fields` - Create new field
- `GET /api/plants` - Get plant records
- `POST /api/plants` - Create plant record with photo
- `GET /api/plants/locations` - Get all unique locations

## Project Structure

```
PlantTrackerPro/
├── backend/          # Node.js + Express API
│   ├── server.js     # Main server file
│   ├── plants.db     # SQLite database
│   └── uploads/      # Photo storage
├── mobile/           # React Native + Expo app
│   ├── App.js        # Main app component
│   └── package.json  # Dependencies
├── setup.sh          # Setup script
└── start.sh          # Start script
```

## Dependencies Summary

### Backend (package.json)
- express: Web framework
- better-sqlite3: SQLite database (fixed from sqlite3)
- multer: File uploads
- cors: Cross-origin support
- bcryptjs: Password hashing
- jsonwebtoken: JWT authentication

### Mobile (package.json)
- expo: ~51.0.0 (SDK 51)
- react: 18.2.0
- react-native: 0.74.5
- expo-location: Location services
- expo-image-picker: Camera/gallery access
- @react-native-async-storage/async-storage: Local storage

## Working Demo Features

✅ User authentication with JWT
✅ Create fields for organizing plants
✅ Take photos with location tagging
✅ View plants on map
✅ Filter by location
✅ Offline data storage
✅ Demo account included

Your app is now ready to use! 🌱