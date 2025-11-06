import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { LinearGradient } from 'expo-linear-gradient';

const manager = new BleManager();

export default function WatchScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [bleState, setBleState] = useState('Unknown');
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);

  useEffect(() => {
    initializeBluetooth();

    return () => {
      manager.destroy();
    };
  }, []);

  const initializeBluetooth = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const state = await manager.state();
      setBleState(state);
      
      if (state === 'PoweredOn') {
        setIsInitializing(false);
        return;
      }

      if (state === 'Unknown' || state === 'Resetting') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryState = await manager.state();
        setBleState(retryState);
        
        if (retryState === 'PoweredOn') {
          setIsInitializing(false);
          return;
        }
      }

      const subscription = manager.onStateChange((state) => {
        setBleState(state);
        if (state === 'PoweredOn') {
          setIsInitializing(false);
          subscription.remove();
        }
      }, true);

      setTimeout(() => setIsInitializing(false), 3000);

    } catch (error) {
      console.log('BLE initialization:', error);
      setIsInitializing(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          
          const allGranted = 
            granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
          
          setHasPermissions(allGranted);
          return allGranted;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'Bluetooth scanning requires location permission on Android.',
              buttonPositive: 'OK',
            }
          );
          
          const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
          setHasPermissions(isGranted);
          return isGranted;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        Alert.alert(
          'Permission Error',
          'There was an error requesting permissions. Please grant Bluetooth and Location permissions in Settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    setHasPermissions(true);
    return true;
  };

  const startScan = async () => {
    const state = await manager.state();
    if (state !== 'PoweredOn') {
      Alert.alert(
        'Bluetooth Disabled',
        'Please enable Bluetooth in your device settings to scan for watches.',
        [{ text: 'OK' }]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permissions Required',
        'Bluetooth and Location permissions are required to scan for devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              if (Platform.OS === 'android') {
                try {
                  const { Linking } = require('react-native');
                  Linking.openSettings();
                } catch (e) {
                  console.log('Cannot open settings');
                }
              }
            }
          }
        ]
      );
      return;
    }

    setIsScanning(true);
    setDevices([]);

    let foundDevices = new Map(); // Use Map to avoid duplicates

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        
        if (error.message && error.message.includes('permission')) {
          Alert.alert(
            'Permission Denied',
            'Bluetooth permissions were denied. Please enable them in Settings.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      if (device) {
        // Show ALL devices if toggle is on, or only PineTime-related devices
        const deviceName = device.name || 'Unknown';
        const shouldShow = showAllDevices || 
                          deviceName.toLowerCase().includes('pine') ||
                          deviceName.toLowerCase().includes('infini') ||
                          deviceName.toLowerCase().includes('sealed');
        
        if (shouldShow && !foundDevices.has(device.id)) {
          foundDevices.set(device.id, device);
          
          setDevices(Array.from(foundDevices.values()).sort((a, b) => {
            // Sort: named devices first, then by signal strength
            if (!a.name && b.name) return 1;
            if (a.name && !b.name) return -1;
            return (b.rssi || -100) - (a.rssi || -100);
          }));
        }
      }
    });

    // Stop scanning after 15 seconds (longer for better detection)
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
      
      if (foundDevices.size === 0) {
        Alert.alert(
          'No Devices Found',
          'Make sure your watch is:\n• Powered on\n• Nearby (within 10 feet)\n• Not connected to another device\n• Bluetooth is enabled\n\nTry turning "Show All Devices" on to see everything.',
          [{ text: 'OK' }]
        );
      }
    }, 15000);
  };

  const connectToDevice = async (device) => {
    try {
      setIsScanning(false);
      manager.stopDeviceScan();

      Alert.alert(
        'Connecting...',
        `Attempting to connect to ${device.name || device.id}`,
        [{ text: 'OK' }]
      );

      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      
      setConnectedDevice(connected);
      Alert.alert(
        'Connected!',
        `Successfully connected to ${device.name || 'device'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Failed',
        `Could not connect: ${error.message}\n\nMake sure the watch is not paired in your phone's Bluetooth settings.`,
        [{ text: 'OK' }]
      );
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        await manager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        Alert.alert('Disconnected', 'Watch has been disconnected.', [{ text: 'OK' }]);
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  };

  const renderDevice = ({ item }) => {
    const isPineTime = item.name && (
      item.name.toLowerCase().includes('pine') ||
      item.name.toLowerCase().includes('infini')
    );
    
    return (
      <TouchableOpacity
        style={[styles.deviceItem, isPineTime && styles.pineTimeDevice]}
        onPress={() => connectToDevice(item)}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>
            {item.name || 'Unnamed Device'}
            {isPineTime && ' ⭐'}
          </Text>
          <Text style={styles.deviceId}>{item.id}</Text>
          {item.rssi && (
            <Text style={styles.rssi}>Signal: {item.rssi} dBm</Text>
          )}
        </View>
        <Text style={styles.connectText}>Connect</Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.watchIcon} />
          </View>
          <Text style={styles.title}>PineTime Watch</Text>
          <Text style={styles.subtitle}>Sync Your Bio-Age</Text>
        </View>

        {isInitializing ? (
          <View style={styles.initializingContainer}>
            <ActivityIndicator size="large" color="#00CFC1" />
            <Text style={styles.initializingText}>Initializing Bluetooth...</Text>
          </View>
        ) : (
          <>
            {connectedDevice ? (
              <View style={styles.connectedContainer}>
                <View style={styles.statusCard}>
                  <Text style={styles.statusText}>✓ Connected</Text>
                  <Text style={styles.deviceNameText}>{connectedDevice.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={disconnectDevice}
                >
                  <Text style={styles.buttonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.notConnectedContainer}>
                <View style={styles.statusCard}>
                  <Text style={styles.statusIcon}>⚠</Text>
                  <Text style={styles.statusText}>Not Connected</Text>
                </View>
                
                <TouchableOpacity
                  style={[styles.scanButton, isScanning && styles.scanningButton]}
                  onPress={startScan}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <ActivityIndicator color="#FFF" style={styles.buttonLoader} />
                      <Text style={styles.buttonText}>Scanning...</Text>
                    </>
                  ) : (
                    <Text style={styles.buttonText}>Scan for Watch</Text>
                  )}
                </TouchableOpacity>

                {/* Toggle to show all devices */}
                <TouchableOpacity
                  style={styles.toggleContainer}
                  onPress={() => setShowAllDevices(!showAllDevices)}
                >
                  <View style={[styles.toggle, showAllDevices && styles.toggleActive]}>
                    <View style={[styles.toggleDot, showAllDevices && styles.toggleDotActive]} />
                  </View>
                  <Text style={styles.toggleLabel}>Show All Devices (Debug)</Text>
                </TouchableOpacity>

                {devices.length > 0 ? (
                  <View style={styles.devicesContainer}>
                    <Text style={styles.devicesTitle}>
                      Found {devices.length} device{devices.length !== 1 ? 's' : ''}:
                    </Text>
                    <Text style={styles.devicesHint}>
                      ⭐ = Likely PineTime/InfiniTime
                    </Text>
                    <FlatList
                      data={devices}
                      renderItem={renderDevice}
                      keyExtractor={item => item.id}
                      style={styles.deviceList}
                      scrollEnabled={false}
                    />
                  </View>
                ) : (
                  !isScanning && hasPermissions && (
                    <Text style={styles.noDevicesText}>
                      No devices found yet{'\n'}
                      Tap "Scan for Watch" to start
                    </Text>
                  )
                )}
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                <Text style={styles.bold}>Troubleshooting:{'\n'}</Text>
                • Make sure watch is ON and NEARBY{'\n'}
                • Turn on "Show All Devices" to see everything{'\n'}
                • If you see your watch but can't connect, unpair it from your phone's Bluetooth settings first
              </Text>
            </View>

            <View style={styles.firmwareNotice}>
              <Text style={styles.firmwareText}>
                Your PineTime watch needs the Praxiom firmware installed to display Bio-Age.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 15,
  },
  watchIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#00CFC1',
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  initializingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7F8C8D',
  },
  connectedContainer: {
    marginBottom: 20,
  },
  notConnectedContainer: {
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  deviceNameText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 5,
  },
  scanButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#00CFC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  scanningButton: {
    backgroundColor: '#95E4DC',
  },
  disconnectButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonLoader: {
    marginRight: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#BDC3C7',
    padding: 2,
    marginRight: 10,
  },
  toggleActive: {
    backgroundColor: '#00CFC1',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleDotActive: {
    transform: [{ translateX: 22 }],
  },
  toggleLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  devicesContainer: {
    marginTop: 10,
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  devicesHint: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  deviceList: {
    maxHeight: 400,
  },
  deviceItem: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pineTimeDevice: {
    borderWidth: 2,
    borderColor: '#00CFC1',
    backgroundColor: '#F0FFFE',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  deviceId: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 4,
  },
  rssi: {
    fontSize: 11,
    color: '#7F8C8D',
    marginTop: 2,
  },
  connectText: {
    color: '#00CFC1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDevicesText: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 16,
    marginTop: 20,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  firmwareNotice: {
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00CFC1',
    padding: 15,
    marginBottom: 20,
  },
  firmwareText: {
    fontSize: 12,
    color: '#2C3E50',
    textAlign: 'center',
  },
});
