import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BLEService from '../services/BLEService';

export default function WatchScreen() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [watchData, setWatchData] = useState({
    battery: '--',
    steps: '--',
    heartRate: '--',
    o2Sat: '--',
  });
  const [lastSync, setLastSync] = useState('Never');

  useEffect(() => {
    // Try auto-reconnect on mount
    attemptAutoReconnect();
    
    // Setup BLE listener
    BLEService.addListener(handleBLEData);
    
    return () => {
      BLEService.removeListener(handleBLEData);
    };
  }, []);

  const attemptAutoReconnect = async () => {
    setConnectionStatus('connecting');
    const connected = await BLEService.autoReconnect();
    if (connected) {
      setConnectionStatus('connected');
      setConnectedDevice(BLEService.device);
      setLastSync('Just now');
    } else {
      setConnectionStatus('disconnected');
    }
  };

  const handleBLEData = (data) => {
    setLastSync('Just now');
    
    if (data.praxiomAge !== undefined) {
      setWatchData(prev => ({ ...prev, age: data.praxiomAge }));
    }
    if (data.heartRate !== undefined) {
      setWatchData(prev => ({ ...prev, heartRate: data.heartRate }));
    }
    if (data.steps !== undefined) {
      setWatchData(prev => ({ ...prev, steps: data.steps }));
    }
    if (data.o2Saturation !== undefined) {
      setWatchData(prev => ({ ...prev, o2Sat: data.o2Saturation }));
    }
  };

  const handleScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);
      
      await BLEService.scanForDevices((device) => {
        setDevices(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (!exists) {
            return [...prev, device];
          }
          return prev;
        });
      });
      
      setTimeout(() => {
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      setIsScanning(false);
      Alert.alert('Scan Error', error.message);
    }
  };

  const handleConnect = async (device) => {
    try {
      setConnectionStatus('connecting');
      BLEService.stopScan();
      setIsScanning(false);
      
      await BLEService.connectToDevice(device.id);
      
      setConnectionStatus('connected');
      setConnectedDevice(device);
      setLastSync('Just now');
      setDevices([]);
      
      Alert.alert('Connected', `Successfully connected to ${device.name}`);
    } catch (error) {
      setConnectionStatus('disconnected');
      Alert.alert('Connection Error', error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await BLEService.disconnect();
      setConnectionStatus('disconnected');
      setConnectedDevice(null);
      setWatchData({
        battery: '--',
        steps: '--',
        heartRate: '--',
        o2Sat: '--',
      });
      Alert.alert('Disconnected', 'Watch has been disconnected');
    } catch (error) {
      Alert.alert('Error', 'Failed to disconnect');
    }
  };

  const handleSync = async () => {
    setLastSync('Syncing...');
    
    // Simulated sync - in real app, this would trigger data fetch from watch
    setTimeout(() => {
      setLastSync('Just now');
      Alert.alert('Sync Complete', 'Watch data has been synchronized');
    }, 1500);
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => handleConnect(item)}
    >
      <View>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <Text style={styles.connectText}>Connect</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['rgba(255, 107, 53, 0.3)', 'rgba(0, 0, 0, 0.9)', 'rgba(0, 188, 212, 0.3)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Watch Status</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#FF6B35' }
          ]} />
          <Text style={styles.statusText}>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             'Disconnected'}
          </Text>
        </View>

        {connectionStatus === 'disconnected' && (
          <>
            <TouchableOpacity 
              style={styles.button} 
              onPress={handleScan}
              disabled={isScanning}
            >
              <Text style={styles.buttonText}>
                {isScanning ? 'Scanning...' : 'Scan for Watches'}
              </Text>
            </TouchableOpacity>

            {devices.length > 0 && (
              <View style={styles.devicesContainer}>
                <Text style={styles.devicesTitle}>Available Devices</Text>
                <FlatList
                  data={devices}
                  renderItem={renderDevice}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {!isScanning && devices.length === 0 && (
              <Text style={styles.helpText}>
                Tap "Scan for Watches" to find your Praxiom Watch
              </Text>
            )}
          </>
        )}

        {connectionStatus === 'connected' && (
          <>
            {/* Watch Data Section */}
            <View style={styles.dataContainer}>
              <Text style={styles.sectionTitle}>Watch Data</Text>
              
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Battery</Text>
                  <Text style={styles.dataValue}>{watchData.battery}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Steps</Text>
                  <Text style={styles.dataValue}>{watchData.steps}</Text>
                </View>
              </View>

              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Heart Rate</Text>
                  <Text style={styles.dataValue}>{watchData.heartRate}</Text>
                  <Text style={styles.dataUnit}>bpm</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>O₂ Saturation</Text>
                  <Text style={styles.dataValue}>{watchData.o2Sat}</Text>
                  <Text style={styles.dataUnit}>%</Text>
                </View>
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Device</Text>
              <Text style={styles.infoValue}>
                {connectedDevice?.name || 'Praxiom Watch'}
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Last Sync</Text>
              <Text style={styles.infoValue}>{lastSync}</Text>
            </View>

            {/* Sync Button */}
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <Text style={styles.buttonText}>🔄 Sync Data Now</Text>
            </TouchableOpacity>

            {/* Disconnect Button */}
            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 15,
  },
  statusIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  devicesContainer: {
    width: '100%',
    marginTop: 30,
  },
  devicesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  deviceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deviceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  connectText: {
    color: '#00BCD4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  dataContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 212, 0.4)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  dataValue: {
    color: '#00BCD4',
    fontSize: 32,
    fontWeight: 'bold',
  },
  dataUnit: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
  infoValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disconnectButton: {
    backgroundColor: '#666',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
});
