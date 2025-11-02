import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function WatchScreen() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const handleConnect = () => {
    // Placeholder for BLE connection
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 2000);
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
  };

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
          <TouchableOpacity style={styles.button} onPress={handleConnect}>
            <Text style={styles.buttonText}>Connect to Watch</Text>
          </TouchableOpacity>
        )}

        {connectionStatus === 'connected' && (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Device</Text>
              <Text style={styles.infoValue}>Praxiom Watch</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Last Sync</Text>
              <Text style={styles.infoValue}>Just now</Text>
            </View>

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
    marginTop: 40,
    marginBottom: 40,
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
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#666',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
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
});
