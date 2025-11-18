import React, { useState, useContext, useEffect } from 'react';
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
import { AppContext } from '../AppContext';

export default function SettingsScreen({ navigation }) {
  const { state, updateState, disconnectWatch } = useContext(AppContext);
  
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

  // ✅ FIX: Simple date input handler
  const handleSaveBirthdate = () => {
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
    
    // Save
    updateState({
      profile: {
        ...state.profile,
        birthdate: birthdate.toISOString()
      }
    });
    
    Alert.alert('Success', 'Date of birth updated successfully');
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
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color="rgba(255,255,255,0.7)" 
            />
          </TouchableOpacity>
        </View>

        {/* Personal Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Profile - Date of Birth</Text>
          
          <View style={styles.dateInputContainer}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Year</Text>
              <TextInput
                style={styles.dateInput}
                value={birthYear}
                onChangeText={setBirthYear}
                keyboardType="number-pad"
                placeholder="1990"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={4}
              />
            </View>

            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Month</Text>
              <TextInput
                style={styles.dateInput}
                value={birthMonth}
                onChangeText={setBirthMonth}
                keyboardType="number-pad"
                placeholder="12"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={2}
              />
            </View>

            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Day</Text>
              <TextInput
                style={styles.dateInput}
                value={birthDay}
                onChangeText={setBirthDay}
                keyboardType="number-pad"
                placeholder="25"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={2}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveDateButton}
            onPress={handleSaveBirthdate}
          >
            <Text style={styles.saveDateButtonText}>Save Date of Birth</Text>
          </TouchableOpacity>

          {state.profile?.birthdate && (
            <Text style={styles.currentDate}>
              Current: {new Date(state.profile.birthdate).toLocaleDateString()}
            </Text>
          )}

          {!state.profile?.birthdate && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color="#FFC107" />
              <Text style={styles.warningText}>
                Your age is required for accurate Bio-Age calculations
              </Text>
            </View>
          )}
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#fff" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDesc}>Get notified about health updates</Text>
              </View>
            </View>
            <Switch
              value={state.settings?.notificationsEnabled || false}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#767577', true: '#fff' }}
              thumbColor="#FF6B35"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="sync" size={24} color="#fff" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDesc}>Automatically sync with watch</Text>
              </View>
            </View>
            <Switch
              value={state.settings?.autoSyncEnabled || false}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: '#767577', true: '#fff' }}
              thumbColor="#FF6B35"
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleExportData}
          >
            <Ionicons name="download" size={24} color="#fff" />
            <Text style={styles.dataButtonText}>Export Health Data</Text>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataButton, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Ionicons name="trash" size={24} color="#ff4444" />
            <Text style={[styles.dataButtonText, { color: '#ff4444' }]}>Clear All Data</Text>
            <Ionicons name="chevron-forward" size={24} color="#ff4444" />
          </TouchableOpacity>
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
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 32,
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
    fontSize: 18,
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
    padding: 20,
    borderRadius: 15,
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
  },
  deviceName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  deviceHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 5,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
    textAlign: 'center',
  },
  saveDateButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  saveDateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  currentDate: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dataButtonText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
});
