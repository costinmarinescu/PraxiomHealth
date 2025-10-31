# Praxiom Health App - Complete Package

## What's Included

This is a complete React Native app that:

✅ **Connects to your Praxiom watch via Bluetooth**
  - Uses BLE specifications you provided
  - Sends Bio-Age data (2 bytes)
  - Sends complete health package (5 bytes: bio-age, oral health, systemic health, fitness)

✅ **Imports data from other wearables**
  - Garmin Connect (CSV)
  - Fitbit (CSV)
  - Apple Health (JSON)
  - Generic CSV/JSON files
  - Automatically calculates fitness scores from imported data

✅ **Beautiful UI with gradient background**
  - Centered fitness score
  - Round cards for all health metrics
  - Smaller header text that fits properly
  - Orange-to-teal gradient matching watch theme

✅ **Fixes your GitHub Actions error**
  - Includes proper EAS configuration
  - Workflow file ready to use
  - Instructions for setting up secrets

## Files Created

### Configuration Files
- `app.json` - Expo configuration with proper Android/iOS settings
- `eas.json` - EAS Build configuration for GitHub Actions
- `package.json` - All dependencies included
- `.gitignore` - Standard ignores for React Native/Expo

### App Code
- `App.js` - Main app with bottom tab navigation
- `screens/DashboardScreen.js` - Health dashboard with import/sync
- `screens/WatchScreen.js` - BLE connection management
- `screens/SettingsScreen.js` - App settings

### Services
- `services/BLEService.js` - Complete BLE implementation for Praxiom watch
- `services/WearableDataService.js` - Import and process wearable data

### CI/CD
- `.github/workflows/build-android.yml` - GitHub Actions workflow

### Documentation
- `README.md` - Complete project documentation
- `SETUP_GUIDE.md` - Quick setup instructions

## How to Use

### 1. Replace Your GitHub Repo Files

```bash
# Backup your current files (optional)
cd /path/to/your/PraxiomHealth
git checkout -b backup

# Copy new files
# (Copy all files from the PraxiomHealth folder to your repo)
```

### 2. Fix the GitHub Actions Error

The error you had:
> "EAS project not configured"

**Solution:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS
cd /path/to/PraxiomHealth
eas init
```

Then add these secrets to GitHub:
- `EXPO_TOKEN` - Get from https://expo.dev/accounts/[username]/settings/access-tokens
- `EXPO_PROJECT_ID` - Shown after running `eas init`

### 3. Install & Run

```bash
# Install dependencies
npm install

# Run locally
npm start

# Build APK
eas build --platform android --profile preview
```

## Key Features

### BLE Communication (services/BLEService.js)

```javascript
// Send Bio-Age
await BLEService.sendBioAge(38.5);  // Sends 385 as 2-byte UInt16LE

// Send complete health data
await BLEService.sendHealthData(
  38.5,  // Bio-Age
  85,    // Oral Health Score (0-100)
  78,    // Systemic Health Score (0-100)
  92     // Fitness Score (0-100)
);
```

### Data Import (services/WearableDataService.js)

```javascript
// Import from file
const data = await WearableDataService.importData();

// Automatically processes:
// - Heart rate data
// - Steps
// - Sleep duration
// - Calculates fitness score
```

### UI Features (screens/DashboardScreen.js)

- Bio-Age card at top
- Three health score cards (Oral, Systemic, Fitness)
- Fitness card is centered
- All cards have round corners
- Gradient background matching watch
- Import and sync buttons
- Real-time connection status

## Testing Checklist

### BLE Connection
- [ ] Watch is powered on
- [ ] Bluetooth enabled on phone
- [ ] App can scan and find watch
- [ ] Connection establishes successfully
- [ ] Can send Bio-Age data
- [ ] Can send complete health package

### Data Import
- [ ] Can select CSV file
- [ ] Can select JSON file
- [ ] Data is parsed correctly
- [ ] Fitness score updates
- [ ] Metrics display properly

### UI
- [ ] Gradient background visible
- [ ] Header text fits properly
- [ ] Fitness card is centered
- [ ] All cards have round corners
- [ ] Navigation works (Dashboard/Watch/Settings)
- [ ] Buttons respond correctly

### GitHub Actions
- [ ] Secrets configured
- [ ] Push triggers build
- [ ] Build completes successfully
- [ ] APK is available for download

## Next Steps

1. **Copy files to your repository**
2. **Run `eas init` to fix the build error**
3. **Configure GitHub secrets**
4. **Push to GitHub**
5. **Test the app with your Praxiom watch**

## Support

If you encounter issues:
1. Check SETUP_GUIDE.md for common problems
2. Check README.md for detailed documentation
3. Verify your watch firmware has the correct BLE service UUIDs
4. Ensure all permissions are granted (Bluetooth, Location)

---

Everything you need is ready! Just copy the files and follow the setup steps. 🚀
