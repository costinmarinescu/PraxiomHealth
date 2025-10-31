# 🚀 Quick Deployment Commands

## Fix the GitHub Actions Error

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Login to Expo
eas login
# Enter your credentials (create account at expo.dev if needed)

# 3. Navigate to your project
cd /path/to/PraxiomHealth

# 4. Initialize EAS (THIS FIXES THE ERROR!)
eas init
# This will:
# - Create/update eas.json
# - Link project to Expo
# - Show you the project ID (save this!)

# 5. Get your Expo token
# Visit: https://expo.dev/accounts/YOUR_USERNAME/settings/access-tokens
# Click "Create Token"
# Copy the token (you'll need it for GitHub)

# 6. Add GitHub Secrets
# Go to: https://github.com/costinmarinescu/PraxiomHealth/settings/secrets/actions
# Click "New repository secret"
# 
# Add two secrets:
#   Name: EXPO_TOKEN
#   Value: [paste your token from step 5]
#
#   Name: EXPO_PROJECT_ID  
#   Value: [the project ID from step 4]

# 7. Push to GitHub
git add .
git commit -m "Fix EAS configuration and add complete app"
git push

# ✅ GitHub Actions will now build successfully!
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Scan QR code with Expo Go app on your phone
# OR press 'a' for Android emulator
# OR press 'i' for iOS simulator
```

## Build APK Locally

```bash
# Build preview APK (smaller, faster)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile preview

# Check build status
eas build:list
```

## Testing the App

```bash
# 1. Make sure your Praxiom watch is running firmware with:
#    Service UUID: 6e400001-b5a3-f393-e0a9-e50e24dcca9e

# 2. Run the app
npm start

# 3. In the app:
#    - Go to "Watch" tab
#    - Tap "Connect to Watch"
#    - Once connected, go to "Dashboard"
#    - Tap "Sync to Watch" to send health data

# 4. To import wearable data:
#    - Export CSV/JSON from Garmin/Fitbit/Apple Health
#    - In Dashboard, tap "Import Data"
#    - Select your file
#    - Fitness score will update automatically
```

## Update Your GitHub Repo

```bash
# If you already have a PraxiomHealth repo:

# 1. Backup current branch (optional)
git checkout -b backup-old-version

# 2. Go back to main
git checkout main

# 3. Copy all files from the PraxiomHealth folder here to your repo
#    (replace existing files)

# 4. Run EAS init
eas init

# 5. Commit and push
git add .
git commit -m "Complete app with BLE, data import, and fixed builds"
git push

# 6. Add GitHub secrets as shown above

# Done! ✅
```

## Troubleshooting Commands

```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start -c

# Check EAS configuration
eas config

# View build logs
eas build:list
eas build:view [BUILD_ID]

# Test BLE permissions (Android)
adb shell pm list permissions | grep BLUETOOTH

# View device logs
npx react-native log-android
npx react-native log-ios
```

## Quick File Check

```bash
# Verify all important files exist:
ls -la app.json eas.json package.json App.js
ls -la screens/
ls -la services/
ls -la .github/workflows/

# Should see:
# ✓ app.json
# ✓ eas.json  
# ✓ package.json
# ✓ App.js
# ✓ screens/DashboardScreen.js
# ✓ screens/WatchScreen.js
# ✓ screens/SettingsScreen.js
# ✓ services/BLEService.js
# ✓ services/WearableDataService.js
# ✓ .github/workflows/build-android.yml
```

## Most Important Commands

```bash
# Fix the error:
eas init

# Build APK:
eas build --platform android --profile preview

# Run locally:
npm start
```

---

That's it! These commands will get you up and running. 🎉
