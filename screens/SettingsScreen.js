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
  const { state } = useContext(AppContext);
  const [notifications, setNotifications] = React.useState(true);
  const [autoSync, setAutoSync] = React.useState(true);

  useEffect(() => {
    loadSettings();
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

  const saveSetting = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await AsyncStorage.getItem('praxiomHealthData');
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
              await AsyncStorage.removeItem('praxiomHealthData');
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
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      )}
      {type === 'button' && (
        <Ionicons name="chevron-forward" size={24} color="#00CFC1" />
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
        <TouchableOpacity 
          style={styles.deviceCard}
          onPress={() => navigation.navigate('Watch')}
        >
          <Ionicons 
            name={state.watchConnected ? "watch" : "watch-outline"} 
            size={40} 
            color={state.watchConnected ? "#00CFC1" : "#95A5A6"} 
          />
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>
              {state.watchConnected ? 'InfiniTime' : 'Not Connected'}
            </Text>
            <Text style={[styles.deviceStatus, { color: state.watchConnected ? '#00CFC1' : '#E74C3C' }]}>
              {state.watchConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </TouchableOpacity>
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
          <Ionicons name="trash" size={24} color="#E74C3C" />
          <Text style={[styles.buttonText, { color: '#E74C3C' }]}>Clear All Data</Text>
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
    marginTop: 2,
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
