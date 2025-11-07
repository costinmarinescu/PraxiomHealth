import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WatchScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);

  const startScanning = () => {
    setIsScanning(true);
    // Simulate scanning
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert('Scan Complete', 'No PineTime devices found nearby. Make sure your watch is on and nearby.');
    }, 3000);
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>PRAXIOM{'\n'}HEALTH</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>PineTime Watch</Text>
          
          {connectedDevice ? (
            <View>
              <View style={styles.statusContainer}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected to {connectedDevice}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={() => setConnectedDevice(null)}
              >
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.statusContainer}>
                <View style={styles.disconnectedDot} />
                <Text style={styles.disconnectedText}>Not Connected</Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.scanButton, isScanning && styles.scanningButton]}
                onPress={startScanning}
                disabled={isScanning}
              >
                <Text style={styles.buttonText}>
                  {isScanning ? 'Scanning...' : 'Scan for Devices'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Watch Features:</Text>
            <Text style={styles.infoText}>• Real-time Praxiom Age display</Text>
            <Text style={styles.infoText}>• Heart rate monitoring</Text>
            <Text style={styles.infoText}>• Step tracking</Text>
            <Text style={styles.infoText}>• Sleep tracking</Text>
            <Text style={styles.infoText}>• Data synchronization</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sync Status</Text>
          <Text style={styles.syncText}>Last synced: Never</Text>
          <TouchableOpacity 
            style={[styles.syncButton, !connectedDevice && styles.disabledButton]}
            disabled={!connectedDevice}
          >
            <Text style={styles.buttonText}>Sync Now</Text>
          </TouchableOpacity>
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
    paddingTop: 50,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
  },
  connectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  disconnectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#999',
    marginRight: 10,
  },
  connectedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  disconnectedText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  scanningButton: {
    backgroundColor: '#999',
  },
  disconnectButton: {
    backgroundColor: '#FF6B6B',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  syncText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
});
