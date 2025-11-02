import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableDataService from '../services/WearableDataService';

export default function SettingsScreen({ navigation }) {
  const [autoSync, setAutoSync] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [healthPermissions, setHealthPermissions] = useState(false);
  const [wearableAvailable, setWearableAvailable] = useState(false);

  useEffect(() => {
    loadSettings();
    checkWearableAvailability();
  }, []);

  const checkWearableAvailability = () => {
    const available = WearableDataService.isAvailable();
    setWearableAvailable(available);
    if (!available) {
      console.log('Wearable integration not available - native modules not configured');
    }
  };

  const loadSettings = async () => {
    try {
      const autoSyncValue = await AsyncStorage.getItem('autoSync');
      const lastSyncValue = await AsyncStorage.getItem('wearableDataLastSync');
      
      if (autoSyncValue !== null) {
        setAutoSync(JSON.parse(autoSyncValue));
      }
      if (lastSyncValue) {
        setLastSync(new Date(lastSyncValue));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleAutoSyncToggle = async (value) => {
    setAutoSync(value);
    await AsyncStorage.setItem('autoSync', JSON.stringify(value));
  };

  const requestHealthPermissions = async () => {
    if (!wearableAvailable) {
      Alert.alert(
        'Feature Not Available',
        'Wearable integration requires native health libraries. This feature will be available in production builds.\n\nFor now, you can manually enter health data or use the watch sync feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const granted = await WearableDataService.initialize();
      setHealthPermissions(granted);
      
      if (granted) {
        Alert.alert(
          'Permissions Granted',
          'Health data access has been granted. You can now import data from your wearables.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permissions Denied',
          'Health data access is required to import data from wearables. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request health permissions: ' + error.message);
    }
  };

  const importWearableData = async () => {
    if (!wearableAvailable) {
      Alert.alert(
        'Feature Not Available',
        'Wearable integration requires native health libraries. This feature will be available in production builds.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!healthPermissions) {
      Alert.alert(
        'Permissions Required',
        'Please grant health data permissions first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permissions', onPress: requestHealthPermissions },
        ]
      );
      return;
    }

    setImporting(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const healthData = await WearableDataService.fetchHealthData(startDate, endDate);
      
      // Calculate scores
      const fitnessScore = WearableDataService.calculateFitnessScore(healthData);
      const systemicScore = WearableDataService.calculateSystemicScore(healthData);

      // Update health data
      const currentHealthData = await AsyncStorage.getItem('healthData');
      const parsedData = currentHealthData ? JSON.parse(currentHealthData) : {};
      
      const updatedData = {
        ...parsedData,
        fitnessScore: Math.round(fitnessScore),
        systemicHealthScore: Math.round(systemicScore),
      };

      await AsyncStorage.setItem('healthData', JSON.stringify(updatedData));
      setLastSync(new Date());

      Alert.alert(
        'Import Successful',
        `Data imported successfully!\nFitness Score: ${Math.round(fitnessScore)}\nSystemic Score: ${Math.round(systemicScore)}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (error) {
      Alert.alert('Import Failed', error.message);
    } finally {
      setImporting(false);
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#1585B5" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['rgba(21, 133, 181, 0.3)', 'rgba(94, 221, 238, 0.3)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Wearable Integration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wearable Integration</Text>
          
          <SettingItem
            icon={Platform.OS === 'ios' ? 'fitness' : 'logo-google'}
            title={Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
            subtitle={healthPermissions ? 'Connected' : 'Not connected'}
            onPress={requestHealthPermissions}
            rightElement={
              <Ionicons 
                name={healthPermissions ? 'checkmark-circle' : 'chevron-forward'} 
                size={24} 
                color={healthPermissions ? '#4CAF50' : '#999'} 
              />
            }
          />

          <TouchableOpacity 
            style={[styles.importButton, importing && styles.importButtonDisabled]}
            onPress={importWearableData}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={24} color="#FFFFFF" />
                <Text style={styles.importButtonText}>Import Wearable Data</Text>
              </>
            )}
          </TouchableOpacity>

          {lastSync && (
            <Text style={styles.lastSyncText}>
              Last sync: {lastSync.toLocaleDateString()} at {lastSync.toLocaleTimeString()}
            </Text>
          )}

          <SettingItem
            icon="sync"
            title="Auto-sync"
            subtitle="Automatically sync data daily"
            rightElement={
              <Switch
                value={autoSync}
                onValueChange={handleAutoSyncToggle}
                trackColor={{ false: '#D0D0D0', true: '#5EDDEE' }}
                thumbColor={autoSync ? '#1585B5' : '#F4F4F4'}
              />
            }
          />
        </View>

        {/* Supported Devices Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported Devices</Text>
          
          <View style={styles.deviceGrid}>
            <DeviceCard name="Apple Watch" icon="watch" supported={Platform.OS === 'ios'} />
            <DeviceCard name="Garmin" icon="fitness-outline" supported={false} />
            <DeviceCard name="Fitbit" icon="fitness-outline" supported={false} />
            <DeviceCard name="Google Fit" icon="fitness-outline" supported={Platform.OS === 'android'} />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#1585B5" />
            <Text style={styles.infoText}>
              {Platform.OS === 'ios' 
                ? 'Currently supporting Apple Health. Garmin and Fitbit integration coming soon.'
                : 'Currently supporting Google Fit. Garmin and Fitbit integration coming soon.'}
            </Text>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <SettingItem
            icon="person-outline"
            title="Personal Information"
            subtitle="Update your age and health profile"
            onPress={() => Alert.alert('Coming Soon', 'This feature is under development')}
            rightElement={<Ionicons name="chevron-forward" size={24} color="#999" />}
          />

          <SettingItem
            icon="medkit-outline"
            title="Health Biomarkers"
            subtitle="Manage your oral and systemic markers"
            onPress={() => Alert.alert('Coming Soon', 'This feature is under development')}
            rightElement={<Ionicons name="chevron-forward" size={24} color="#999" />}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => Alert.alert('Help', 'Contact: support@praxiomhealth.com')}
            rightElement={<Ionicons name="chevron-forward" size={24} color="#999" />}
          />

          <SettingItem
            icon="document-text-outline"
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Your health data is stored locally and encrypted')}
            rightElement={<Ionicons name="chevron-forward" size={24} color="#999" />}
          />

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function DeviceCard({ name, icon, supported }) {
  return (
    <View style={[styles.deviceCard, !supported && styles.deviceCardDisabled]}>
      <Ionicons name={icon} size={32} color={supported ? '#1585B5' : '#999'} />
      <Text style={[styles.deviceName, !supported && styles.deviceNameDisabled]}>{name}</Text>
      {!supported && <Text style={styles.comingSoon}>Coming Soon</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 133, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  importButton: {
    backgroundColor: '#1585B5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  importButtonDisabled: {
    backgroundColor: '#999',
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  deviceCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceCardDisabled: {
    opacity: 0.6,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  deviceNameDisabled: {
    color: '#999',
  },
  comingSoon: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 4,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: 'rgba(21, 133, 181, 0.1)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1585B5',
    marginLeft: 10,
    lineHeight: 18,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});
