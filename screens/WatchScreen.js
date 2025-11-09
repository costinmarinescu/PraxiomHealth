import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BleManager } from 'react-native-ble-plx';
import * as Device from 'expo-device';
import { Platform, PermissionsAndroid } from 'react-native';
import { AppContext } from '../AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

// BLE Service and Characteristic UUIDs
const PRAXIOM_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const PRAXIOM_BIO_AGE_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const PRAXIOM_NOTIFICATION_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// Standard services
const CURRENT_TIME_SERVICE = '00001805-0000-1000-8000-00805f9b34fb';
const CURRENT_TIME_CHAR = '00002a2b-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_LEVEL_CHAR = '00002a19-0000-1000-8000-00805f9b34fb';

export default function WatchScreen() {
  const [manager] = useState(new BleManager());
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isPushing, setIsPushing] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [watchConnected, setWatchConnected] = useState(false);
  const { state } = useContext(AppContext);

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    // Check for previously connected device
    checkSavedDevice();

    // Cleanup on unmount
    return () => {
      if (connectedDevice) {
        connectedDevice.cancelConnection();
      }
      manager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Device.platformApiLevel >= 31) {
        const bluetoothScanPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: "Bluetooth Scan Permission",
            message: "This app needs Bluetooth scan permission to find your PineTime watch",
            buttonPositive: "OK"
          }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: "Bluetooth Connect Permission",
            message: "This app needs Bluetooth connect permission to connect to your PineTime watch",
            buttonPositive: "OK"
          }
        );
        const fineLocationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs location permission for Bluetooth",
            buttonPositive: "OK"
          }
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "This app needs location permission for Bluetooth",
            buttonPositive: "OK"
          }
        );
      }
    }
  };

  const checkSavedDevice = async () => {
    try {
      const savedDeviceId = await AsyncStorage.getItem('connectedWatchId');
      if (savedDeviceId) {
        // Try to reconnect to saved device
        reconnectToDevice(savedDeviceId);
      }
    } catch (error) {
      console.log('Error checking saved device:', error);
    }
  };

  const reconnectToDevice = async (deviceId) => {
    try {
      const device = await manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);
      setWatchConnected(true);
      
      // Update global state
      await AsyncStorage.setItem('watchConnected', 'true');
      
      // Monitor device connection
      device.onDisconnected(() => {
        setConnectedDevice(null);
        setWatchConnected(false);
        AsyncStorage.setItem('watchConnected', 'false');
      });
      
      // Read battery level
      readBatteryLevel(device);
      
      // Sync time
      syncTime(device);
      
    } catch (error) {
      console.log('Reconnection failed:', error);
    }
  };

  const scanForDevices = () => {
    setScanning(true);
    setDevices([]);
    const subscription = manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setScanning(false);
        return;
      }

      if (device.name) {
        // Filter for PineTime/InfiniTime devices or show all if debug mode
        const isPineTime = device.name.toLowerCase().includes('infinitime') || 
                          device.name.toLowerCase().includes('pinetime');
        
        if (isPineTime || showAllDevices) {
          setDevices(prevDevices => {
            const existingDevice = prevDevices.find(d => d.id === device.id);
            if (!existingDevice) {
              return [...prevDevices, {
                id: device.id,
                name: device.name,
                rssi: device.rssi,
                isPineTime: isPineTime
              }];
            }
            return prevDevices;
          });
        }
      }
    });

    // Stop scanning after 10 seconds
    setTimeout(() => {
      subscription.remove();
      setScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device) => {
    try {
      const deviceConnection = await manager.connectToDevice(device.id);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      
      setConnectedDevice(deviceConnection);
      setWatchConnected(true);
      
      // Save device ID for reconnection
      await AsyncStorage.setItem('connectedWatchId', device.id);
      await AsyncStorage.setItem('watchConnected', 'true');
      
      // Monitor device disconnection
      deviceConnection.onDisconnected(() => {
        setConnectedDevice(null);
        setWatchConnected(false);
        setBatteryLevel(null);
        AsyncStorage.setItem('watchConnected', 'false');
        Alert.alert('Disconnected', 'Watch disconnected');
      });

      // Read battery level
      await readBatteryLevel(deviceConnection);
      
      // Sync time
      await syncTime(deviceConnection);
      
      Alert.alert('Connected', `Connected to ${device.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', 'Could not connect to device');
    }
  };

  const readBatteryLevel = async (device) => {
    try {
      const battery = await device.readCharacteristicForService(
        BATTERY_SERVICE,
        BATTERY_LEVEL_CHAR
      );
      const level = Buffer.from(battery.value, 'base64')[0];
      setBatteryLevel(level);
    } catch (error) {
      console.log('Could not read battery level:', error);
    }
  };

  const syncTime = async (device) => {
    try {
      const now = new Date();
      const timeData = Buffer.alloc(10);
      
      // Year (little-endian)
      const year = now.getFullYear();
      timeData.writeUInt16LE(year, 0);
      
      // Month (1-12)
      timeData[2] = now.getMonth() + 1;
      
      // Day
      timeData[3] = now.getDate();
      
      // Hour
      timeData[4] = now.getHours();
      
      // Minute
      timeData[5] = now.getMinutes();
      
      // Second
      timeData[6] = now.getSeconds();
      
      // Day of week (1=Monday, 7=Sunday)
      const dayOfWeek = now.getDay();
      timeData[7] = dayOfWeek === 0 ? 7 : dayOfWeek;
      
      // Fractions256
      timeData[8] = 0;
      
      // Adjust reason
      timeData[9] = 1; // Manual update
      
      await device.writeCharacteristicWithResponseForService(
        CURRENT_TIME_SERVICE,
        CURRENT_TIME_CHAR,
        timeData.toString('base64')
      );
      
      console.log('Time synchronized');
    } catch (error) {
      console.log('Could not sync time:', error);
    }
  };

  const pushBioAge = async () => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to a watch first');
      return;
    }

    setIsPushing(true);
    
    try {
      // Calculate biological age from state
      const bioAge = state.biologicalAge || 70.1; // Use calculated age or default
      const chronoAge = state.chronologicalAge || 53;
      const oralHealthScore = state.oralHealthScore || 50;
      const systemicHealthScore = state.systemicHealthScore || 45;
      
      // Create data packet for watch
      // Format: [command, bioAge_int, bioAge_decimal, chronoAge, oralScore, systemicScore]
      const dataPacket = Buffer.alloc(6);
      dataPacket[0] = 0x01; // Command: Update Bio-Age
      dataPacket[1] = Math.floor(bioAge); // Bio-Age integer part
      dataPacket[2] = Math.round((bioAge % 1) * 100); // Bio-Age decimal part
      dataPacket[3] = chronoAge;
      dataPacket[4] = Math.round(oralHealthScore);
      dataPacket[5] = Math.round(systemicHealthScore);
      
      // Write to Praxiom Bio-Age characteristic
      await connectedDevice.writeCharacteristicWithResponseForService(
        PRAXIOM_SERVICE_UUID,
        PRAXIOM_BIO_AGE_CHAR_UUID,
        dataPacket.toString('base64')
      );
      
      // Save sync status
      await AsyncStorage.setItem('lastBioAgeSync', new Date().toISOString());
      await AsyncStorage.setItem('syncedBioAge', bioAge.toString());
      
      Alert.alert(
        'Success', 
        `Bio-Age (${bioAge.toFixed(1)} years) pushed to watch!\n\nOral Health: ${oralHealthScore}%\nSystemic Health: ${systemicHealthScore}%`
      );
      
    } catch (error) {
      console.error('Push error:', error);
      
      // Try fallback method using standard notification service
      try {
        await pushViaNotification();
      } catch (fallbackError) {
        Alert.alert('Push Failed', 'Could not send Bio-Age to watch. Make sure your watch has the Praxiom firmware installed.');
      }
    } finally {
      setIsPushing(false);
    }
  };

  const pushViaNotification = async () => {
    // Fallback: Send as notification if custom service not available
    const ALERT_NOTIFICATION_SERVICE = '00001811-0000-1000-8000-00805f9b34fb';
    const NEW_ALERT_CHAR = '00002a46-0000-1000-8000-00805f9b34fb';
    
    const bioAge = state.biologicalAge || 70.1;
    const message = `Bio-Age: ${bioAge.toFixed(1)} years`;
    
    const notificationData = Buffer.concat([
      Buffer.from([0x09, 0x01]), // Category: Instant Message, Count: 1
      Buffer.from(message, 'utf8')
    ]);
    
    await connectedDevice.writeCharacteristicWithoutResponseForService(
      ALERT_NOTIFICATION_SERVICE,
      NEW_ALERT_CHAR,
      notificationData.toString('base64')
    );
  };

  const disconnect = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setWatchConnected(false);
      setBatteryLevel(null);
      await AsyncStorage.removeItem('connectedWatchId');
      await AsyncStorage.setItem('watchConnected', 'false');
      Alert.alert('Disconnected', 'Watch disconnected');
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={[styles.deviceCard, item.isPineTime && styles.pineTimeDevice]}
      onPress={() => connectToDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {item.isPineTime && '⭐ '}{item.name}
        </Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        {item.rssi && (
          <Text style={styles.deviceSignal}>Signal: {item.rssi} dBm</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => connectToDevice(item)}
      >
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#FF6B00', '#FFB800', '#47C83E', '#0099DB']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>PineTime Watch</Text>
        <Text style={styles.subtitle}>Sync Your Bio-Age</Text>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          {connectedDevice ? (
            <>
              <Text style={styles.connectedIcon}>✓ Connected</Text>
              <Text style={styles.deviceNameText}>{connectedDevice.name || 'InfiniTime'}</Text>
              {batteryLevel !== null && (
                <Text style={styles.batteryText}>Battery: {batteryLevel}%</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.disconnectedIcon}>○ Not Connected</Text>
              <Text style={styles.instructionText}>
                Scan for your PineTime watch below
              </Text>
            </>
          )}
        </View>

        {/* Push Bio-Age Button */}
        {connectedDevice && (
          <TouchableOpacity
            style={[styles.pushButton, isPushing && styles.pushingButton]}
            onPress={pushBioAge}
            disabled={isPushing}
          >
            {isPushing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.pushButtonText}>Push Bio-Age to Watch</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Disconnect Button */}
        {connectedDevice && (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnect}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        {/* Scan Controls */}
        {!connectedDevice && (
          <>
            <TouchableOpacity
              style={[styles.scanButton, scanning && styles.scanningButton]}
              onPress={scanForDevices}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.scanButtonText}>Scanning...</Text>
                </>
              ) : (
                <Text style={styles.scanButtonText}>Scan for Devices</Text>
              )}
            </TouchableOpacity>

            {/* Debug Mode Toggle */}
            <View style={styles.debugToggle}>
              <Text style={styles.debugText}>Show All Devices (Debug)</Text>
              <Switch
                value={showAllDevices}
                onValueChange={setShowAllDevices}
                trackColor={{ false: '#767577', true: '#0099DB' }}
                thumbColor={showAllDevices ? '#47C83E' : '#f4f3f4'}
              />
            </View>

            {/* Device List */}
            {devices.length > 0 && (
              <View style={styles.deviceListContainer}>
                <Text style={styles.deviceListTitle}>
                  Found {devices.length} device{devices.length > 1 ? 's' : ''}:
                </Text>
                {showAllDevices && (
                  <Text style={styles.pineTimeHint}>
                    ⭐ = Likely PineTime/InfiniTime
                  </Text>
                )}
                <FlatList
                  data={devices}
                  renderItem={renderDevice}
                  keyExtractor={(item) => item.id}
                  style={styles.deviceList}
                  scrollEnabled={false}
                />
              </View>
            )}
          </>
        )}

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Watch Features</Text>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Real-time Bio-Age Display</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💓</Text>
            <Text style={styles.featureText}>Heart Rate Monitoring</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👟</Text>
            <Text style={styles.featureText}>Step Counter Integration</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureText}>Health Alerts</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Two-way Sync</Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#34495E',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  connectedIcon: {
    fontSize: 24,
    color: '#47C83E',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  disconnectedIcon: {
    fontSize: 24,
    color: '#95A5A6',
    marginBottom: 10,
  },
  deviceNameText: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '600',
    marginBottom: 5,
  },
  batteryText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 5,
  },
  instructionText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  pushButton: {
    backgroundColor: '#47C83E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  pushingButton: {
    backgroundColor: '#95A5A6',
  },
  pushButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  disconnectButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#0099DB',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  scanningButton: {
    backgroundColor: '#95A5A6',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  debugToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debugText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  deviceListContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  deviceListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  pineTimeHint: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  deviceList: {
    maxHeight: 300,
  },
  deviceCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pineTimeDevice: {
    borderColor: '#FFB800',
    borderWidth: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  deviceId: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 3,
  },
  deviceSignal: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  connectButton: {
    backgroundColor: '#0099DB',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  connectButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  featuresSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#34495E',
  },
});