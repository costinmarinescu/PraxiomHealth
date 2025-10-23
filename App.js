import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ScrollView, Alert, PermissionsAndroid, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BleManager } from 'react-native-ble-plx';

export default function App() {
  const [bleManager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    requestPermissions();
    
    return () => {
      bleManager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (allGranted) {
          addLog('✓ All permissions granted');
        } else {
          addLog('✗ Some permissions denied');
          Alert.alert('Permissions Required', 'Please grant all Bluetooth permissions to use this app');
        }
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          addLog('✓ Location permission granted');
        } else {
          addLog('✗ Location permission denied');
        }
      }
    }
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    addLog('Starting BLE scan...');
    
    // Check Bluetooth state
    const state = await bleManager.state();
    addLog(`Bluetooth state: ${state}`);
    
    if (state !== 'PoweredOn') {
      Alert.alert('Bluetooth Off', 'Please enable Bluetooth to scan for devices');
      setIsScanning(false);
      return;
    }

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        addLog(`Scan error: ${error.message}`);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        addLog(`Found: ${device.name} (${device.id})`);
        
        // Add device to list if not already there
        setDiscoveredDevices(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (!exists) {
            return [...prev, device];
          }
          return prev;
        });

        // Check for PineTime - it might use different names
        const pineTimeNames = ['InfiniTime', 'Pinetime', 'PineTime', 'DFU'];
        if (pineTimeNames.some(name => device.name.includes(name))) {
          addLog(`🎯 Found PineTime: ${device.name}`);
          bleManager.stopDeviceScan();
          setIsScanning(false);
          connectToDevice(device);
        }
      } else if (device) {
        // Device with no name
        addLog(`Found unnamed device: ${device.id}`);
      }
    });

    // Stop scanning after 15 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
      addLog('Scan completed');
    }, 15000);
  };

  const connectToDevice = async (device) => {
    addLog(`Connecting to ${device.name}...`);
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      addLog(`✓ Connected to ${device.name}`);
      Alert.alert('Success', `Connected to ${device.name}`);
    } catch (error) {
      addLog(`✗ Connection error: ${error.message}`);
      Alert.alert('Connection Failed', error.message);
    }
  };

  const disconnect = () => {
    if (connectedDevice) {
      connectedDevice.cancelConnection();
      setConnectedDevice(null);
      addLog('Disconnected from device');
      Alert.alert('Disconnected', 'Device disconnected');
    }
  };

  const manualConnect = (device) => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
    connectToDevice(device);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Praxiom Health</Text>
      <Text style={styles.subtitle}>PineTime Watch Connection</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {connectedDevice ? '✓ Connected' : '○ Not Connected'}
        </Text>
        {connectedDevice && (
          <Text style={styles.deviceName}>
            Device: {connectedDevice.name}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {!connectedDevice ? (
          <Button
            title={isScanning ? "Scanning..." : "Scan for Devices"}
            onPress={scanForDevices}
            disabled={isScanning}
          />
        ) : (
          <Button
            title="Disconnect"
            onPress={disconnect}
            color="#FF6B6B"
          />
        )}
      </View>

      {discoveredDevices.length > 0 && !connectedDevice && (
        <View style={styles.devicesContainer}>
          <Text style={styles.devicesTitle}>Discovered Devices:</Text>
          <ScrollView style={styles.devicesList}>
            {discoveredDevices.map((device, index) => (
              <View key={device.id} style={styles.deviceItem}>
                <Text style={styles.deviceText}>{device.name || 'Unknown Device'}</Text>
                <Button
                  title="Connect"
                  onPress={() => manualConnect(device)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Activity Log:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  deviceName: {
    fontSize: 14,
    color: '#FFA500',
  },
  buttonContainer: {
    marginBottom: 15,
  },
  devicesContainer: {
    maxHeight: 200,
    marginBottom: 15,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  devicesList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceText: {
    fontSize: 14,
    flex: 1,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
