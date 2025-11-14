import React, { useState, useEffect } from 'react';
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

export default function SettingsScreen({ navigation }) { // ✅ ADDED: navigation prop
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [deviceName, setDeviceName] = useState('Not Connected');
  const [watchConnected, setWatchConnected] = useState(false);

  useEffect(() => {
    loadSettings();
    loadDeviceName();
    checkWatchConnection();
    
    // Check watch connection periodically
    const interval = setInterval(checkWatchConnection, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const loadDeviceName = async () => {
    const name = await AsyncStorage.getItem('lastDeviceName');
    if (name) setDeviceName(name);
  };

  const checkWatchConnection = async () => {
    try {
      const watchStatus = await AsyncStorage.getItem('watchConnected');
      setWatchConnected(watchStatus === 'true');
    } catch (error) {
      console.error('Error checking watch connection:', error);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await AsyncStorage.getItem('healthData');
      if (!data) {
        Alert.alert('No Data', 'No health data to export');
        return;
      }

      const result = await Share.share({
        message: `Praxiom Health Data:\n\n${data}`,
        title: 'Health Data Export',
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Data exported successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all health data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('healthData');
              await AsyncStorage.removeItem('biomarkers');
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, value, onValueChange, type = 'switch' }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#00CFC1" style={styles.settingIcon} />
        <View>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: '#00CFC1' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
        />
      )}
      {type === 'button' && (
        <Ionicons name="chevron-forward" size={24} color="#999" />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Praxiom Health</Text>
      </View>

      {/* Device Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Device</Text>
        <View style={styles.deviceCard}>
          <Ionicons name="watch" size={32} color="#00CFC1" />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{deviceName}</Text>
            <Text style={[
              styles.deviceStatus,
              watchConnected ? styles.deviceConnected : styles.deviceDisconnected
            ]}>
              {watchConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
      </View>

      {/* ✅ ADDED: Personal Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Profile</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person" size={24} color="#00CFC1" />
          <Text style={styles.buttonText}>Edit Profile & Date of Birth</Text>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
        <Text style={styles.settingSubtitle}>
          ⚠️ Your age is required for accurate Bio-Age calculations
        </Text>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <SettingItem
          icon="notifications"
          title="Notifications"
          subtitle="Get notified about health updates"
          value={notifications}
          onValueChange={(val) => {
            setNotifications(val);
            saveSetting('notifications', val);
          }}
        />
        <SettingItem
          icon="sync"
          title="Auto Sync"
          subtitle="Automatically sync with watch"
          value={autoSync}
          onValueChange={(val) => {
            setAutoSync(val);
            saveSetting('autoSync', val);
          }}
        />
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity style={styles.button} onPress={handleExportData}>
          <Ionicons name="download" size={24} color="#00CFC1" />
          <Text style={styles.buttonText}>Export Health Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleClearData}>
          <Ionicons name="trash" size={24} color="#ff4444" />
          <Text style={[styles.buttonText, { color: '#ff4444' }]}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.appName}>Praxiom Health</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            Track your biological age and health metrics with your PineTime smartwatch.
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#00CFC1',
    marginTop: 5,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
  },
  deviceInfo: {
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  deviceStatus: {
    fontSize: 14,
    color: '#00CFC1',
    marginTop: 2,
  },
  deviceConnected: {
    color: '#4ade80',
  },
  deviceDisconnected: {
    color: '#ef4444',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00CFC1',
    marginLeft: 15,
  },
  aboutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  version: {
    fontSize: 14,
    color: '#00CFC1',
    marginTop: 5,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
});
