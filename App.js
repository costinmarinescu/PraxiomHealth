import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BleManager } from 'react-native-ble-plx';

export default function App() {
  const [bleManager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      bleManager.destroy();
    };
  }, []);

  const scanForDevices = () => {
    setIsScanning(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }

      // Look for PineTime devices
      if (device.name && device.name.includes('InfiniTime')) {
        console.log('Found PineTime:', device.name);
        bleManager.stopDeviceScan();
        setIsScanning(false);
        connectToDevice(device);
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      setConnectedDevice(connected);
      Alert.alert('Success', `Connected to ${device.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect to device');
    }
  };

  const disconnect = () => {
    if (connectedDevice) {
      connectedDevice.cancelConnection();
      setConnectedDevice(null);
      Alert.alert('Disconnected', 'Device disconnected');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Praxiom Health</Text>
      <Text style={styles.subtitle}>PineTime Watch Connection</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {connectedDevice ? 'Connected' : 'Not Connected'}
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
            title={isScanning ? "Scanning..." : "Scan for PineTime"}
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

      <ScrollView style={styles.infoContainer}>
        <Text style={styles.infoText}>
          This app connects to your PineTime smartwatch via Bluetooth.
          {'\n\n'}
          Make sure Bluetooth is enabled and your PineTime is nearby.
        </Text>
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  statusContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
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
    width: '100%',
    marginBottom: 20,
  },
  infoContainer: {
    flex: 1,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
