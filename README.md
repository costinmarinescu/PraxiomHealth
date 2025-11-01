# Praxiom Health App 1.1

A React Native mobile application that connects to the Praxiom smartwatch and integrates health data from multiple wearable devices (Garmin, Fitbit, Apple Health, etc.).

## Features

- 🔌 **BLE Connection** - Connect to Praxiom watch via Bluetooth Low Energy
- 📊 **Health Dashboard** - View Bio-Age, Oral Health, Systemic Health, and Fitness scores
- 📥 **Data Import** - Import health data from Garmin, Fitbit, Apple Health, and other wearables
- 🔄 **Real-time Sync** - Sync health data to your Praxiom watch
- ⚙️ **Settings** - Manage app preferences and device connections

## Screenshots

### Dashboard
- Bio-Age display
- Health scores (Oral, Systemic, Fitness)
- Import and sync buttons

### Watch Connection
- BLE scanning and connection
- Connection status
- Device management

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Expo account (sign up at https://expo.dev)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/costinmarinescu/PraxiomHealth.git
cd PraxiomHealth
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure EAS Build

```bash
# Login to Expo
eas login

# Initialize EAS project
eas init

# This will create/update eas.json and link your project
```

### 4. Set Up GitHub Secrets

For automated builds via GitHub Actions, add these secrets to your repository:

1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:
   - `EXPO_TOKEN`: Your Expo access token (get from https://expo.dev/accounts/[username]/settings/access-tokens)
   - `EXPO_PROJECT_ID`: Your project ID (shown after running `eas init`)

### 5. Run the App

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Building APK/App Bundle

### Local Build

```bash
# Build Android APK (preview profile)
eas build --platform android --profile preview

# Build Android App Bundle (production)
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile preview
```

### Automated Build (GitHub Actions)

The app will automatically build when you push to the `main` branch. The workflow is defined in `.github/workflows/build-android.yml`.

## Praxiom Watch BLE Specifications

The app communicates with the Praxiom watch using the following BLE service:

### Service UUID
```
6e400001-b5a3-f393-e0a9-e50e24dcca9e
```

### Characteristics

1. **Bio-Age (Write)**
   - UUID: `6e400002-b5a3-f393-e0a9-e50e24dcca9e`
   - Format: 2 bytes, UInt16LE (bio-age * 10)
   - Example: 38.5 years → 385 (0x0181)

2. **Health Data Package (Write)**
   - UUID: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`
   - Format: 5 bytes
     - Byte 0-1: Bio-Age (UInt16LE, age * 10)
     - Byte 2: Oral Health Score (UInt8, 0-100)
     - Byte 3: Systemic Health Score (UInt8, 0-100)
     - Byte 4: Fitness Score (UInt8, 0-100)

## Importing Data from Wearables

### Supported Formats

- CSV files from Garmin Connect
- CSV files from Fitbit
- JSON exports from Apple Health
- Generic CSV/JSON health data files

### Data Fields Recognized

- Heart Rate / HR / BPM / Pulse
- Steps / Step Count
- Sleep / Sleep Duration
- Calories
- Date / Time / Timestamp

### How to Import

1. Export data from your wearable device:
   - **Garmin**: Garmin Connect → Export → CSV
   - **Fitbit**: Fitbit.com → Export Data → CSV
   - **Apple Health**: Health app → Profile → Export Health Data → Unzip and find CSV

2. In the app:
   - Go to Dashboard
   - Tap "Import Data"
   - Select your CSV/JSON file
   - Data will be processed and fitness score updated

## Project Structure

```
PraxiomHealth/
├── App.js                          # Main app component with navigation
├── app.json                        # Expo configuration
├── eas.json                        # EAS Build configuration
├── package.json                    # Dependencies
├── screens/
│   ├── DashboardScreen.js         # Main dashboard with health scores
│   ├── WatchScreen.js             # BLE connection management
│   └── SettingsScreen.js          # App settings
├── services/
│   ├── BLEService.js              # Bluetooth communication with watch
│   └── WearableDataService.js     # Import and process wearable data
├── .github/
│   └── workflows/
│       └── build-android.yml      # GitHub Actions build workflow
└── README.md
```

## Troubleshooting

### BLE Connection Issues

- Make sure Bluetooth is enabled on your phone
- Ensure the Praxiom watch is powered on and in range
- Try restarting both devices
- Check that location permissions are granted (required for BLE on Android)

### Build Errors

**Error: "EAS project not configured"**
- Run `eas init` in your project directory
- Make sure you're logged in with `eas login`

**Error: "Invalid UUID appId"**
- Update `app.json` with valid iOS bundle ID and Android package name
- Run `eas init` to configure the project

### Import Issues

- Ensure your file is in CSV or JSON format
- Check that the file contains recognizable health data columns
- Try a smaller file first to test

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or feature requests, please:
- Open an issue on GitHub
- Email: support@praxiomhealth.com
- Visit: https://github.com/costinmarinescu/PraxiomHealth

## Related Projects

- [InfiniTime Firmware](https://github.com/InfiniTimeOrg/InfiniTime) - Open source firmware for PineTime
- [Praxiom Health Firmware](https://github.com/costinmarinescu/PraxiomHealth) - Custom firmware fork for health monitoring

---

Made with ❤️ for health monitoring
