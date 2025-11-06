import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataBackupEnabled, setDataBackupEnabled] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notificationsEnabled');
      const storedBackup = await AsyncStorage.getItem('dataBackupEnabled');
      const storedName = await AsyncStorage.getItem('userName');

      if (storedNotifications !== null) {
        setNotificationsEnabled(storedNotifications === 'true');
      }
      if (storedBackup !== null) {
        setDataBackupEnabled(storedBackup === 'true');
      }
      if (storedName) {
        setUserName(storedName);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('notificationsEnabled', value.toString());
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification setting');
    }
  };

  const toggleBackup = async (value) => {
    setDataBackupEnabled(value);
    try {
      await AsyncStorage.setItem('dataBackupEnabled', value.toString());
    } catch (error) {
      Alert.alert('Error', 'Failed to save backup setting');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all your health data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data has been cleared');
              loadSettings(); // Reload default settings
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const exportData = () => {
    Alert.alert(
      'Export Data',
      'Export functionality will be available in the next update. Your data will be exported as a JSON file.',
      [{ text: 'OK' }]
    );
  };

  const contactSupport = () => {
    Linking.openURL('mailto:support@praxiomhealth.com');
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>User</Text>
              <Text style={styles.profileValue}>{userName || 'Guest User'}</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.profileRow}>
              <Text style={styles.profileLabel}>Edit Profile</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Health Data</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Data Backup</Text>
                <Text style={styles.settingDescription}>
                  Automatically backup your health data
                </Text>
              </View>
              <Switch
                value={dataBackupEnabled}
                onValueChange={toggleBackup}
                trackColor={{ false: '#D1D1D6', true: '#00CFC1' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.buttonRow} onPress={exportData}>
              <Text style={styles.buttonLabel}>Export Data</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.buttonRow} onPress={clearAllData}>
              <Text style={[styles.buttonLabel, { color: '#F44336' }]}>Clear All Data</Text>
              <Text style={[styles.arrow, { color: '#F44336' }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive reminders and health insights
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#D1D1D6', true: '#00CFC1' }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        {/* Watch Integration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⌚ Watch Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.buttonRow}>
              <Text style={styles.buttonLabel}>Auto-sync to Watch</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.buttonRow}>
              <Text style={styles.buttonLabel}>Watch Display Preferences</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.buttonRow} onPress={contactSupport}>
              <Text style={styles.buttonLabel}>Contact Support</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.buttonRow}>
              <Text style={styles.buttonLabel}>Privacy Policy</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.buttonRow}>
              <Text style={styles.buttonLabel}>Terms of Service</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Praxiom Health © 2025{'\n'}
            Precision Longevity Medicine
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
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
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  profileLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  arrow: {
    fontSize: 24,
    color: '#7F8C8D',
    fontWeight: '300',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
});
