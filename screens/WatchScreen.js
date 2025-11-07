import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BleManager } from 'react-native-ble-plx';

const bleManager = new BleManager();

export default function WatchScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [bleEnabled, setBleEnabled] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);

  useEffect(() => {
    checkBleState();
    requestPermissions();

    const subscription = bleManager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        setBleEnabled(true);
      } else {
        setBleEnabled(false);
      }
    }, true);

    return () => {
      subscription.remove();
      if (isScanning) {
        bleManager.stopDeviceScan();
      }
    };
  }, []);

  const checkBleState = async () => {
    const state = await bleManager.state();
    setBleEnabled(state === 'PoweredOn');
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        
        try {
          const granted = await PermissionsAndroid.requestMultiple(permissions);
          const allGranted = Object.values(granted).every(
            status => status === PermissionsAndroid.RESULTS.GRANTED
          );
          
          if (!allGranted) {
            Alert.alert(
              'Permissions Required',
              'Please grant Bluetooth and Location permissions to discover your PineTime watch.'
            );
          }
        } catch (error) {
          console.error('Permission error:', error);
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Location Permission Required',
            'Please grant Location permission to discover Bluetooth devices.'
          );
        }
      }
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
          setDiscoveredDevices(prev => {
            // Avoid duplicates
            if (prev.find(d => d.id === device.id)) {
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
        Alert.alert('Disconnected', 'Device disconnected successfully');
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>PineTime Watch</Text>
          
          {connectedDevice ? (
            <View>
              <View style={styles.statusContainer}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected to {connectedDevice.name}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={disconnectDevice}
              >
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.statusContainer}>
                <View style={bleEnabled ? styles.disconnectedDot : styles.disabledDot} />
                <Text style={bleEnabled ? styles.disconnectedText : styles.disabledText}>
                  {bleEnabled ? 'Not Connected' : 'Bluetooth Disabled'}
                </Text>
              </View>

              {/* Discovery Toggle */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Show All Devices</Text>
                <Switch
                  value={showAllDevices}
                  onValueChange={setShowAllDevices}
                  trackColor={{ false: '#ccc', true: '#00CFC1' }}
                  thumbColor={showAllDevices ? '#fff' : '#f4f3f4'}
                />
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.scanButton,
                  isScanning && styles.scanningButton,
                  !bleEnabled && styles.disabledButton
                ]}
                onPress={startScanning}
                disabled={isScanning || !bleEnabled}
              >
                <Text style={styles.buttonText}>
                  {isScanning ? 'Scanning...' : 'Scan for Devices'}
                </Text>
              </TouchableOpacity>

              {/* Discovered Devices List */}
              {discoveredDevices.length > 0 && (
                <View style={styles.devicesContainer}>
                  <Text style={styles.devicesTitle}>
                    Found {discoveredDevices.length} device(s)
                  </Text>
                  {discoveredDevices.map((device) => (
                    <TouchableOpacity
                      key={device.id}
                      style={[
                        styles.deviceItem,
                        device.isPineTime && styles.pineTimeDevice
                      ]}
                      onPress={() => connectToDevice(device)}
                    >
                      <Text style={styles.deviceName}>
                        {device.isPineTime && '⭐ '}
                        {device.name || 'Unknown Device'}
                      </Text>
                      <Text style={styles.deviceId}>{device.id}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Watch Features:</Text>
            <Text style={styles.infoText}>• Real-time Praxiom Age display</Text>
            <Text style={styles.infoText}>• Heart rate monitoring</Text>
            <Text style={styles.infoText}>• Step tracking</Text>
            <Text style={styles.infoText}>• Sleep tracking</Text>
            <Text style={styles.infoText}>• Data synchronization</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sync Status</Text>
          <Text style={styles.syncText}>
            Last synced: {connectedDevice ? 'Just now' : 'Never'}
          </Text>
          <TouchableOpacity 
            style={[styles.syncButton, !connectedDevice && styles.disabledButton]}
            disabled={!connectedDevice}
          >
            <Text style={styles.buttonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>

        {/* Troubleshooting */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Troubleshooting</Text>
          <Text style={styles.helpText}>
            Can't find your watch? Try these steps:
          </Text>
          <Text style={styles.helpText}>
            1. Make sure your PineTime is on and nearby
          </Text>
          <Text style={styles.helpText}>
            2. Enable "Show All Devices" toggle above
          </Text>
          <Text style={styles.helpText}>
            3. If paired in system Bluetooth, unpair it first
          </Text>
          <Text style={styles.helpText}>
            4. Look for devices with "InfiniTime", "Sealed", or "PineTime" in the name
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
    paddingTop: 50,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
  },
  connectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  disconnectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#999',
    marginRight: 10,
  },
  disabledDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    marginRight: 10,
  },
  connectedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  disconnectedText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  disabledText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    marginBottom: 15,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  scanningButton: {
    backgroundColor: '#999',
  },
  disconnectButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  devicesContainer: {
    marginTop: 10,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  deviceItem: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pineTimeDevice: {
    borderColor: '#00CFC1',
    borderWidth: 2,
    backgroundColor: '#f0fffe',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  syncText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
