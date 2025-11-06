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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableService from '../services/WearableService';

const WatchScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [bioAge, setBioAge] = useState(null);

  useEffect(() => {
    initializeBLE();
    loadStoredDevice();
    
    return () => {
      WearableService.stopScan();
    };
  }, []);

  const initializeBLE = async () => {
    try {
      await WearableService.init();
    } catch (error) {
      console.error('BLE initialization error:', error);
      Alert.alert('Bluetooth Error', 'Failed to initialize Bluetooth. Please enable Bluetooth and try again.');
    }
  };

  const loadStoredDevice = async () => {
    try {
      const stored = await AsyncStorage.getItem('connected_watch');
      if (stored) {
        const deviceData = JSON.parse(stored);
        setConnectedDevice(deviceData);
      }
    } catch (error) {
      console.error('Error loading stored device:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const startScan = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permissions Required',
        'Bluetooth and location permissions are required to scan for devices.'
      );
      return;
    }

    setIsScanning(true);
    setDevices([]);

    try {
      WearableService.startScan((device) => {
        // Filter for PineTime watches or devices with Praxiom service
        if (
          device.name?.includes('InfiniTime') ||
          device.name?.includes('PineTime') ||
          device.name?.includes('Praxiom')
        ) {
          setDevices((prev) => {
            // Avoid duplicates
            const exists = prev.find(d => d.id === device.id);
            if (exists) return prev;
            return [...prev, device];
          });
        }
      });

      // Auto-stop scan after 10 seconds
      setTimeout(() => {
        WearableService.stopScan();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Error', 'Failed to start scanning for devices.');
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    WearableService.stopScan();
    setIsScanning(false);
  };

  const connectToDevice = async (device) => {
    setConnectionStatus('connecting');
    
    try {
      const success = await WearableService.connectToDevice(device.id);
      
      if (success) {
        setConnectedDevice(device);
        setConnectionStatus('connected');
        
        // Save connected device
        await AsyncStorage.setItem('connected_watch', JSON.stringify(device));
        
        Alert.alert('Connected', `Successfully connected to ${device.name || 'PineTime'}`);
        
        // Load Bio-Age from AsyncStorage and sync to watch
        const storedBioAge = await AsyncStorage.getItem('bio_age');
        if (storedBioAge) {
          const age = parseInt(storedBioAge, 10);
          setBioAge(age);
          await syncBioAge(age);
        }
      } else {
        setConnectionStatus('disconnected');
        Alert.alert('Connection Failed', 'Could not connect to the device. Please try again.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      Alert.alert('Connection Error', error.message || 'Failed to connect to device.');
    }
  };

  const disconnectDevice = async () => {
    try {
      await WearableService.disconnect();
      setConnectedDevice(null);
      setConnectionStatus('disconnected');
      await AsyncStorage.removeItem('connected_watch');
      Alert.alert('Disconnected', 'Watch disconnected successfully.');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const syncBioAge = async (age) => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to your watch first.');
      return;
    }

    try {
      const success = await WearableService.sendBioAge(age || bioAge);
      if (success) {
        Alert.alert('Synced!', `Bio-Age ${age || bioAge} sent to your watch.`);
      } else {
        Alert.alert('Sync Failed', 'Could not send Bio-Age to watch. Please check connection.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Sync Error', 'Failed to sync Bio-Age to watch.');
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => connectToDevice(item)}
      disabled={connectionStatus === 'connecting'}
    >
      <View style={styles.deviceIcon}>
        <Ionicons name="watch-outline" size={32} color="#00CFC1" />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        <Text style={styles.deviceRSSI}>Signal: {item.rssi || 'N/A'} dBm</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="watch" size={48} color="#00CFC1" />
        <Text style={styles.title}>PineTime Watch</Text>
        <Text style={styles.subtitle}>Sync Your Bio-Age</Text>
      </View>

      {/* Connection Status */}
      <View style={[
        styles.statusCard,
        connectionStatus === 'connected' && styles.statusCardConnected,
        connectionStatus === 'connecting' && styles.statusCardConnecting
      ]}>
        <Ionicons
          name={
            connectionStatus === 'connected' ? 'checkmark-circle' :
            connectionStatus === 'connecting' ? 'sync' :
            'alert-circle'
          }
          size={32}
          color={
            connectionStatus === 'connected' ? '#4CAF50' :
            connectionStatus === 'connecting' ? '#FF9800' :
            '#999'
          }
        />
        <Text style={styles.statusText}>
          {connectionStatus === 'connected' ? 'Connected' :
           connectionStatus === 'connecting' ? 'Connecting...' :
           'Not Connected'}
        </Text>
        {connectedDevice && (
          <Text style={styles.connectedDeviceName}>{connectedDevice.name}</Text>
        )}
      </View>

      {/* Bio-Age Display */}
      {bioAge && connectedDevice && (
        <View style={styles.bioAgeCard}>
          <Text style={styles.bioAgeLabel}>Current Bio-Age</Text>
          <Text style={styles.bioAgeValue}>{bioAge}</Text>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={() => syncBioAge(bioAge)}
          >
            <Ionicons name="sync" size={20} color="#FFF" />
            <Text style={styles.syncButtonText}>Sync to Watch</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Connected Device Actions */}
      {connectedDevice ? (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnectDevice}
          >
            <Ionicons name="close-circle" size={20} color="#FFF" />
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Scan Button */}
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
            onPress={isScanning ? stopScan : startScan}
            disabled={connectionStatus === 'connecting'}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="search" size={24} color="#FFF" />
            )}
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan for Watches'}
            </Text>
          </TouchableOpacity>

          {/* Device List */}
          {devices.length > 0 && (
            <View style={styles.deviceListContainer}>
              <Text style={styles.deviceListTitle}>Available Devices</Text>
              <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
                style={styles.deviceList}
              />
            </View>
          )}

          {/* No Devices Message */}
          {!isScanning && devices.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="watch-outline" size={64} color="#CCC" />
              <Text style={styles.emptyStateText}>No watches found</Text>
              <Text style={styles.emptyStateSubtext}>
                Make sure your PineTime is turned on and nearby
              </Text>
            </View>
          )}
        </>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#00CFC1" />
        <Text style={styles.infoText}>
          Your PineTime watch needs the Praxiom firmware installed to display Bio-Age.
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardConnected: {
    backgroundColor: '#E8F5E9',
  },
  statusCardConnecting: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  connectedDeviceName: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  bioAgeCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bioAgeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  bioAgeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 15,
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#00CFC1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  disconnectButton: {
    flexDirection: 'row',
    backgroundColor: '#F44336',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#00CFC1',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scanButtonActive: {
    backgroundColor: '#FF8C00',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deviceListContainer: {
    flex: 1,
  },
  deviceListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  deviceList: {
    flex: 1,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#999',
    marginBottom: 2,
  },
  deviceRSSI: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 20,
  },
});

export default WatchScreen;
