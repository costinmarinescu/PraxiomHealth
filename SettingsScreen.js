import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const handleAbout = () => {
    Alert.alert(
      'About Praxiom Health',
      'Version 1.0.0\n\nA health monitoring app that connects to your Praxiom smartwatch ' +
      'and integrates data from multiple wearable devices.\n\n' +
      '© 2025 Praxiom Health',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'For help with:\n\n' +
      '• Connecting your watch\n' +
      '• Importing data\n' +
      '• Understanding your health scores\n\n' +
      'Visit our support page or contact support@praxiomhealth.com',
      [
        { text: 'Cancel' },
        { 
          text: 'Visit Support',
          onPress: () => Linking.openURL('https://github.com/costinmarinescu/PraxiomHealth')
        }
      ]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy & Data',
      'Praxiom Health takes your privacy seriously:\n\n' +
      '• Health data is stored locally on your device\n' +
      '• No data is shared with third parties\n' +
      '• Bluetooth connections are secure\n' +
      '• You have full control over your data',
      [{ text: 'OK' }]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all health data from the app. This action cannot be undone.\n\n' +
      'Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data clearing
            Alert.alert('Success', 'All data has been cleared');
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color = '#333' }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#3BCEAC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.sectionCard}>
              <SettingItem
                icon="person-outline"
                title="Profile"
                subtitle="Manage your profile information"
                onPress={() => Alert.alert('Profile', 'Profile settings coming soon')}
              />
              <SettingItem
                icon="notifications-outline"
                title="Notifications"
                subtitle="Manage notification preferences"
                onPress={() => Alert.alert('Notifications', 'Notification settings coming soon')}
              />
            </View>
          </View>

          {/* Device Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVICE</Text>
            <View style={styles.sectionCard}>
              <SettingItem
                icon="watch-outline"
                title="Watch Connection"
                subtitle="Manage Praxiom watch connection"
                onPress={() => Alert.alert('Watch', 'Navigate to Watch tab to manage connection')}
              />
              <SettingItem
                icon="bluetooth-outline"
                title="Bluetooth"
                subtitle="Bluetooth connection settings"
                onPress={() => Alert.alert('Bluetooth', 'Bluetooth settings coming soon')}
              />
            </View>
          </View>

          {/* Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATA</Text>
            <View style={styles.sectionCard}>
              <SettingItem
                icon="download-outline"
                title="Import Data"
                subtitle="Import from Garmin, Fitbit, Apple Health"
                onPress={() => Alert.alert('Import', 'Go to Dashboard to import data')}
              />
              <SettingItem
                icon="cloud-upload-outline"
                title="Export Data"
                subtitle="Export your health data"
                onPress={() => Alert.alert('Export', 'Export feature coming soon')}
              />
              <SettingItem
                icon="trash-outline"
                title="Clear Data"
                subtitle="Remove all health data from app"
                onPress={handleClearData}
                color="#F44336"
              />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SUPPORT</Text>
            <View style={styles.sectionCard}>
              <SettingItem
                icon="help-circle-outline"
                title="Help & Support"
                subtitle="Get help and contact support"
                onPress={handleHelp}
              />
              <SettingItem
                icon="shield-checkmark-outline"
                title="Privacy & Security"
                subtitle="Learn how we protect your data"
                onPress={handlePrivacy}
              />
              <SettingItem
                icon="information-circle-outline"
                title="About"
                subtitle="App version and information"
                onPress={handleAbout}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Praxiom Health v1.0.0</Text>
            <Text style={styles.footerText}>© 2025 Praxiom Health</Text>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 10,
    letterSpacing: 1,
    opacity: 0.9,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 5,
  },
});
