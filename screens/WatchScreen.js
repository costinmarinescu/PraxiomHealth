import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import BLEService from '../services/BLEService';

const WatchScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = BLEService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setConnectedDevice(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setDevices([]);

    try {
      const foundDevices = await BLEService.scanForWatch(
        (device) => {
          setDevices((prev) => {
            if (!prev.find((d) => d.id === device.id)) {
              return [...prev, device];
            }
            return prev;
          });
        },
        10000
      );
    } catch (error) {
      Alert.alert('Scan Error', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device) => {
    try {
      await BLEService.connectToWatch(device.id);
      setConnectedDevice(device);
      Alert.alert('Connected', `Connected to ${device.name}`);
    } catch (error) {
      Alert.alert('Connection Error', error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await BLEService.disconnectFromWatch();
      Alert.alert('Disconnected', 'Watch disconnected');
    } catch (error) {
      Alert.alert('Disconnection Error', error.message);
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => handleConnect(item)}
    >
      <Ionicons name="watch-outline" size={32} color="#00d4ff" />
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#8e8e93" />
    </TouchableOpacity>
  );

  return (
    <PraxiomBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>PineTime Watch</Text>
          <Text style={styles.subtitle}>
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>

        {isConnected ? (
          <View style={styles.connectedContainer}>
            <View style={styles.connectedCard}>
              <Ionicons name="checkmark-circle" size={64} color="#4ade80" />
              <Text style={styles.connectedTitle}>{connectedDevice?.name}</Text>
              <Text style={styles.connectedSubtitle}>Syncing data...</Text>
              
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnect}
              >
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.scanSection}>
              <TouchableOpacity
                style={[styles.scanButton, scanning && styles.scanningButton]}
                onPress={handleScan}
                disabled={scanning}
              >
                {scanning ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Ionicons name="bluetooth" size={24} color="#ffffff" />
                )}
                <Text style={styles.scanButtonText}>
                  {scanning ? 'Scanning...' : 'Scan for Watch'}
                </Text>
              </TouchableOpacity>
            </View>

            {devices.length > 0 ? (
              <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.id}
                style={styles.deviceList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="watch-outline" size={64} color="#8e8e93" />
                <Text style={styles.emptyText}>No devices found</Text>
                <Text style={styles.emptySubtext}>
                  Make sure your PineTime is nearby and Bluetooth is enabled
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </PraxiomBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  connectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  connectedCard: {
    backgroundColor: '#1e1e2e',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
  },
  connectedSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 8,
  },
  disconnectButton: {
    marginTop: 30,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  disconnectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scanSection: {
    padding: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d4ff',
    padding: 18,
    borderRadius: 12,
  },
  scanningButton: {
    backgroundColor: '#666',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  deviceList: {
    flex: 1,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  deviceId: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default WatchScreen;
