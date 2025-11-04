import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const WatchScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState([]);

  const startScan = () => {
    setIsScanning(true);
    // Simulate scanning
    setTimeout(() => {
      setDevices([
        { id: '1', name: 'PineTime-PXHM', rssi: -45 },
        { id: '2', name: 'PineTime-AA23', rssi: -67 },
      ]);
      setIsScanning(false);
    }, 2000);
  };

  const connectToDevice = (device) => {
    setIsConnected(true);
    // BLE connection logic here
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background matching dashboard */}
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Connect to PineTime</Text>

        {/* Connection Status */}
        <View style={[styles.card, styles.statusCard]}>
          <Ionicons
            name={isConnected ? 'checkmark-circle' : 'close-circle'}
            size={48}
            color={isConnected ? '#2ECC71' : '#95A5A6'}
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Text>
          {isConnected && (
            <Text style={styles.deviceName}>PineTime-PXHM</Text>
          )}
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanningButton]}
          onPress={startScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <ActivityIndicator color="white" />
              <Text style={styles.scanButtonText}>Scanning...</Text>
            </>
          ) : (
            <>
              <Ionicons name="search" size={24} color="white" />
              <Text style={styles.scanButtonText}>Scan for Devices</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Available Devices */}
        {devices.length > 0 && (
          <View style={styles.devicesSection}>
            <Text style={styles.sectionTitle}>Available Devices</Text>
            {devices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceCard}
                onPress={() => connectToDevice(device)}
              >
                <View style={styles.deviceInfo}>
                  <Ionicons name="watch" size={32} color="#00CFC1" />
                  <View style={styles.deviceDetails}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceRssi}>
                      Signal: {device.rssi} dBm
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#95A5A6" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Watch Features</Text>
          <View style={styles.featureItem}>
            <Ionicons name="heart" size={24} color="#FF6B6B" />
            <Text style={styles.featureText}>Heart Rate Monitoring</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="footsteps" size={24} color="#00CFC1" />
            <Text style={styles.featureText}>Step Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="body" size={24} color="#9B59B6" />
            <Text style={styles.featureText}>Bio-Age Display</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="notifications" size={24} color="#F39C12" />
            <Text style={styles.featureText}>Health Notifications</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  deviceName: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 5,
  },
  scanButton: {
    backgroundColor: '#00CFC1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 30,
  },
  scanningButton: {
    backgroundColor: '#95A5A6',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  devicesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  deviceCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceDetails: {
    marginLeft: 15,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});

export default WatchScreen;
