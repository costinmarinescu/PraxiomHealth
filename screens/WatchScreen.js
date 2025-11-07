import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BleManager } from 'react-native-ble-plx';

export default function WatchScreen() {
  const [bleManager] = useState(new BleManager());
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [bleEnabled, setBleEnabled] = useState(false);

  useEffect(() => {
    // Check if Bluetooth is enabled
    const subscription = bleManager.onStateChange((state) => {
      setBleEnabled(state === 'PoweredOn');
    }, true);

    return () => {
      subscription.remove();
      bleManager.destroy();
    };
  }, []);

  useEffect(() => {
    // Request Bluetooth permissions for Android 12+
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      requestAndroidPermissions();
    }
  }, []);

  const requestAndroidPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      if (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Bluetooth permissions granted');
      } else {
        Alert.alert(
          'Permissions Required',
          'Bluetooth permissions are required to scan for and connect to your PineTime watch.'
        );
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const startScanning = async () => {
    if (!bleEnabled) {
      Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to scan for devices.');
      return;
    }

    setDiscoveredDevices([]);
    setIsScanning(true);

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        const deviceName = device.name.toLowerCase();
        const isPineTime =
          deviceName.includes('pine') ||
          deviceName.includes('infini') ||
          deviceName.includes('sealed') ||
          deviceName.includes('praxiom');

        if (isPineTime || showAllDevices) {
          setDiscoveredDevices((prev) => {
            // Avoid duplicates
            if (prev.find((d) => d.id === device.id)) {
              return prev;
            }
            return [...prev, { ...device, isPineTime }];
          });
        }
      }
    });

    // Stop scanning after 15 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  };

  const connectToDevice = async (device) => {
    try {
      setIsScanning(false);
      bleManager.stopDeviceScan();

      const connected = await bleManager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();

      setConnectedDevice(device);
      Alert.alert('Connected', `Successfully connected to ${device.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Failed',
        'Could not connect to the device. It may already be paired in system Bluetooth settings. Try unpairing it first.'
      );
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        await bleManager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        Alert.alert('Disconnected', 'Watch has been disconnected.');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>PRAXIOM{'\n'}HEALTH</Text>

        {/* Watch Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>PineTime Watch</Text>
          <Text style={styles.subtitle}>Sync Your Bio-Age</Text>
        </View>

        {/* Connection Status Card */}
        <View style={styles.statusCard}>
          {connectedDevice ? (
            <>
              <View style={styles.statusHeader}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.statusTitle}>Connected</Text>
              </View>
              <Text style={styles.deviceName}>{connectedDevice.name}</Text>
            </>
          ) : (
            <>
              <View style={styles.statusHeader}>
                <Text style={styles.warningIcon}>⚠</Text>
              </View>
              <Text style={styles.statusTitle}>Not Connected</Text>
            </>
          )}
        </View>

        {/* Scan Button */}
        {!connectedDevice && (
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={startScanning}
            disabled={isScanning}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan for Watch'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Disconnect Button */}
        {connectedDevice && (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectDevice}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        {/* Show All Devices Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Show All Devices (Debug)</Text>
          <Switch
            value={showAllDevices}
            onValueChange={setShowAllDevices}
            trackColor={{ false: '#D0D0D0', true: '#00CFC1' }}
            thumbColor={showAllDevices ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Device List */}
        {discoveredDevices.length > 0 && (
          <>
            <Text style={styles.devicesFoundText}>
              Found {discoveredDevices.length} device{discoveredDevices.length !== 1 ? 's' : ''}:
            </Text>
            <Text style={styles.pineTimeHint}>⭐ = Likely PineTime/InfiniTime</Text>

            {discoveredDevices.map((device) => (
              <View
                key={device.id}
                style={[
                  styles.deviceCard,
                  device.isPineTime && styles.pineTimeCard,
                ]}
              >
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>
                    {device.name} {device.isPineTime && '⭐'}
                  </Text>
                  <Text style={styles.deviceMac}>{device.id}</Text>
                  <Text style={styles.deviceSignal}>Signal: {device.rssi} dBm</Text>
                </View>
                {!connectedDevice && (
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => connectToDevice(device)}
                  >
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {/* Troubleshooting Section */}
        <View style={styles.troubleshootingCard}>
          <View style={styles.troubleshootingHeader}>
            <Text style={styles.lightbulbIcon}>💡</Text>
            <Text style={styles.troubleshootingTitle}>Troubleshooting:</Text>
          </View>
          <Text style={styles.troubleshootingText}>• Make sure watch is ON and NEARBY</Text>
          <Text style={styles.troubleshootingText}>
            • Turn on "Show All Devices" to see everything
          </Text>
          <Text style={styles.troubleshootingText}>
            • If you see your watch but can't connect, unpair it from your phone's Bluetooth settings first
          </Text>
        </View>

        {/* Firmware Notice */}
        <View style={styles.firmwareNotice}>
          <Text style={styles.firmwareText}>
            Your PineTime watch needs the Praxiom firmware installed to display Bio-Age.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 30,
    lineHeight: 22,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#999',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  warningIcon: {
    fontSize: 48,
    color: '#333',
  },
  checkmark: {
    fontSize: 36,
    color: '#4CAF50',
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceName: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  scanButton: {
    backgroundColor: '#00CFC1',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#FF5252',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  devicesFoundText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pineTimeHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pineTimeCard: {
    borderWidth: 2,
    borderColor: '#00CFC1',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceMac: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  deviceSignal: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#00CFC1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  troubleshootingCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
    marginBottom: 20,
  },
  troubleshootingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lightbulbIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  troubleshootingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  firmwareNotice: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  firmwareText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 20,
  },
});
