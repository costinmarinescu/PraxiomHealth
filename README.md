# 🏥 Praxiom Health - Bio-Age Monitoring System

Complete mobile app for biological age assessment through integrated oral-systemic biomarker analysis.

## Features

- 📊 Comprehensive biomarker tracking (oral + systemic)
- 🧬 Tier 1 Bio-Age calculation algorithm
- ⌚ Two-way communication with PineTime watch
- 📱 Real-time health score monitoring
- 🔄 Automatic watch synchronization

## Building

This app is automatically built using GitHub Actions and EAS Build.

### Automatic Builds

Every push to `main` branch triggers an automatic build.

### Manual Build

1. Go to Actions tab
2. Click "Build Praxiom Health App"
3. Click "Run workflow"
4. Download APK from expo.dev

## Download

Latest builds available at: https://expo.dev/@YOUR_USERNAME/praxiom-health

## Setup Watch

1. Flash PineTime with Praxiom firmware
2. Open app and tap "Connect Watch"
3. Enter biomarker data
4. Tap "Calculate & Sync to Watch"

## Technology Stack

- React Native + Expo
- BLE integration (react-native-ble-plx)
- EAS Build for CI/CD
- GitHub Actions automation

## License

MIT License - Open Source
