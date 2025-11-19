import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../AppContext';

export default function SettingsScreen({ navigation }) {
  const { state, updateState, disconnectWatch } = useAppContext();
  
  // ✅ FIX: Simple date inputs instead of DateTimePicker
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  
  const isWatchConnected = state.watchConnected === true;
  const connectedDeviceName = state.connectedDevice?.name || 'PineTime';

  // Load existing birthdate
  useEffect(() => {
    if (state.profile?.birthdate) {
      const date = new Date(state.profile.birthdate);
      setBirthYear(date.getFullYear().toString());
      setBirthMonth((date.getMonth() + 1).toString());
      setBirthDay(date.getDate().toString());
    }
  }, [state.profile?.birthdate]);

  // ✅ NEW: Calculate age from birthdate
  const calculateAge = (birthdate) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // ✅ FIX: Calculate and save chronological age from birthdate
  const handleSaveBirthdate = async () => {
    const year = parseInt(birthYear);
    const month = parseInt(birthMonth);
    const day = parseInt(birthDay);

    // Validation
    if (!year || !month || !day) {
      Alert.alert('Invalid Date', 'Please enter year, month, and day');
      return;
    }

    if (year < 1900 || year > new Date().getFullYear()) {
      Alert.alert('Invalid Year', 'Please enter a valid year');
      return;
    }

    if (month < 1 || month > 12) {
      Alert.alert('Invalid Month', 'Month must be between 1 and 12');
      return;
    }

    if (day < 1 || day > 31) {
      Alert.alert('Invalid Day', 'Day must be between 1 and 31');
      return;
    }

    // Create date
    const birthdate = new Date(year, month - 1, day);
    
    // ✅ NEW: Calculate chronological age
    const chronologicalAge = calculateAge(birthdate);
    
    // Validate age is reasonable
    if (chronologicalAge < 18 || chronologicalAge > 120) {
      Alert.alert('Invalid Age', `Calculated age is ${chronologicalAge}. Please check your birthdate.`);
      return;
    }
    
    try {
      // Save chronological age to AsyncStorage
      await AsyncStorage.setItem('chronologicalAge', chronologicalAge.toString());
      console.log('✅ Chronological age saved:', chronologicalAge);
      
      // Update state with both birthdate AND chronological age
      updateState({
        profile: {
          ...state.profile,
          birthdate: birthdate.toISOString()
        },
        chronologicalAge: chronologicalAge
      });
      
      Alert.alert(
        'Success',
        `Date of birth updated successfully!\n\nYour chronological age: ${chronologicalAge} years`
      );
    } catch (error) {
      console.error('Error saving birthdate:', error);
      Alert.alert('Error', 'Failed to save date of birth');
    }
  };

  const handleToggleNotifications = (value) => {
    updateState({
      settings: {
        ...state.settings,
        notificationsEnabled: value
      }
    });
  };

  const handleToggleAutoSync = (value) => {
    updateState({
      settings: {
        ...state.settings,
        autoSyncEnabled: value
      }
    });
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Health Data',
      'Export your Praxiom Age history and biomarker data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            Alert.alert('Coming Soon', 'Data export feature is under development');
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL your health data, biomarker history, and Praxiom Age calculations. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              updateState({
                biologicalAge: 0,
                oralHealthScore: 50,
                systemicHealthScore: 45,
                vitalityIndex: 47.5,
                fitnessScore: 65,
                salivaryPH: null,
                mmp8: null,
                flowRate: null,
                hsCRP: null,
                omega3Index: null,
                hba1c: null,
                gdf15: null,
                vitaminD: null,
              });
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleWatchPress = () => {
    if (isWatchConnected) {
      Alert.alert(
        'Connected Device',
        `${connectedDeviceName} is connected`,
        [
          { text: 'OK' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: disconnectWatch
          }
        ]
      );
    } else {
      navigation.navigate('Watch');
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FDC830', '#00CED1']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.subtitle}>Praxiom Health</Text>

        {/* Connected Device Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Device</Text>
          
          <TouchableOpacity 
            style={styles.deviceCard}
            onPress={handleWatchPress}
          >
            <Ionicons 
              name={isWatchConnected ? "watch" : "watch-outline"} 
              size={40} 
              color={isWatchConnected ? "#fff" : "rgba(255,255,255,0.5)"} 
            />
            <View style={styles.deviceInfo}>
              <Text style={[
                styles.deviceStatus,
                { color: isWatchConnected ? '#fff' : 'rgba(255,255,255,0.7)' }
              ]}>
                {isWatchConnected ? 'Connected' : 'Not Connected'}
              </Text>
              {isWatchConnected && (
                <Text style={styles.deviceName}>{connectedDeviceName}</Text>
              )}
              {!isWatchConnected && (
                <Text style={styles.deviceHint}>Tap to connect</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Date of Birth</Text>
            
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>Year</Text>
                <TextInput
                  style={styles.dateInput}
                  value={birthYear}
                  onChangeText={setBirthYear}
                  placeholder="1990"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>Month</Text>
                <TextInput
                  style={styles.dateInput}
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                  placeholder="01"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>Day</Text>
                <TextInput
                  style={styles.dateInput}
                  value={birthDay}
                  onChangeText={setBirthDay}
                  placeholder="15"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
            
            {state.profile?.birthdate && (
              <Text style={styles.currentValue}>
                Current: {new Date(state.profile.birthdate).toLocaleDateString()}
              </Text>
            )}
            {!state.profile?.birthdate && (
              <Text style={styles.noValue}>
                Not set - Required for Praxiom Age calculation
              </Text>
            )}
            
            {/* ✅ NEW: Show calculated chronological age */}
            {state.chronologicalAge > 0 && (
              <Text style={styles.ageDisplay}>
                Your age: {state.chronologicalAge} years
              </Text>
            )}
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveBirthdate}
            >
              <Text style={styles.saveButtonText}>Save Date of Birth</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive alerts for Praxiom Age updates
                </Text>
              </View>
              <Switch
                value={state.settings?.notificationsEnabled || false}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#767577', true: '#00CED1' }}
                thumbColor={state.settings?.notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Auto-Sync</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync with connected devices
                </Text>
              </View>
              <Switch
                value={state.settings?.autoSyncEnabled || true}
                onValueChange={handleToggleAutoSync}
                trackColor={{ false: '#767577', true: '#00CED1' }}
                thumbColor={state.settings?.autoSyncEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleExportData}
          >
            <Ionicons name="download-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Export Health Data</Text>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Clear All Data</Text>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Praxiom Health</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Precision Longevity Medicine Platform
            </Text>
            <Text style={styles.aboutCopyright}>
              © 2025 Praxiom Health. All rights reserved.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deviceStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  deviceHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  settingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  currentValue: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  noValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ageDisplay: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  saveButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dangerButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderColor: 'rgba(231, 76, 60, 0.5)',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  aboutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  aboutVersion: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  aboutCopyright: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
