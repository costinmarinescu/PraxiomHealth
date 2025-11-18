import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../AppContext';

export default function SettingsScreen({ navigation }) {
  const { state, updateState, disconnectWatch } = useContext(AppContext);
  
  // Local state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempBirthdate, setTempBirthdate] = useState(
    state.profile?.birthdate ? new Date(state.profile.birthdate) : new Date(1990, 0, 1)
  );
  
  // Get REAL-TIME connection status from AppContext, NOT from AsyncStorage
  const isWatchConnected = state.watchConnected === true;
  const connectedDeviceName = state.connectedDevice?.name || 'PineTime';

  useEffect(() => {
    // Debug log to see what AppContext has
    console.log('SettingsScreen - Watch Status:', {
      watchConnected: state.watchConnected,
      connectedDevice: state.connectedDevice
    });
  }, [state.watchConnected, state.connectedDevice]);

  const handleBirthdateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempBirthdate;
    setShowDatePicker(false);
    setTempBirthdate(currentDate);
    
    // Save to profile
    updateState({
      profile: {
        ...state.profile,
        birthdate: currentDate.toISOString()
      }
    });
    
    Alert.alert('Success', 'Birthdate updated successfully');
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
            // TODO: Implement PDF export
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
              // Clear state
              updateState({
                bioAgeHistory: [],
                currentBioAge: null,
                wearableData: null
              });
              
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleWatchPress = () => {
    if (isWatchConnected) {
      // Already connected - offer to disconnect
      Alert.alert(
        'Watch Connected',
        `Connected to ${connectedDeviceName}. Do you want to disconnect?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                await disconnectWatch();
                Alert.alert('Success', 'Watch disconnected');
              } catch (error) {
                Alert.alert('Error', 'Failed to disconnect: ' + error.message);
              }
            }
          }
        ]
      );
    } else {
      // Not connected - go to watch screen
      navigation.navigate('Watch');
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
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
              color={isWatchConnected ? "#00CFC1" : "#666"} 
            />
            <View style={styles.deviceInfo}>
              <Text style={[
                styles.deviceStatus,
                { color: isWatchConnected ? '#00CFC1' : '#999' }
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
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Personal Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Profile</Text>
          
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="person" size={24} color="#00CFC1" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Date of Birth</Text>
              <Text style={styles.profileValue}>
                {state.profile?.birthdate 
                  ? new Date(state.profile.birthdate).toLocaleDateString()
                  : 'Not set'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={tempBirthdate}
              mode="date"
              display="default"
              onChange={handleBirthdateChange}
              maximumDate={new Date()}
            />
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
              <Ionicons name="notifications" size={24} color="#00CFC1" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDesc}>Get notified about health updates</Text>
              </View>
            </View>
            <Switch
              value={state.settings?.notificationsEnabled || false}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#767577', true: '#00CFC1' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="sync" size={24} color="#00CFC1" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto Sync</Text>
                <Text style={styles.settingDesc}>Automatically sync with watch</Text>
              </View>
            </View>
            <Switch
              value={state.settings?.autoSyncEnabled || false}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: '#767577', true: '#00CFC1' }}
              thumbColor="#fff"
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
            <Ionicons name="download" size={24} color="#00CFC1" />
            <Text style={styles.dataButtonText}>Export Health Data</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataButton, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Ionicons name="trash" size={24} color="#F44336" />
            <Text style={[styles.dataButtonText, styles.dangerText]}>
              Clear All Data
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Praxiom Health v1.0</Text>
          <Text style={styles.appInfoText}>2025 Edition - Bio-Age Protocol</Text>
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
    paddingBottom: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#00CFC1',
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 15,
  },
  deviceStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceName: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  deviceHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  profileValue: {
    fontSize: 14,
    color: '#00CFC1',
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningText: {
    fontSize: 13,
    color: '#FFC107',
    marginLeft: 10,
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: '#FFF',
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dataButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    flex: 1,
    marginLeft: 15,
  },
  dangerButton: {
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  dangerText: {
    color: '#F44336',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  appInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
});
