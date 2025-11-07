import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataBackupEnabled, setDataBackupEnabled] = useState(false);

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export feature coming soon!');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'Are you sure you want to clear all data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          Alert.alert('Success', 'All data has been cleared');
        }}
      ]
    );
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>PRAXIOM{'\n'}HEALTH</Text>

        {/* Profile Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Edit Profile</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#00CFC1' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Management</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Automatic Backup</Text>
            <Switch
              value={dataBackupEnabled}
              onValueChange={setDataBackupEnabled}
              trackColor={{ false: '#ccc', true: '#00CFC1' }}
              thumbColor={dataBackupEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={handleExportData}>
            <Text style={styles.settingText}>Export Data</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleClearData}>
            <Text style={[styles.settingText, styles.dangerText]}>Clear All Data</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Version</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingText}>Terms of Service</Text>
            <Text style={styles.arrow}>›</Text>
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
    marginBottom: 15,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  dangerText: {
    color: '#FF6B6B',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
  },
  versionText: {
    fontSize: 16,
    color: '#999',
  },
});
