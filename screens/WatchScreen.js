import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BLEService from '../services/BLEService';

export default function WatchScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Listen for connection events from BLEService
  useEffect(() => {
    const onBleEvent = (event) => {
      console.log('WatchScreen received BLE event:', event);
      if (event.type === 'connected') {
        setConnectedDevice(event.device);
        setConnectionStatus('connected');
        updateDiscoveredDevices(event.device, true);
      } else if (event.type === 'disconnected') {
        setConnectedDevice(null);
        setConnectionStatus('disconnected');
        updateDiscoveredDevices(null, false);
      }
    };

    BLEService.addListener(onBleEvent);

    // Set initial state from the service
    if (BLEService.isConnected()) {
      const device = BLEService.getDevice();
      setConnectedDevice(device);
      setConnectionStatus('connected');
      if (device) {
        setDiscoveredDevices([{ ...device, isConnected: true }]);
      }
    }

    return () => {
      BLEService.removeListener(onBleEvent);
    };
  }, []);

  const updateDiscoveredDevices = (connected, isConnected) => {
    if (connected && isConnected) {
      setDiscoveredDevices(prev => {
        const exists = prev.find(dev => dev.id === connected.id);
        if (exists) {
          return prev.map(dev => ({
            ...dev,
            isConnected: dev.id === connected.id,
          }));
        } else {
          return [...prev, { ...connected, isConnected: true }];
        }
      });
    } else {
      setDiscoveredDevices(prev =>
        prev.map(dev => ({
          ...dev,
          isConnected: false,
        }))
      );
    }
  };

  const startScanning = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setDiscoveredDevices([]);
    try {
      await BLEService.scanForDevices((device) => {
        setDiscoveredDevices((prev) => {
          if (!prev.find((d) => d.id === device.id)) {
            return [...prev, { ...device, isConnected: false }];
          }
          return prev;
        });
      });
    } catch (error) {
      Alert.alert('Scan Error', error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnect = async (device) => {
    if (connectionStatus === 'connecting') return;
    setConnectionStatus('connecting');
    try {
      await BLEService.connectToDevice(device);
      // The listener will handle the UI update
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
      setConnectionStatus('disconnected');
    }
  };

  const handleDisconnect = async () => {
    try {
      await BLEService.disconnect();
      // The listener will handle the UI update
    } catch (error) {
      Alert.alert('Disconnection Failed', error.message);
    }
  };

  const renderDeviceCard = (item) => {
    const deviceName = item.name?.toLowerCase() || '';
    const isPineTime =
      deviceName.includes('pine') ||
      deviceName.includes('infini') ||
      deviceName.includes('sealed') ||
      deviceName.includes('praxiom');

    return (
      <View
        key={item.id}
        style={[
          styles.deviceCard,
          isPineTime && styles.pineTimeCard,
          item.isConnected && styles.connectedDeviceCard,
        ]}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceNameText}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceMac}>{item.id}</Text>
          {item.rssi && <Text style={styles.deviceSignal}>Signal: {item.rssi} dBm</Text>}
        </View>
        {item.isConnected ? (
          <View style={styles.connectedIndicator}>
            <Text style={styles.connectedText}>✓</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => handleConnect(item)}
            disabled={connectionStatus === 'connecting'}
          >
            <Text style={styles.connectButtonText}>
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FF8C00', '#00CFC1']} style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>PineTime Watch</Text>
        <Text style={styles.subtitle}>Sync Your Bio-Age</Text>

        <View
          style={[
            styles.statusCard,
            connectionStatus === 'connected' && styles.connectedCard,
            connectionStatus === 'connecting' && styles.connectingCard,
          ]}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>
              {connectionStatus === 'connected' ? '✓' : connectionStatus === 'connecting' ? '⟳' : '○'}
            </Text>
            <Text style={styles.statusTitle}>
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'connecting'
                ? 'Connecting'
                : 'Not Connected'}
            </Text>
          </View>
          {connectedDevice && (
            <Text style={styles.deviceName}>{connectedDevice.name || 'InfiniTime'}</Text>
          )}
        </View>

        {!connectedDevice ? (
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={startScanning}
            disabled={isScanning}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Scan for Devices'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Show All Devices (Debug)</Text>
          <Switch
            value={showAllDevices}
            onValueChange={setShowAllDevices}
            trackColor={{ false: '#B0B0B0', true: '#00CFC1' }}
            thumbColor={showAllDevices ? '#fff' : '#f4f3f4'}
          />
        </View>

        {discoveredDevices.length > 0 && (
          <>
            <Text style={styles.devicesFoundText}>Found {discoveredDevices.length} device(s)</Text>
            <Text style={styles.pineTimeHint}>
              {showAllDevices
                ? 'Showing all Bluetooth devices'
                : 'PineTime devices appear with a colored border'}
            </Text>
            {discoveredDevices.map((item) => renderDeviceCard(item))}
          </>
        )}

        <View style={styles.troubleshootingCard}>
          <View style={styles.troubleshootingHeader}>
            <Text style={styles.lightbulbIcon}>💡</Text>
            <Text style={styles.troubleshootingTitle}>Troubleshooting Tips</Text>
          </View>
          <Text style={styles.troubleshootingText}>
            • Make sure your watch is charged and turned on
          </Text>
          <Text style={styles.troubleshootingText}>
            • Keep your watch close to your phone during pairing
          </Text>
          <Text style={styles.troubleshootingText}>
            • If connection fails, restart your watch and try again
          </Text>
          <Text style={styles.troubleshootingText}>
            • Enable "Show All Devices" to see all Bluetooth devices nearby
          </Text>
        </View>

        <View style={styles.firmwareNotice}>
          <Text style={styles.firmwareText}>
            This app is designed for PineTime watches running InfiniTime firmware with Praxiom customizations
          </Text>
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
  contentContainer: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
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
  connectedCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  connectingCard: {
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIcon: {
    fontSize: 36,
    marginRight: 15,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceName: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
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
  scanButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
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
  disconnectButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
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
  toggleLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  devicesFoundText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pineTimeHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
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
  pineTimeCard: {
    borderWidth: 2,
    borderColor: '#00CFC1',
  },
  connectedDeviceCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  deviceMac: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  deviceSignal: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: '#00CFC1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectedIndicator: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  troubleshootingCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    padding: 20,
    marginTop: 25,
    marginBottom: 20,
  },
  troubleshootingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lightbulbIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  troubleshootingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  firmwareNotice: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  firmwareText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    lineHeight: 20,
  },
});
