import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BLEService from '../services/BLEService';

export default function WatchScreen() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    checkConnectionStatus();
    
    const interval = setInterval(() => {
      checkConnectionStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = () => {
    setIsConnected(BLEService.getConnectionStatus());
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const success = await BLEService.connect();
      
      if (success) {
        setIsConnected(true);
        setDeviceName('Praxiom Watch');
        Alert.alert('Success', 'Connected to Praxiom watch!');
      } else {
        Alert.alert(
          'Connection Failed',
          'Could not connect to Praxiom watch. Make sure:\n' +
          '• Bluetooth is enabled\n' +
          '• Watch is powered on\n' +
          '• Watch is in range'
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await BLEService.disconnect();
      setIsConnected(false);
      setDeviceName('');
      Alert.alert('Disconnected', 'Disconnected from watch');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#3BCEAC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <View style={styles.content}>
          {/* Watch Icon */}
          <View style={styles.watchIconContainer}>
            <View style={[
              styles.watchIcon,
              isConnected && styles.watchIconConnected
            ]}>
              <Ionicons 
                name="watch" 
                size={80} 
                color={isConnected ? "#4CAF50" : "#FFF"} 
              />
            </View>
            {isConnected && (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            )}
          </View>

          {/* Status */}
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Text>
          
          {deviceName !== '' && (
            <Text style={styles.deviceName}>{deviceName}</Text>
          )}

          {/* Connection Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="bluetooth" size={20} color="#3BCEAC" />
              <Text style={styles.infoLabel}>Bluetooth Status:</Text>
              <Text style={styles.infoValue}>
                {isConnected ? 'Active' : 'Inactive'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="pulse" size={20} color="#3BCEAC" />
              <Text style={styles.infoLabel}>Data Sync:</Text>
              <Text style={styles.infoValue}>
                {isConnected ? 'Ready' : 'Waiting'}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          {!isConnected ? (
            <TouchableOpacity 
              style={[styles.button, styles.connectButton]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="bluetooth" size={24} color="#FFF" />
                  <Text style={styles.buttonText}>Connect to Watch</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.disconnectButton]}
              onPress={handleDisconnect}
            >
              <Ionicons name="close-circle" size={24} color="#FFF" />
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          )}

          {/* Instructions */}
          {!isConnected && (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Connection Steps:</Text>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Enable Bluetooth on your phone</Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Power on your Praxiom watch</Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Tap "Connect to Watch"</Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>Wait for connection to establish</Text>
              </View>
            </View>
          )}

          {/* Connected Features */}
          {isConnected && (
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>Available Features:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Send Bio-Age data</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Sync health scores</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Real-time updates</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    opacity: 0.95,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchIconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  watchIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  watchIconConnected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  connectedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 4,
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  deviceName: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 30,
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: '#3BCEAC',
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 15,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3BCEAC',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  featuresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    width: '100%',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#666',
  },
});
