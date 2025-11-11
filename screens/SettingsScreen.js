import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';

export default function SettingsScreen({ navigation }) {
  const { state, updateState } = useContext(AppContext);
  const [notifications, setNotifications] = React.useState(true);
  const [autoSync, setAutoSync] = React.useState(true);

  useEffect(() => {
    loadSettings();
    // ✅ Check watch connection status
    checkWatchConnection();
  }, []);

  // ✅ FIX: Use unified 'watchConnected' key
  const checkWatchConnection = async () => {
    try {
      const watchStatus = await AsyncStorage.getItem('watchConnected');
      updateState({ watchConnected: watchStatus === 'true' });
    } catch (error) {
      console.error('Error checking watch connection:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const notif = await AsyncStorage.getItem('notifications');
      const sync = await AsyncStorage.getItem('autoSync');
      if (notif !== null) setNotifications(JSON.parse(notif));
      if (sync !== null) setAutoSync(JSON.parse(sync));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleNotificationsToggle = (value) => {
    setNotifications(value);
    saveSetting('notifications', value);
  };

  const handleAutoSyncToggle = (value) => {
    setAutoSync(value);
    saveSetting('autoSync', value);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all health data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'praxiomHealthData',
                'biomarkerHistory',
                'watchConnected',
                'connectedDevice',
              ]);
              Alert.alert('Success', 'All data has been cleared.');
              updateState({ watchConnected: false });
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  const handleShareReport = async () => {
    try {
      const message = `My Praxiom Bio-Age Report:\n\nChronological Age: ${state.chronologicalAge}\nBiological Age: ${state.biologicalAge.toFixed(1)}\nOral Health: ${state.oralHealthScore}%\nSystemic Health: ${state.systemicHealthScore}%\nFitness Score: ${state.fitnessScore}%`;

      await Share.share({
        message: message,
        title: 'Praxiom Health Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Device Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="watch" size={24} color="#0099DB" />
            <Text style={styles.settingLabel}>Watch Connection</Text>
          </View>
          <Text style={[
            styles.statusText,
            { color: state.watchConnected ? '#47C83E' : '#95A5A6' }
          ]}>
            {state.watchConnected ? 'Connected' : 'Not Connected'}
          </Text>
        </View>

        {state.watchConnected && state.lastSync && (
          <Text style={styles.syncInfo}>
            Last synced: {new Date(state.lastSync).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color="#0099DB" />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#E0E0E0', true: '#00CFC1' }}
            thumbColor={notifications ? '#0099DB' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="sync" size={24} color="#0099DB" />
            <Text style={styles.settingLabel}>Auto-Sync</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={handleAutoSyncToggle}
            trackColor={{ false: '#E0E0E0', true: '#00CFC1' }}
            thumbColor={autoSync ? '#0099DB' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleShareReport}>
          <Ionicons name="share-social" size={24} color="#0099DB" />
          <Text style={styles.actionButtonText}>Share Report</Text>
          <Ionicons name="chevron-forward" size={24} color="#7F8C8D" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleClearData}>
          <Ionicons name="trash" size={24} color="#E74C3C" />
          <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>Clear All Data</Text>
          <Ionicons name="chevron-forward" size={24} color="#7F8C8D" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoCard}>
          <Text style={styles.appName}>Praxiom Health</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            Bio-Age assessment using oral-systemic health markers
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Praxiom Health</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#0099DB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 15,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncInfo: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 5,
    marginLeft: 39,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 15,
    flex: 1,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0099DB',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#95A5A6',
  },
});
