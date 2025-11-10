import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import WearableService from '../services/WearableService';
import { AppContext } from '../AppContext';

export default function WatchScreen() {
  const { state, updateState } = useContext(AppContext);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Subscribe to WearableService connection changes
  useEffect(() => {
    const unsubscribe = WearableService.onConnectionChange((isConnected) => {
      console.log('Watch connection changed:', isConnected);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      updateState({ watchConnected: isConnected });
    });

    return () => unsubscribe();
  }, []);

  const handleScanDevices = async () => {
    try {
      setIsScanning(true);
      setDiscoveredDevices([]);
      console.log('🔍 Starting device scan...');

      const devices = await WearableService.scanForDevices(10000);
      console.log(`Found ${devices.length} devices`);
      setDiscoveredDevices(devices);

      if (devices.length === 0) {
        Alert.alert('No Devices Found', 'No PineTime/InfiniTime devices found. Please ensure Bluetooth is enabled on your watch.');
      }
    } catch (error) {
      console.error('❌ Scan error:', error);
      Alert.alert('Scan Error', error.message || 'Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (deviceId, deviceName) => {
    try {
      setConnectionStatus('connecting');
      console.log(`📱 Connecting to ${deviceName}...`);

      await WearableService.connectToDevice(deviceId);

      console.log(`✅ Connected to ${deviceName}`);
      Alert.alert('Success', `Connected to ${deviceName}`);
      setConnectionStatus('connected');
      updateState({ watchConnected: true });
    } catch (error) {
      console.error('❌ Connection error:', error);
      setConnectionStatus('disconnected');
      Alert.alert('Connection Failed', error.message || 'Failed to connect to device');
    }
  };

  const handleDisconnect = async () => {
    try {
      await WearableService.disconnect();
      setConnectionStatus('disconnected');
      updateState({ watchConnected: false });
      Alert.alert('Disconnected', 'Watch disconnected successfully');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      Alert.alert('Error', 'Failed to disconnect');
    }
  };

  const getPriorityDevices = () => {
    return discoveredDevices.filter((device) => {
      const name = device.name?.toLowerCase() || '';
      return (
        name.includes('infini') ||
        name.includes('pine') ||
        name.includes('time')
      );
    });
  };

  const priorityDevices = getPriorityDevices();
  const otherDevices = discoveredDevices.filter(
    (d) => !priorityDevices.find((p) => p.id === d.id)
  );

  return (
    <LinearGradient
      colors={['#FF8C00', '#FFD700', '#90EE90']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>PineTime Watch</Text>
        <Text style={styles.subtitle}>Sync Your Bio-Age</Text>

        {/* Connection Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              borderColor:
                connectionStatus === 'connected'
                  ? '#47C83E'
                  : connectionStatus === 'connecting'
                    ? '#FFB800'
                    : '#E74C3C',
            },
          ]}
        >
          <View style={styles.statusHeader}>
            <Ionicons
              name={
                connectionStatus === 'connected'
                  ? 'checkmark-circle'
                  : connectionStatus === 'connecting'
                    ? 'sync'
                    : 'close-circle'
              }
              size={32}
              color={
                connectionStatus === 'connected'
                  ? '#47C83E'
                  : connectionStatus === 'connecting'
                    ? '#FFB800'
                    : '#E74C3C'
              }
            />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {connectionStatus === 'connected'
                  ? '✓ Connected'
                  : connectionStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Not Connected'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {state.watchConnected ? 'InfiniTime' : 'No device'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          {connectionStatus === 'connected' ? (
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={handleDisconnect}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.scanButton]}
              onPress={handleScanDevices}
              disabled={isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Scan Devices</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Debug Toggle */}
        <View style={styles.debugSection}>
          <View style={styles.debugToggle}>
            <Text style={styles.debugLabel}>Show All Devices (Debug)</Text>
            <Switch
              value={showAllDevices}
              onValueChange={setShowAllDevices}
              trackColor={{ false: '#767577', true: '#00CFC1' }}
              thumbColor={showAllDevices ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Devices List */}
        {discoveredDevices.length > 0 && (
          <View style={styles.devicesSection}>
            <Text style={styles.devicesTitle}>
              Found {discoveredDevices.length} device{discoveredDevices.length !== 1 ? 's' : ''}:
            </Text>

            {/* Priority Devices */}
            {priorityDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onConnect={handleConnect}
                isPriority={true}
              />
            ))}

            {/* Other Devices */}
            {showAllDevices &&
              otherDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onConnect={handleConnect}
                  isPriority={false}
                />
              ))}
          </View>
        )}

        {/* No Devices Message */}
        {!isScanning && discoveredDevices.length === 0 && (
          <View style={styles.noDevicesContainer}>
            <Ionicons name="bluetooth" size={48} color="#999" />
            <Text style={styles.noDevicesText}>No devices found</Text>
            <Text style={styles.noDevicesHint}>
              Tap "Scan Devices" to search for PineTime watches
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function DeviceCard({ device, onConnect, isPriority }) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {isPriority ? '⭐ ' : ''}
          {device.name || 'Unknown Device'}
        </Text>
        <Text style={styles.deviceMac}>{device.id}</Text>
        {device.rssi && (
          <Text style={styles.deviceSignal}>Signal: {device.rssi} dBm</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => onConnect(device.id, device.name)}
      >
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#00CFC1',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 15,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonGroup: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    backgroundColor: '#00CFC1',
  },
  disconnectButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  debugSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  debugToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debugLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  devicesSection: {
    marginBottom: 30,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  deviceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    fontWeight: '600',
    color: '#1a1a1a',
  },
  deviceMac: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  deviceSignal: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#00CFC1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noDevicesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDevicesText: {
    fontSize: 18,
    color: '#999',
    marginTop: 12,
    fontWeight: '600',
  },
  noDevicesHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
