# Quick Setup Guide

## Fix GitHub Actions Build Error

The error you encountered:
```
EAS project not configured.
Must configure EAS project by running 'eas init' before this command can be run in non-interactive mode.
```

### Solution:

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```
   Enter your Expo credentials (create account at https://expo.dev if needed)

3. **Initialize EAS Project**
   ```bash
   cd /path/to/PraxiomHealth
   eas init
   ```
   This will:
   - Create/update `eas.json`
   - Link your project to Expo
   - Generate a project ID

4. **Add GitHub Secrets**
   
   a. Get your Expo token:
   - Go to https://expo.dev/accounts/[your-username]/settings/access-tokens
   - Create a new token
   - Copy it
   
   b. Get your project ID:
   - After running `eas init`, note the project ID shown
   - Or find it in `app.json` under `extra.eas.projectId`
   
   c. Add to GitHub:
   - Go to your repo: Settings → Secrets and variables → Actions
   - Add new secrets:
     - Name: `EXPO_TOKEN`, Value: [your token]
     - Name: `EXPO_PROJECT_ID`, Value: [your project ID]

5. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure EAS build"
   git push
   ```

The GitHub Actions workflow will now build successfully!

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android (with device/emulator)
npm run android
```

## Test BLE Connection

1. Make sure your Praxiom watch is:
   - Powered on
   - Running the firmware with BLE service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
   - Within Bluetooth range

2. In the app:
   - Go to "Watch" tab
   - Tap "Connect to Watch"
   - Wait for connection to establish

3. Once connected:
   - Go to "Dashboard" tab
   - Tap "Sync to Watch"
   - Health data will be sent to your watch

## Import Data from Other Wearables

1. Export data from your device:
   - Garmin: Garmin Connect app → Settings → Export
   - Fitbit: Fitbit.com → Account → Export Data
   - Apple Health: Health app → Profile → Export

2. In the app:
   - Dashboard → "Import Data"
   - Select your CSV/JSON file
   - App will process and display metrics

## Build APK

```bash
# Build preview APK
eas build --platform android --profile preview

# Download will be available from Expo dashboard
```

## Common Issues

### "Cannot find module 'expo-linear-gradient'"
```bash
npx expo install expo-linear-gradient
```

### "Bluetooth permission denied"
- Go to Android Settings → Apps → Praxiom Health → Permissions
- Enable Location and Bluetooth

### "Watch not found"
- Ensure watch firmware has the correct BLE service UUID
- Check watch is not connected to another device
- Restart both phone and watch

---

Need help? Check the full README.md or open an issue on GitHub.
