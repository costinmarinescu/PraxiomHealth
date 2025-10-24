import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Praxiom Health",
  slug: "praxiom-health",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#FFA500"
  },
  plugins: [
    [
      "react-native-ble-plx",
      {
        isBackgroundEnabled: true,
        modes: ["peripheral", "central"],
        bluetoothAlwaysPermission: "Allow Praxiom Health to connect to your PineTime watch"
      }
    ]
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.praxiom.health",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSBluetoothAlwaysUsageDescription: "Allow Praxiom Health to connect to your PineTime watch",
      NSBluetoothPeripheralUsageDescription: "Allow Praxiom Health to connect to your PineTime watch"
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFA500"
    },
    package: "com.praxiom.health",
    permissions: [
      "BLUETOOTH",
      "BLUETOOTH_ADMIN",
      "BLUETOOTH_CONNECT",
      "BLUETOOTH_SCAN",
      "ACCESS_FINE_LOCATION"
    ]
  },
  extra: {
    eas: {
      projectId: "your-project-id-here"
    }
  },
  cli: {
    appVersionSource: "remote"
  }
});
