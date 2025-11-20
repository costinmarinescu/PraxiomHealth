import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { AppContext } from '../AppContext';
import SecureStorageService from '../services/SecureStorageService';

const SettingsScreen = ({ navigation }) => {
  const {
    autoSync,
    toggleAutoSync,
    notifications,
    toggleNotifications,
    dataSharing,
    toggleDataSharing,
    watchConnected,
    connectToWatch,
    disconnectFromWatch,
    getWatchInfo
  } = useContext(AppContext);

  const [connecting, setConnecting] = useState(false);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [localAutoSync, setLocalAutoSync] = useState(autoSync);

  /**
   * Load security status on mount
   */
  useEffect(() => {
    loadSecurityStatus();
  }, []);

  /**
   * Sync local state with context
   */
  useEffect(() => {
    setLocalAutoSync(autoSync);
  }, [autoSync]);

  /**
   * Load security status for debugging
   */
  const loadSecurityStatus = async () => {
    try {
      const status = await SecureStorageService.getSecurityStatus();
      setSecurityStatus(status);
    } catch (error) {
      console.error('Error loading security status:', error);
    }
  };

  /**
   * 🔥 FIX: Handle auto-sync toggle with proper state management
   */
  const handleAutoSyncToggle = async (value) => {
    try {
      console.log(`⚙️ User toggling auto-sync from ${localAutoSync} to ${value}`);
      
      // Optimistically update local UI immediately
      setLocalAutoSync(value);
      
      // Then persist to storage and context
      await toggleAutoSync(value);
      
      console.log('✅ Auto-sync toggle complete');
      
    } catch (error) {
      console.error('❌ Error toggling auto-sync:', error);
      
      // Revert local state on error
      setLocalAutoSync(!value);
      
      Alert.alert(
        'Error',
        'Failed to update auto-sync setting. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle watch connection
   */
  const handleWatchConnection = async () => {
    if (watchConnected) {
      // Disconnect
      Alert.alert(
        'Disconnect Watch',
        'Are you sure you want to disconnect from PineTime?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              await disconnectFromWatch();
              Alert.alert('Success', 'Watch disconnected');
            }
          }
        ]
      );
    } else {
      // Connect
      setConnecting(true);
      try {
        await connectToWatch();
        Alert.alert('Success', 'Connected to PineTime watch');
      } catch (error) {
        Alert.alert('Connection Failed', error.message);
      } finally {
        setConnecting(false);
      }
    }
  };

  /**
   * Handle notifications toggle
   */
  const handleNotificationsToggle = async (value) => {
    try {
      await toggleNotifications(value);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notifications setting');
    }
  };

  /**
   * Handle data sharing toggle
   */
  const handleDataSharingToggle = async (value) => {
    if (value) {
      // Show confirmation before enabling data sharing
      Alert.alert(
        'Enable Data Sharing',
        'Do you want to share your anonymized health data to improve longevity research?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                await toggleDataSharing(true);
              } catch (error) {
                console.error('Error enabling data sharing:', error);
              }
            }
          }
        ]
      );
    } else {
      try {
        await toggleDataSharing(false);
      } catch (error) {
        console.error('Error disabling data sharing:', error);
      }
    }
  };

  /**
   * Clear all data (with confirmation)
   */
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your biomarker data, calculations, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStorageService.clear();
              Alert.alert(
                'Data Cleared',
                'All data has been deleted. Please restart the app.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // In a real app, you would restart or navigate to onboarding
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error.message);
            }
          }
        }
      ]
    );
  };

  /**
   * Show watch info
   */
  const handleShowWatchInfo = () => {
    const info = getWatchInfo();
    Alert.alert(
      'Watch Information',
      `Status: ${info.connected ? 'Connected' : 'Disconnected'}\n` +
      `Device: ${info.deviceName}\n` +
      `Auto-Sync: ${info.autoSync ? 'Enabled' : 'Disabled'}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* PineTime Watch Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PineTime Watch</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Watch Status</Text>
              <Text style={styles.settingDescription}>
                {watchConnected ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.button,
                watchConnected && styles.buttonDanger,
                connecting && styles.buttonDisabled
              ]}
              onPress={handleWatchConnection}
              disabled={connecting}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {watchConnected ? 'Disconnect' : 'Connect'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {watchConnected && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Auto-Sync Bio-Age</Text>
                  <Text style={styles.settingDescription}>
                    Automatically sync bio-age to watch after calculations
                  </Text>
                </View>
                <Switch
                  value={localAutoSync}
                  onValueChange={handleAutoSyncToggle}
                  trackColor={{ false: '#ccc', true: '#FF6B35' }}
                  thumbColor={localAutoSync ? '#fff' : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity
                style={styles.infoButton}
                onPress={handleShowWatchInfo}
              >
                <Text style={styles.infoButtonText}>View Watch Details</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive reminders for biomarker assessments
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#ccc', true: '#FF6B35' }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Sharing</Text>
              <Text style={styles.settingDescription}>
                Share anonymized data for longevity research
              </Text>
            </View>
            <Switch
              value={dataSharing}
              onValueChange={handleDataSharingToggle}
              trackColor={{ false: '#ccc', true: '#FF6B35' }}
              thumbColor={dataSharing ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Security Status (Debug Info) */}
          {securityStatus && (
            <View style={styles.securityInfo}>
              <Text style={styles.securityLabel}>Security Status</Text>
              <Text style={styles.securityValue}>
                {securityStatus.securityLevel}
              </Text>
              <Text style={styles.securityDetail}>
                {securityStatus.encryptedKeys} encrypted keys
              </Text>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ProtocolInfo')}
          >
            <Text style={styles.menuItemText}>Praxiom Protocol Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details...')}
          >
            <Text style={styles.menuItemText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service details...')}
          >
            <Text style={styles.menuItemText}>Terms of Service</Text>
          </TouchableOpacity>

          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <Text style={styles.versionText}>© 2025 Praxiom Health</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearData}
          >
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  content: {
    padding: 20
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingInfo: {
    flex: 1,
    marginRight: 16
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 13,
    color: '#666'
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  buttonDanger: {
    backgroundColor: '#dc3545'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  infoButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center'
  },
  infoButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600'
  },
  securityInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8
  },
  securityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4
  },
  securityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 2
  },
  securityDetail: {
    fontSize: 12,
    color: '#4caf50'
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  menuItemText: {
    fontSize: 16,
    color: '#333'
  },
  versionInfo: {
    marginTop: 16,
    alignItems: 'center'
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  dangerSection: {
    borderColor: '#dc3545',
    borderWidth: 1
  },
  dangerTitle: {
    color: '#dc3545'
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default SettingsScreen;
