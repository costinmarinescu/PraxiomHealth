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

  useEffect(() => {
    // Graceful BLE initialization with retry logic
    initializeBluetooth();

    return () => {
      manager.destroy();
    };
  }, []);

  const initializeBluetooth = async () => {
    try {
      // Give the system time to initialize BLE
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check BLE state
      const state = await manager.state();
      setBleState(state);
      
      if (state === 'PoweredOn') {
        setIsInitializing(false);
        return;
      }

      // If not powered on, wait a bit and check again
      if (state === 'Unknown' || state === 'Resetting') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryState = await manager.state();
        setBleState(retryState);
        
        if (retryState === 'PoweredOn') {
          setIsInitializing(false);
          return;
        }
      }

      // If still not ready, set up a state listener
      const subscription = manager.onStateChange((state) => {
        setBleState(state);
        if (state === 'PoweredOn') {
          setIsInitializing(false);
          subscription.remove();
        }
      }, true);

      // Stop showing initialization after 3 seconds regardless
      setTimeout(() => setIsInitializing(false), 3000);

    } catch (error) {
      console.log('BLE initialization:', error);
      setIsInitializing(false);
      // Don't show error - let user try scanning anyway
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startScan = async () => {
    // Check if Bluetooth is enabled before scanning
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
        'Bluetooth permissions are required to scan for devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
    setDevices([]);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setIsScanning(false);
        return;
      }

      if (device && device.name && device.name.includes('Pine')) {
        setDevices(prevDevices => {
          const exists = prevDevices.find(d => d.id === device.id);
          if (!exists) {
            return [...prevDevices, device];
          }
          return prevDevices;
        });
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device) => {
    try {
      setIsScanning(false);
      manager.stopDeviceScan();

      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      
      setConnectedDevice(connected);
      Alert.alert(
        'Connected!',
        `Successfully connected to ${device.name}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Failed',
        'Could not connect to the watch. Please try again.',
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

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <Text style={styles.connectText}>Connect</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
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

              {devices.length > 0 ? (
                <View style={styles.devicesContainer}>
                  <Text style={styles.devicesTitle}>Available Watches:</Text>
                  <FlatList
                    data={devices}
                    renderItem={renderDevice}
                    keyExtractor={item => item.id}
                    style={styles.deviceList}
                  />
                </View>
              ) : (
                !isScanning && (
                  <Text style={styles.noDevicesText}>No watches found</Text>
                )
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Make sure your PineTime is turned on and nearby
            </Text>
          </View>

          <View style={styles.firmwareNotice}>
            <Text style={styles.firmwareText}>
              Your PineTime watch needs the Praxiom firmware installed to display Bio-Age.
            </Text>
          </View>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  initializingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7F8C8D',
  },
  connectedContainer: {
    flex: 1,
  },
  notConnectedContainer: {
    flex: 1,
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
  devicesContainer: {
    marginTop: 20,
    flex: 1,
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  deviceList: {
    flex: 1,
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
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  deviceId: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 4,
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
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#7F8C8D',
  },
  firmwareNotice: {
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#00CFC1',
    padding: 15,
    marginTop: 10,
  },
  firmwareText: {
    fontSize: 12,
    color: '#2C3E50',
    textAlign: 'center',
  },
});
