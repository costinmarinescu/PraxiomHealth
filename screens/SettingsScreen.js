import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import BLEService from '../services/BLEService';

export default function SettingsScreen() {
  const [connectionStatus, setConnectionStatus] = useState('Loading...');

  React.useEffect(() => {
    updateConnectionStatus();
  }, []);

  const updateConnectionStatus = async () => {
    try {
      const isConnected = BLEService.isConnected();
      const device = BLEService.getDevice();
      const status = isConnected ? `Connected: ${device?.name || 'InfiniTime'}` : 'Not Connected';
      setConnectionStatus(status);
    } catch (error) {
      setConnectionStatus('Error checking status');
    }
  };

  const exportData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('healthData');
      const data = savedData ? JSON.parse(savedData) : {};
      const jsonString = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `praxiom-health-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      } else {
        const filePath = `${FileSystem.documentDirectory}praxiom-health-export.json`;
        await FileSystem.writeAsStringAsync(filePath, jsonString);
        await Sharing.shareAsync(filePath);
      }
      Alert.alert('Success', 'Health data exported successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data: ' + error.message);
    }
  };

  const importData = async () => {
    Alert.alert('Import Data', 'This feature requires file picker. Please use manual backup restoration through file management.');
  };

  const clearAllData = () => {
    Alert.alert('Clear All Data', 'Are you sure? This cannot be undone!', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('healthData');
            await AsyncStorage.removeItem('watchConnected');
            await AsyncStorage.removeItem('lastDeviceId');
            Alert.alert('Success', 'All data cleared!');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear data');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const shareDebugInfo = async () => {
    try {
      const debugInfo = {
        app: 'Praxiom Health',
        version: '1.0.0',
        platform: Platform.OS,
        bleStatus: connectionStatus,
        timestamp: new Date().toISOString(),
      };
      const message = JSON.stringify(debugInfo, null, 2);
      await Share.share({ message });
    } catch (error) {
      Alert.alert('Error', 'Failed to share debug info');
    }
  };

  return (
    <LinearGradient colors={['#FF8C00', '#00CFC1']} style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>⚙️ Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connection Status</Text>
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{connectionStatus}</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={updateConnectionStatus}
            >
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💾 Data Management</Text>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={exportData}
          >
            <Text style={styles.buttonText}>📤 Export Health Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={importData}
          >
            <Text style={styles.buttonText}>📥 Import Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonWarning]}
            onPress={clearAllData}
          >
            <Text style={styles.buttonText}>🗑️ Clear All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ About</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Name:</Text>
            <Text style={styles.infoValue}>Praxiom Health</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform:</Text>
            <Text style={styles.infoValue}>{Platform.OS}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>Nov 9, 2025</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonDebug]}
            onPress={shareDebugInfo}
          >
            <Text style={styles.buttonText}>🐛 Share Debug Info</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 License</Text>
          <Text style={styles.licenseText}>
            Praxiom Health is designed for Praxiom-enabled PineTime watches running InfiniTime firmware.{'

'}
            Built with care for your health journey.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 30, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  statusBox: { backgroundColor: '#f5f5f5', borderRadius: 15, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1 },
  refreshButton: { backgroundColor: '#00CFC1', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  refreshText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  button: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 15, alignItems: 'center', marginBottom: 12 },
  buttonPrimary: { backgroundColor: '#00CFC1' },
  buttonSecondary: { backgroundColor: '#9B59B6' },
  buttonWarning: { backgroundColor: '#FF6B6B' },
  buttonDebug: { backgroundColor: '#FF8C00', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  infoLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  licenseText: { fontSize: 13, color: '#666', lineHeight: 20, textAlign: 'center' },
});
