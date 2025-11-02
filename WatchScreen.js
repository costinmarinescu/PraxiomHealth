import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BLEService from '../services/BLEService';

export default function WatchScreen() {
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already connected
    checkConnection();
    
    // Listen for connection changes
    const unsubscribe = BLEService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        const device = BLEService.getDeviceInfo();
        setConnectedDevice(device);
      } else {
        setConnectedDevice(null);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const checkConnection = async () => {
    const connected = BLEService.getConnectionStatus();
    setIsConnected(connected);
    if (connected) {
      const device = BLEService.getDeviceInfo();
      setConnectedDevice(device);
    }
  };

  const startScan = async () => {
    setScanning(true);
    setDevices([]);

    try {
      await BLEService.scanForDevices((foundDevices) => {
        setDevices(foundDevices);
      });

      setTimeout(() => {
        setScanning(false);
        if (devices.length === 0) {
          Alert.alert(
            'No Devices Found',
            'Make sure your Praxiom watch is powered on and in range.',
            [{ text: 'OK' }]
          );
        }
      }, 10000);
    } catch (error) {
      setScanning(false);
      Alert.alert('Scan Error', error.message);
    }
  };

  const connectToDevice = async (deviceId) => {
    setConnecting(true);
    try {
      await BLEService.connectToDevice(deviceId);
      const device = BLEService.getDeviceInfo();
      setConnectedDevice(device);
      setIsConnected(true);
      setDevices([]);
      Alert.alert('Connected', 'Successfully connected to your Praxiom watch!');
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await BLEService.disconnect();
      setConnectedDevice(null);
      setIsConnected(false);
      Alert.alert('Disconnected', 'Disconnected from Praxiom watch');
    } catch (error) {
      Alert.alert('Disconnect Error', error.message);
    }
  };

  const DeviceCard = ({ device }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => connectToDevice(device.id)}
      disabled={connecting}
    >
      <View style={styles.deviceIcon}>
        <Ionicons name="watch" size={32} color="#1585B5" />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceId}>Signal: {device.rssi} dBm</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['rgba(21, 133, 181, 0.3)', 'rgba(94, 221, 238, 0.3)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Connection Status */}
        <View style={styles.statusSection}>
          {isConnected ? (
            <>
              <View style={styles.connectedIcon}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              </View>
              <Text style={styles.statusTitle}>Connected</Text>
              <Text style={styles.statusSubtitle}>
                {connectedDevice?.name || 'Praxiom Watch'}
              </Text>
              
              <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
                <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#1585B5" />
                <Text style={styles.infoText}>
                  Your watch is connected. Age and health data will sync automatically.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.disconnectedIcon}>
                <Ionicons name="watch-outline" size={64} color="#999" />
              </View>
              <Text style={styles.statusTitle}>Not Connected</Text>
              <Text style={styles.statusSubtitle}>
                Connect to your Praxiom watch to sync health data
              </Text>
            </>
          )}
        </View>

        {/* Scan/Connect Section */}
        {!isConnected && (
          <View style={styles.scanSection}>
            <TouchableOpacity
              style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
              onPress={startScan}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="bluetooth" size={24} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>
                    {devices.length > 0 ? 'Scan Again' : 'Scan for Devices'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {scanning && (
              <Text style={styles.scanningText}>Scanning for Praxiom watches...</Text>
            )}

            {/* Device List */}
            {devices.length > 0 && (
              <View style={styles.devicesSection}>
                <Text style={styles.devicesTitle}>Available Devices</Text>
                {devices.map((device) => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </View>
            )}

            {connecting && (
              <View style={styles.connectingOverlay}>
                <ActivityIndicator size="large" color="#1585B5" />
                <Text style={styles.connectingText}>Connecting...</Text>
              </View>
            )}
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Connection Tips</Text>
          
          <View style={styles.helpItem}>
            <Ionicons name="bluetooth" size={20} color="#1585B5" />
            <Text style={styles.helpText}>
              Make sure Bluetooth is enabled on your phone
            </Text>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="power" size={20} color="#1585B5" />
            <Text style={styles.helpText}>
              Ensure your Praxiom watch is powered on
            </Text>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="location" size={20} color="#1585B5" />
            <Text style={styles.helpText}>
              Keep your watch within 10 meters of your phone
            </Text>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="refresh" size={20} color="#1585B5" />
            <Text style={styles.helpText}>
              Try restarting both devices if connection fails
            </Text>
          </View>
        </View>
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
  },
  scrollContent: {
    padding: 20,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  connectedIcon: {
    marginBottom: 20,
  },
  disconnectedIcon: {
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF5350',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: 'rgba(21, 133, 181, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1585B5',
    marginLeft: 10,
    lineHeight: 18,
  },
  scanSection: {
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: '#1585B5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonDisabled: {
    backgroundColor: '#999',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  scanningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },
  devicesSection: {
    marginTop: 20,
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  deviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(21, 133, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  connectingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  helpSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
});
