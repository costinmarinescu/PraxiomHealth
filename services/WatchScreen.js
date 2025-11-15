import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import WearableService from '../services/WearableService';

const WatchScreen = () => {
  const navigation = useNavigation();
  
  // State with safe defaults
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [wearableData, setWearableData] = useState({
    heartRate: 0,
    steps: 0,
    hrv: 0,
    battery: 0,
    isConnected: false
  });

  // Load initial state safely
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // Initialize BLE if needed
        await WearableService.init();
        
        // Get current connection status
        updateWearableData();
      } catch (error) {
        console.error('Watch screen init error:', error);
        // Don't crash - just log the error
      }
    };

    initializeScreen();

    // Poll for data updates
    const interval = setInterval(updateWearableData, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const updateWearableData = useCallback(() => {
    try {
      const data = WearableService.getLatestData();
      const status = WearableService.getConnectionStatus();
      
      setWearableData({
        heartRate: data.heartRate || 0,
        steps: data.steps || 0,
        hrv: data.hrv || 0,
        battery: data.battery || 0,
        isConnected: status.isConnected || false
      });

      if (status.isConnected && status.deviceName) {
        setConnectedDevice({
          name: status.deviceName,
          id: status.deviceId
        });
      } else {
        setConnectedDevice(null);
      }
    } catch (error) {
      console.error('Update wearable data error:', error);
      // Don't crash - just use defaults
    }
  }, []);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);
      
      const foundDevices = await WearableService.scanForDevices();
      setDevices(foundDevices || []);
      
      if (!foundDevices || foundDevices.length === 0) {
        Alert.alert(
          'No Devices Found',
          'Make sure your watch is nearby, powered on, and not connected to another device.'
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', error.message || 'Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (deviceId, deviceName) => {
    try {
      setIsConnecting(true);
      
      const success = await WearableService.connectToDevice(deviceId);
      
      if (success) {
        setConnectedDevice({ id: deviceId, name: deviceName });
        Alert.alert('Connected', `Successfully connected to ${deviceName}`);
        setDevices([]); // Clear device list after successful connection
      } else {
        Alert.alert('Connection Failed', 'Could not connect to device');
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', error.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
      updateWearableData();
    }
  };

  const handleDisconnect = async () => {
    try {
      const success = await WearableService.disconnect();
      
      if (success) {
        setConnectedDevice(null);
        setWearableData({
          heartRate: 0,
          steps: 0,
          hrv: 0,
          battery: 0,
          isConnected: false
        });
        Alert.alert('Disconnected', 'Watch disconnected successfully');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert('Disconnect Error', error.message || 'Failed to disconnect');
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FDC830', '#37B7C3', '#088395']}
      style={styles.gradient}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.title}>PineTime Watch</Text>

        {/* Connection Status */}
        {connectedDevice ? (
          <View style={styles.connectedCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
            <Text style={styles.deviceName}>{connectedDevice.name}</Text>
            
            {/* Wearable Data Display */}
            <View style={styles.dataRow}>
              <View style={styles.dataCard}>
                <Text style={styles.dataIcon}>❤️</Text>
                <Text style={styles.dataValue}>
                  {wearableData.heartRate > 0 ? wearableData.heartRate : '--'}
                </Text>
                <Text style={styles.dataLabel}>Heart Rate (bpm)</Text>
              </View>

              <View style={styles.dataCard}>
                <Text style={styles.dataIcon}>👟</Text>
                <Text style={styles.dataValue}>
                  {wearableData.steps > 0 ? wearableData.steps.toLocaleString() : '0'}
                </Text>
                <Text style={styles.dataLabel}>Steps</Text>
              </View>
            </View>

            <View style={styles.dataRow}>
              <View style={styles.dataCard}>
                <Text style={styles.dataIcon}>🔋</Text>
                <Text style={styles.dataValue}>
                  {wearableData.battery > 0 ? `${wearableData.battery}%` : '--'}
                </Text>
                <Text style={styles.dataLabel}>Battery</Text>
              </View>

              <View style={styles.dataCard}>
                <Text style={styles.dataIcon}>📊</Text>
                <Text style={styles.dataValue}>
                  {wearableData.hrv > 0 ? Math.round(wearableData.hrv) : '--'}
                </Text>
                <Text style={styles.dataLabel}>HRV (ms)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>❌ Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.disconnectedCard}>
            <Text style={styles.disconnectedText}>No watch connected</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.scanButtonText}>🔍 Scan for Devices</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Device List */}
        {devices.length > 0 && !connectedDevice && (
          <View style={styles.devicesCard}>
            <Text style={styles.devicesTitle}>Available Devices</Text>
            {devices.map((device, index) => (
              <TouchableOpacity
                key={device.id || index}
                style={styles.deviceItem}
                onPress={() => handleConnect(device.id, device.name)}
                disabled={isConnecting}
              >
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceItemName}>
                    {device.name?.includes('InfiniTime') || 
                     device.name?.includes('Sealed') || 
                     device.name?.includes('Pine') 
                      ? '⭐ ' : ''}
                    {device.name}
                  </Text>
                  <Text style={styles.deviceItemRssi}>
                    Signal: {device.rssi} dBm
                  </Text>
                </View>
                {isConnecting ? (
                  <ActivityIndicator color="#088395" />
                ) : (
                  <Text style={styles.connectIcon}>→</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Instructions */}
        {!connectedDevice && devices.length === 0 && !isScanning && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📱 How to Connect</Text>
            <Text style={styles.instructionsText}>
              1. Make sure your PineTime watch is powered on{'\n'}
              2. Wake up the watch (tap the screen){'\n'}
              3. Tap "Scan for Devices" above{'\n'}
              4. Select your watch from the list{'\n'}
              5. Once connected, you'll see live data
            </Text>
            <Text style={styles.helpText}>
              {'\n'}Tip: If your watch doesn't appear, make sure it's not connected to another device or app.
            </Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  connectedCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disconnectedCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 30,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  disconnectedText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dataCard: {
    flex: 1,
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  dataIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#37B7C3',
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 11,
    color: '#BDC3C7',
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#088395',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disconnectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  devicesCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  deviceItemRssi: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  connectIcon: {
    fontSize: 24,
    color: '#088395',
  },
  instructionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  instructionsText: {
    fontSize: 14,
    color: '#34495E',
    lineHeight: 22,
  },
  helpText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
});

export default WatchScreen;
