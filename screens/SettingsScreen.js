import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [currentTier, setCurrentTier] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const dob = await AsyncStorage.getItem('dateOfBirth');
      const notif = await AsyncStorage.getItem('notifications');
      const tier = await AsyncStorage.getItem('currentTier');

      if (dob) setDateOfBirth(dob);
      if (notif) setNotifications(notif === 'true');
      if (tier) setCurrentTier(parseInt(tier));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const validateDate = (dateString) => {
    // Format: YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid and not in future
    return date instanceof Date && !isNaN(date) && date < now;
  };

  const handleSaveSettings = async () => {
    if (!dateOfBirth) {
      Alert.alert('Missing Date', 'Please enter your date of birth');
      return;
    }

    if (!validateDate(dateOfBirth)) {
      Alert.alert(
        'Invalid Date',
        'Please enter date in format: YYYY-MM-DD (e.g., 1990-01-15)'
      );
      return;
    }

    setIsSaving(true);

    try {
      await AsyncStorage.setItem('dateOfBirth', dateOfBirth);
      await AsyncStorage.setItem('notifications', notifications.toString());
      await AsyncStorage.setItem('currentTier', currentTier.toString());

      setIsSaving(false);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
      setIsSaving(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your biomarker history and reports. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('biomarkers_history');
              await AsyncStorage.removeItem('latest_biomarkers');
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const history = await AsyncStorage.getItem('biomarkers_history');
      const latest = await AsyncStorage.getItem('latest_biomarkers');
      
      const data = {
        exportDate: new Date().toISOString(),
        history: history ? JSON.parse(history) : [],
        latest: latest ? JSON.parse(latest) : null,
      };

      const jsonString = JSON.stringify(data, null, 2);
      
      Alert.alert(
        'Export Data',
        `Found ${data.history.length} entries. Data ready to export.`,
        [
          { text: 'OK' },
        ]
      );
      
      // In future, could use FileSystem to save or share
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  return (
    <LinearGradient
      colors={['rgba(50, 50, 60, 1)', 'rgba(20, 20, 30, 1)']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Profile</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <Text style={styles.inputHelp}>Format: YYYY-MM-DD (e.g., 1990-01-15)</Text>
            <TextInput
              style={styles.input}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="1990-01-15"
              placeholderTextColor="#666"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your date of birth is used to calculate your chronological age and Bio-Age deviation.
            </Text>
          </View>
        </View>

        {/* Assessment Tier */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Assessment Tier</Text>
          
          <View style={styles.tierSelector}>
            <TouchableOpacity
              style={[styles.tierButton, currentTier === 1 && styles.tierButtonActive]}
              onPress={() => setCurrentTier(1)}
            >
              <Text style={[styles.tierButtonText, currentTier === 1 && styles.tierButtonTextActive]}>
                Tier 1
              </Text>
              <Text style={styles.tierButtonSubtext}>Foundation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tierButton, currentTier === 2 && styles.tierButtonActive]}
              onPress={() => setCurrentTier(2)}
            >
              <Text style={[styles.tierButtonText, currentTier === 2 && styles.tierButtonTextActive]}>
                Tier 2
              </Text>
              <Text style={styles.tierButtonSubtext}>Personalization</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tierButton, currentTier === 3 && styles.tierButtonActive]}
              onPress={() => setCurrentTier(3)}
            >
              <Text style={[styles.tierButtonText, currentTier === 3 && styles.tierButtonTextActive]}>
                Tier 3
              </Text>
              <Text style={styles.tierButtonSubtext}>Optimization</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tierDescription}>
            {currentTier === 1 && (
              <Text style={styles.tierDescText}>
                Foundation assessment with oral health, systemic inflammation, and basic metabolic markers.
              </Text>
            )}
            {currentTier === 2 && (
              <Text style={styles.tierDescText}>
                Advanced inflammatory panel, DunedinPACE epigenetic clock, and wearable integration.
              </Text>
            )}
            {currentTier === 3 && (
              <Text style={styles.tierDescText}>
                Comprehensive assessment with MRI imaging, whole-genome mapping, and IC clock analysis.
              </Text>
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Reminders</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#00CFC1' }}
              thumbColor={notifications ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <Text style={styles.switchHelp}>
            Receive reminders for biomarker testing, supplement schedules, and follow-up assessments.
          </Text>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Data Management</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportData}
          >
            <Text style={styles.actionButtonText}>📤 Export Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              🗑️ Clear All Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>2.0.0</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Protocol Version</Text>
            <Text style={styles.aboutValue}>2025 Enhanced</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Current Tier</Text>
            <Text style={styles.aboutValue}>Tier {currentTier}</Text>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Alert.alert('Help', 'Visit support.praxiomhealth.com')}
          >
            <Text style={styles.linkButtonText}>📖 User Guide & Support</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : '💾 Save Settings'}
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inputHelp: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#00CFC1',
    lineHeight: 18,
  },
  tierSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tierButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tierButtonActive: {
    backgroundColor: 'rgba(0, 207, 193, 0.2)',
    borderColor: '#00CFC1',
  },
  tierButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AAAAAA',
  },
  tierButtonTextActive: {
    color: '#00CFC1',
  },
  tierButtonSubtext: {
    fontSize: 10,
    color: '#888888',
    marginTop: 4,
  },
  tierDescription: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  tierDescText: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  switchHelp: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  dangerButtonText: {
    color: '#F44336',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  aboutLabel: {
    fontSize: 15,
    color: '#AAAAAA',
  },
  aboutValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    color: '#00CFC1',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
