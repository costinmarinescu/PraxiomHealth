// screens/WatchScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import WearableService from '../services/WearableService';

export default function WatchScreen() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [currentSteps, setCurrentSteps] = useState(0);
  const [currentHR, setCurrentHR] = useState(0);
  const [currentHRV, setCurrentHRV] = useState(0);

  useEffect(() => {
    checkConnection();
    
    // Subscribe to watch data
    const unsubscribe = WearableService.onDataReceived((data) => {
      if (data.type === 'steps') setCurrentSteps(data.value);
      if (data.type === 'heartRate') setCurrentHR(data.value);
      if (data.type === 'hrv') setCurrentHRV(data.value);
    });

    return () => unsubscribe();
  }, []);

  const checkConnection = () => {
    const status = WearableService.getConnectionStatus();
    if (status.connected) {
      setConnectedDevice(status);
      setConnectionStatus('connected');
    }
  };

  const startScan = () => {
    setScanning(true);
    setDevices([]);

    WearableService.scanForPineTime((device) => {
      setDevices(prev => {
        const exists = prev.find(d => d.id === device.id);
        if (exists) return prev;
        return [...prev, device];
      });
    });

    // Stop scan after 10 seconds
    setTimeout(() => {
      stopScan();
    }, 10000);
  };

  const stopScan = () => {
    setScanning(false);
    WearableService.stopScan();
  };

  const connectToDevice = async (device) => {
    stopScan();
    setConnectionStatus('connecting');

    const result = await WearableService.connectToPineTime(device.id);
    
    if (result.success) {
      setConnectedDevice({
        deviceId: device.id,
        deviceName: device.name,
        provider: 'pinetime',
        connected: true,
      });
      setConnectionStatus('connected');
      Alert.alert('Success', `Connected to ${device.name}`);
    } else {
      setConnectionStatus('disconnected');
      Alert.alert('Connection Failed', result.error);
    }
  };

  const disconnect = async () => {
    const result = await WearableService.disconnectPineTime();
    if (result.success) {
      setConnectedDevice(null);
      setConnectionStatus('disconnected');
      setCurrentSteps(0);
      setCurrentHR(0);
      setCurrentHRV(0);
      Alert.alert('Disconnected', 'Watch disconnected successfully');
    }
  };

  const setupAppleHealth = async () => {
    const result = await WearableService.initializeAppleHealth();
    if (result.success) {
      Alert.alert('Success', 'Apple HealthKit connected!');
      setConnectedDevice({
        provider: 'apple',
        deviceName: 'Apple HealthKit',
        connected: true,
      });
      setConnectionStatus('connected');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const setupHealthConnect = async () => {
    const result = await WearableService.initializeHealthConnect();
    if (result.success) {
      Alert.alert('Success', 'Health Connect enabled!');
      setConnectedDevice({
        provider: 'healthconnect',
        deviceName: 'Health Connect',
        connected: true,
      });
      setConnectionStatus('connected');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => connectToDevice(item)}
      disabled={connectionStatus === 'connecting'}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <Text style={styles.connectText}>Connect</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Connect Wearables</Text>

        {/* Connection Status */}
        {connectedDevice ? (
          <View style={styles.connectedCard}>
            <View style={styles.statusHeader}>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>● Connected</Text>
              </View>
            </View>
            
            <Text style={styles.connectedDeviceName}>{connectedDevice.deviceName}</Text>
            <Text style={styles.connectedProvider}>
              {connectedDevice.provider === 'pinetime' && '⌚ PineTime Watch'}
              {connectedDevice.provider === 'apple' && '🍎 Apple HealthKit'}
              {connectedDevice.provider === 'healthconnect' && '🤖 Health Connect'}
            </Text>

            {/* Real-time Data (PineTime only) */}
            {connectedDevice.provider === 'pinetime' && (
              <View style={styles.dataContainer}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Steps</Text>
                  <Text style={styles.dataValue}>{currentSteps}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Heart Rate</Text>
                  <Text style={styles.dataValue}>{currentHR} bpm</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>HRV</Text>
                  <Text style={styles.dataValue}>{currentHRV.toFixed(1)} ms</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.disconnectedCard}>
            <Text style={styles.disconnectedText}>No device connected</Text>
          </View>
        )}

        {/* PineTime/Praxiom Watch Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⌚ PineTime/Praxiom Watch</Text>
          
          {scanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color="#00CFC1" />
              <Text style={styles.scanningText}>Scanning for devices...</Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopScan}>
                <Text style={styles.stopButtonText}>Stop Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={startScan}
              disabled={connectionStatus === 'connecting'}
            >
              <Text style={styles.scanButtonText}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Scan for Watch'}
              </Text>
            </TouchableOpacity>
          )}

          {devices.length > 0 && (
            <FlatList
              data={devices}
              renderItem={renderDevice}
              keyExtractor={(item) => item.id}
              style={styles.deviceList}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Apple HealthKit Section (iOS only) */}
        {Platform.OS === 'ios' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍎 Apple HealthKit</Text>
            <Text style={styles.sectionDesc}>
              Import data from iPhone & Apple Watch
            </Text>
            <TouchableOpacity
              style={styles.platformButton}
              onPress={setupAppleHealth}
            >
              <Text style={styles.platformButtonText}>Connect HealthKit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Health Connect Section (Android only) */}
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 Health Connect</Text>
            <Text style={styles.sectionDesc}>
              Import data from Wear OS, Fitbit, Samsung Health, and more
            </Text>
            <TouchableOpacity
              style={styles.platformButton}
              onPress={setupHealthConnect}
            >
              <Text style={styles.platformButtonText}>Connect Health Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Coming Soon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔜 Coming Soon</Text>
          <TouchableOpacity
            style={[styles.platformButton, styles.disabledButton]}
            onPress={() => WearableService.connectGarmin()}
          >
            <Text style={styles.platformButtonText}>Garmin Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.platformButton, styles.disabledButton]}
            onPress={() => WearableService.connectFitbit()}
          >
            <Text style={styles.platformButtonText}>Fitbit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DCC8',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  connectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 25,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#27AE60',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  statusHeader: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  connectedBadge: {
    backgroundColor: '#00FF88',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  connectedBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectedDeviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  connectedProvider: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  dataItem: {
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  disconnectButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disconnectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 25,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  disconnectedText: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  scanButton: {
    backgroundColor: '#00CFC1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanningContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scanningText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 15,
  },
  stopButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deviceList: {
    marginTop: 15,
  },
  deviceCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
  },
  connectText: {
    color: '#00CFC1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  platformButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  platformButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
