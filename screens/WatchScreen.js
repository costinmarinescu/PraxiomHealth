import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PraxiomBackground from '../components/PraxiomBackground';
import WearableService from '../services/WearableService';

const WatchScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [heartRate, setHeartRate] = useState(null);
  const [steps, setSteps] = useState(null);
  const [showAllDevices, setShowAllDevices] = useState(false); // ✅ ADDED: Debug toggle

  useEffect(() => {
    checkConnection();
    loadDebugPreference(); // ✅ ADDED: Load saved debug preference
    
    // Subscribe to data updates
    const unsubscribeData = WearableService.onDataUpdate((data) => {
      if (data.heartRate) setHeartRate(data.heartRate);
      if (data.steps !== undefined) setSteps(data.steps);
      if (data.battery) setBatteryLevel(data.battery);
    });

    // Subscribe to connection changes
    const unsubscribeConnection = WearableService.onConnectionChange((isConnected) => {
      setConnected(isConnected);
      if (!isConnected) {
        setConnectedDevice(null);
        setHeartRate(null);
        setSteps(null);
        setBatteryLevel(null);
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeConnection();
    };
  }, []);

  // ✅ ADDED: Load debug preference from storage
  const loadDebugPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('showAllBLEDevices');
      if (saved !== null) {
        setShowAllDevices(saved === 'true');
      }
    } catch (error) {
      console.error('Error loading debug preference:', error);
    }
  };

  // ✅ ADDED: Save debug preference to storage
  const toggleDebugMode = async (value) => {
    try {
      setShowAllDevices(value);
      await AsyncStorage.setItem('showAllBLEDevices', value.toString());
    } catch (error) {
      console.error('Error saving debug preference:', error);
    }
  };

  const checkConnection = async () => {
    const isConnected = WearableService.isConnected();
    setConnected(isConnected);
    
    if (isConnected) {
      const lastDevice = await AsyncStorage.getItem('lastDeviceName');
      setConnectedDevice(lastDevice);
      
      // Get latest data
      const data = WearableService.getLatestData();
      setHeartRate(data.heartRate);
      setSteps(data.steps);
      setBatteryLevel(data.battery);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      setDevices([]);
      
      const foundDevices = await WearableService.scanForDevices(10000);
      
      // ✅ UPDATED: Filter devices based on debug toggle
      let filteredDevices = foundDevices;
      if (!showAllDevices) {
        // Only show InfiniTime/PineTime watches
        filteredDevices = foundDevices.filter(device => {
          const name = device.name?.toLowerCase() || '';
          return name.includes('infinit') || 
                 name.includes('pinetime') || 
                 name.includes('sealed');
        });
      }
      
      setDevices(filteredDevices);
      
      if (filteredDevices.length === 0) {
        const message = showAllDevices 
          ? 'No BLE devices found nearby. Make sure Bluetooth is enabled.'
          : 'No PineTime watches found. Make sure your watch is nearby with Bluetooth enabled.\n\nTip: Enable "Show All Devices" to see other BLE devices.';
        
        Alert.alert('No Devices Found', message);
      }
    } catch (error) {
      Alert.alert('Scan Error', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (deviceId, deviceName) => {
    try {
      setScanning(true);
      await WearableService.connectToDevice(deviceId);
      
      await AsyncStorage.setItem('lastDeviceId', deviceId);
      await AsyncStorage.setItem('lastDeviceName', deviceName);
      await AsyncStorage.setItem('watchConnected', 'true');
      
      setConnected(true);
      setConnectedDevice(deviceName);
      setDevices([]);
      
      Alert.alert('Connected!', `Successfully connected to ${deviceName}`);
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await WearableService.disconnect();
      await AsyncStorage.setItem('watchConnected', 'false');
      
      setConnected(false);
      setConnectedDevice(null);
      setHeartRate(null);
      setSteps(null);
      setBatteryLevel(null);
      
      Alert.alert('Disconnected', 'Watch disconnected successfully');
    } catch (error) {
      Alert.alert('Disconnect Error', error.message);
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => handleConnect(item.id, item.name)}
    >
      <Ionicons name="watch" size={32} color="#00d4ff" />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <PraxiomBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="watch" size={40} color="#00d4ff" />
          <Text style={styles.title}>PineTime Watch</Text>
        </View>

        {/* ✅ ADDED: Debug Toggle */}
        {!connected && (
          <View style={styles.debugCard}>
            <View style={styles.debugRow}>
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Debug Mode</Text>
                <Text style={styles.debugText}>
                  {showAllDevices 
                    ? 'Showing all BLE devices' 
                    : 'Showing InfiniTime watches only'}
                </Text>
              </View>
              <Switch
                value={showAllDevices}
                onValueChange={toggleDebugMode}
                trackColor={{ false: '#2a2a3e', true: '#00d4ff' }}
                thumbColor={showAllDevices ? '#ffffff' : '#8e8e93'}
              />
            </View>
          </View>
        )}

        {connected ? (
          <View style={styles.connectedContainer}>
            <View style={styles.statusCard}>
              <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
              <Text style={styles.statusTitle}>Connected</Text>
              <Text style={styles.deviceNameLarge}>{connectedDevice}</Text>
            </View>

            <View style={styles.dataGrid}>
              <View style={styles.dataCard}>
                <Ionicons name="heart" size={32} color="#ef4444" />
                <Text style={styles.dataValue}>
                  {heartRate || '--'}
                </Text>
                <Text style={styles.dataLabel}>Heart Rate (bpm)</Text>
              </View>

              <View style={styles.dataCard}>
                <Ionicons name="walk" size={32} color="#4ade80" />
                <Text style={styles.dataValue}>
                  {steps !== null ? steps.toLocaleString() : '--'}
                </Text>
                <Text style={styles.dataLabel}>Steps</Text>
              </View>

              <View style={styles.dataCard}>
                <Ionicons name="battery-half" size={32} color="#fbbf24" />
                <Text style={styles.dataValue}>
                  {batteryLevel !== null ? `${batteryLevel}%` : '--'}
                </Text>
                <Text style={styles.dataLabel}>Battery</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Ionicons name="close-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.disconnectedContainer}>
            <View style={styles.instructionsCard}>
              <Ionicons name="information-circle" size={32} color="#00d4ff" />
              <Text style={styles.instructionsText}>
                Make sure your PineTime watch is nearby with Bluetooth enabled
              </Text>
            </View>

            {devices.length > 0 && (
              <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
                style={styles.deviceList}
              />
            )}

            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="scan" size={24} color="#fff" />
                  <Text style={styles.buttonText}>
                    {devices.length > 0 ? 'Scan Again' : 'Scan for Devices'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </PraxiomBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
  },
  // ✅ ADDED: Debug toggle styles
  debugCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  debugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debugInfo: {
    flex: 1,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  connectedContainer: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ade80',
    marginTop: 10,
  },
  deviceNameLarge: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 5,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  dataValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginTop: 10,
  },
  dataLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 5,
    textAlign: 'center',
  },
  disconnectedContainer: {
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 15,
    lineHeight: 20,
  },
  deviceList: {
    flex: 1,
    marginBottom: 20,
  },
  deviceCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deviceId: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#4ade80',
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
});

export default WatchScreen;
