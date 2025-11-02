import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  return (
    <LinearGradient
      colors={['rgba(255, 107, 53, 0.3)', 'rgba(0, 0, 0, 0.9)', 'rgba(0, 188, 212, 0.3)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Text style={styles.settingValue}>On</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Data Sync Frequency</Text>
          <Text style={styles.settingValue}>Every 3 minutes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Units</Text>
          <Text style={styles.settingValue}>Metric</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Wearable Integration</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Apple Health</Text>
          <Text style={styles.settingValue}>Not Connected</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Garmin Connect</Text>
          <Text style={styles.settingValue}>Not Connected</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Fitbit</Text>
          <Text style={styles.settingValue}>Not Connected</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Device</Text>
          <Text style={styles.infoValue}>Praxiom Health</Text>
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
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
  },
  settingItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    color: '#FF6B35',
    fontSize: 16,
  },
  infoItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#aaa',
    fontSize: 16,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
