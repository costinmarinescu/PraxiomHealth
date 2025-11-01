import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function WatchScreen() {
  const handleConnect = () => {
    Alert.alert(
      'Connect to Watch',
      'Bluetooth connection feature will be added in the next update.\n\n' +
      'Make sure your Praxiom watch is:\n' +
      '• Powered on\n' +
      '• Within Bluetooth range\n' +
      '• Running the latest firmware',
      [{ text: 'OK' }]
    );
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
            <View style={styles.watchIcon}>
              <Ionicons name="watch" size={80} color="#FFF" />
            </View>
          </View>

          {/* Status */}
          <Text style={styles.statusText}>Not Connected</Text>

          {/* Connection Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="bluetooth" size={20} color="#3BCEAC" />
              <Text style={styles.infoLabel}>Bluetooth Status:</Text>
              <Text style={styles.infoValue}>Inactive</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="pulse" size={20} color="#3BCEAC" />
              <Text style={styles.infoLabel}>Data Sync:</Text>
              <Text style={styles.infoValue}>Waiting</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.button, styles.connectButton]}
            onPress={handleConnect}
          >
            <Ionicons name="bluetooth" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Connect to Watch</Text>
          </TouchableOpacity>

          {/* Instructions */}
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
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 30,
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
});
