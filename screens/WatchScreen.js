import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../AppContext';

export default function WatchScreen() {
  const { state, updateState } = useContext(AppContext);
  const [bleManager] = useState(new BleManager());
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [bleEnabled, setBleEnabled] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const subscription = bleManager.onStateChange((bleState) => {
      setBleEnabled(bleState === 'PoweredOn');
      if (bleState !== 'PoweredOn' && connectedDevice) {
        handleDisconnection();
      }
    }, true);

    loadConnectionState();

    const connectionMonitor = setInterval(() => {
      if (connectedDevice) {
        checkConnectionHealth();
      }
    }, 5000);

    return () => {
      subscription.remove();
      clearInterval(connectionMonitor);
      if (connectedDevice) {
        bleManager.cancelDeviceConnection(connectedDevice.id);
      }
      bleManager.destroy();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      requestAndroidPermissions();
    }
  }, []);

  const loadConnectionState = async () => {
    try {
      const savedDevice = await AsyncStorage.getItem('connectedDevice');
      const status = await AsyncStorage.getItem('watchConnected');
      if (savedDevice && status === 'true') {
        const device = JSON.parse(savedDevice);
        setConnectedDevice(device);
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error loading connection state:', error);
    }
  };

  const saveConnectionState = async (device, isConnected) => {
    try {
      if (device && isConnected) {
        await AsyncStorage.setItem('connectedDevice', JSON.stringify(device));
        await AsyncStorage.setItem('watchConnected', 'true');
        const now = new Date().toISOString();
        await AsyncStorage.setItem('lastSync', now);
        updateState({ lastSync: now });
      } else {
        await AsyncStorage.removeItem('connectedDevice');
        await AsyncStorage.setItem('watchConnected', 'false');
        await AsyncStorage.removeItem('lastSync');
        updateState({ lastSync: null });
      }
    } catch (error) {
      console.error('Error saving connection state:', error);
    }
  };

  const checkConnectionHealth = async () => {
    if (!connectedDevice) return;
    try {
      const isConnected = await bleManager.isDeviceConnected(connectedDevice.id);
      if (!isConnected) {
        handleDisconnection();
      }
    } catch (error) {
      handleDisconnection();
    }
  };

  const handleDisconnection = async () => {
    setConnectedDevice(null);
    setConnectionStatus('disconnected');
    await saveConnectionState(null, false);
    setDiscoveredDevices(prev =>
      prev.map(device => ({ ...device, isConnected: false }))
    );
  };

  const requestAndroidPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        Alert.alert(
          'Permissions Required',
          'Bluetooth permissions are required to scan for and connect to your PineTime watch.'
        );
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const startScanning = async () => {
    if (!bleEnabled) {
      Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to scan for devices.');
      return;
    }

    setDiscoveredDevices([]);
    setIsScanning(true);
    bleManager.stopDeviceScan();

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

        const isConnectedToThis = connectedDevice && connectedDevice.id === device.id;

        if (isPineTime || showAllDevices) {
          setDiscoveredDevices((prev) => {
            const existingIndex = prev.findIndex(d => d.id === device.id);
            const deviceWithConnectionStatus = {
              ...device,
              isPineTime,
              isConnected: isConnectedToThis
            };

            if (existingIndex !== -1) {
              const updated = [...prev];
              updated[existingIndex] = deviceWithConnectionStatus;
              return updated;
            }
            return [...prev, deviceWithConnectionStatus];
          });
        }
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  };

  const connectToDevice = async (device) => {
    if (connectedDevice && connectedDevice.id === device.id) {
      Alert.alert('Already Connected', 'This device is already connected.');
      return;
    }

    try {
      setIsScanning(false);
      bleManager.stopDeviceScan();
      setConnectionStatus('connecting');

      const connected = await bleManager.connectToDevice(device.id, { timeout: 10000 });
      await connected.discoverAllServicesAndCharacteristics();

      setConnectedDevice(connected);
      setConnectionStatus('connected');
      await saveConnectionState(device, true);

      setDiscoveredDevices(prev =>
        prev.map(d => ({ ...d, isConnected: d.id === device.id }))
      );

      Alert.alert(
        '✅ Connected!',
        `Successfully connected to ${device.name}.\n\nYour watch will now sync heart rate, steps, and other health data.\n\nYour Bio-Age (${state.biologicalAge.toFixed(1)} years) is calculated and displayed in the app.`
      );
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('disconnected');
      Alert.alert(
        'Connection Failed',
        `Could not connect to ${device.name}. Make sure the device is nearby and not connected to another app.`
      );
    }
  };

  const disconnectDevice = async () => {
    if (!connectedDevice) {
      Alert.alert('No Device Connected', 'There is no device to disconnect.');
      return;
    }

    try {
      await bleManager.cancelDeviceConnection(connectedDevice.id);
      await handleDisconnection();
      Alert.alert('Disconnected', `Successfully disconnected from ${connectedDevice.name}`);
    } catch (error) {
      await handleDisconnection();
      Alert.alert('Disconnected', 'Device has been disconnected.');
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      default: return 'Not Connected';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connecting': return '🔄';
      case 'connected': return '✓';
      default: return '⚠';
    }
  };

  return (
    <LinearGradient colors={['#FF6B00', '#FFB800']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>{"PRAXIOM\nHEALTH"}</Text>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>PineTime Watch</Text>
          <Text style={styles.subtitle}>Sync Your Bio-Age</Text>
        </View>

        <View style={[
          styles.statusCard,
          connectionStatus === 'connected' && styles.connectedCard,
          connectionStatus === 'connecting' && styles.connectingCard
        ]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>{getConnectionIcon()}</Text>
            <Text style={styles.statusTitle}>{getConnectionStatusText()}</Text>
          </View>
          {connectedDevice && (
            <>
              <Text style={styles.deviceName}>{connectedDevice.name}</Text>
              <Text style={styles.bioAgeDisplay}>
                Your Bio-Age: {state.biologicalAge.toFixed(1)} years
              </Text>
              <Text style={styles.bioAgeNote}>(Displayed in app)</Text>
            </>
          )}
        </View>

        {connectionStatus !== 'connected' ? (
          <TouchableOpacity
            style={[
              styles.scanButton,
              (isScanning || connectionStatus === 'connecting') && styles.scanButtonDisabled
            ]}
            onPress={startScanning}
            disabled={isScanning || connectionStatus === 'connecting'}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' :
                connectionStatus === 'connecting' ? 'Connecting...' :
                  'Scan for Watch'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnectDevice}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Show All Devices (Debug)</Text>
          <Switch
            value={showAllDevices}
            onValueChange={setShowAllDevices}
            trackColor={{ false: '#767577', true: '#00CFC1' }}
            thumbColor={showAllDevices ? '#0099DB' : '#f4f3f4'}
          />
        </View>

        {discoveredDevices.length > 0 && (
          <>
            <Text style={styles.devicesFoundText}>
              Found {discoveredDevices.length} device{discoveredDevices.length !== 1 ? 's' : ''}:
            </Text>
            <Text style={styles.pineTimeHint}>⭐ = Likely PineTime/InfiniTime</Text>

            {discoveredDevices.map((device) => (
              <View
                key={device.id}
                style={[
                  styles.deviceCard,
                  device.isPineTime && styles.pineTimeCard,
                  device.isConnected && styles.connectedDeviceCard
                ]}
              >
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceNameText}>
                    {device.name} {device.isPineTime && '⭐'}
                    {device.isConnected && ' (Connected)'}
                  </Text>
                  <Text style={styles.deviceMac}>{device.id}</Text>
                  <Text style={styles.deviceSignal}>Signal: {device.rssi} dBm</Text>
                </View>

                {!device.isConnected && connectionStatus !== 'connecting' && (
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => connectToDevice(device)}
                  >
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </TouchableOpacity>
                )}

                {device.isConnected && (
                  <View style={styles.connectedIndicator}>
                    <Text style={styles.connectedText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Watch Features:</Text>
          <Text style={styles.infoText}>✓ Syncs heart rate, steps, HRV to app</Text>
          <Text style={styles.infoText}>✓ Real-time health monitoring</Text>
          <Text style={styles.infoText}>✓ Bio-Age calculated and displayed in app</Text>
          <Text style={styles.infoText}>✓ Works with standard InfiniTime firmware</Text>
        </View>

        <View style={styles.troubleshootingCard}>
          <Text style={styles.troubleshootingTitle}>💡 Troubleshooting:</Text>
          <Text style={styles.troubleshootingText}>• Make sure watch is ON and NEARBY</Text>
          <Text style={styles.troubleshootingText}>• Turn on "Show All Devices" to see everything</Text>
          <Text style={styles.troubleshootingText}>• Unpair from phone's Bluetooth settings if connection fails</Text>
          <Text style={styles.troubleshootingText}>• Try turning Bluetooth off and on if having issues</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 30, lineHeight: 22 },
  titleContainer: { alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#666' },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  connectedCard: { borderWidth: 2, borderColor: '#4CAF50' },
  connectingCard: { borderWidth: 2, borderColor: '#FF8C00' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusIcon: { fontSize: 36, marginRight: 15 },
  statusTitle: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  deviceName: { fontSize: 18, color: '#666', marginTop: 5 },
  bioAgeDisplay: { fontSize: 20, color: '#FF6B00', fontWeight: 'bold', marginTop: 15 },
  bioAgeNote: { fontSize: 12, color: '#999', marginTop: 3, fontStyle: 'italic' },
  scanButton: {
    backgroundColor: '#00CFC1',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonDisabled: { backgroundColor: '#B0B0B0' },
  scanButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  disconnectButton: {
    backgroundColor: '#FF5252',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disconnectButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleLabel: { fontSize: 16, color: '#666', fontWeight: '500' },
  devicesFoundText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  pineTimeHint: { fontSize: 14, color: '#666', marginBottom: 15, fontStyle: 'italic' },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pineTimeCard: { borderWidth: 2, borderColor: '#00CFC1' },
  connectedDeviceCard: { borderWidth: 2, borderColor: '#4CAF50', backgroundColor: '#F8FFF8' },
  deviceInfo: { flex: 1 },
  deviceNameText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  deviceMac: { fontSize: 14, color: '#999', marginTop: 4 },
  deviceSignal: { fontSize: 12, color: '#999', marginTop: 2 },
  connectButton: { backgroundColor: '#00CFC1', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 20 },
  connectButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  connectedIndicator: { backgroundColor: '#4CAF50', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  connectedText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  infoCard: { backgroundColor: '#E3F2FD', borderRadius: 20, padding: 20, marginTop: 20, marginBottom: 15 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1976D2', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#1976D2', marginBottom: 6, lineHeight: 20 },
  troubleshootingCard: { backgroundColor: '#FFF9E6', borderRadius: 20, padding: 20, marginBottom: 20 },
  troubleshootingTitle: { fontSize: 16, fontWeight: 'bold', color: '#856404', marginBottom: 12 },
  troubleshootingText: { fontSize: 14, color: '#856404', marginBottom: 8, lineHeight: 20 },
});
