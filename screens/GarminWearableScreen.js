import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';
import GarminService from '../services/GarminService';

export default function GarminWearableScreen({ navigation }) {
  const { state, updateState } = useContext(AppContext);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Garmin API credentials
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  
  // Health data from Garmin
  const [healthData, setHealthData] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  /**
   * Check if Garmin is already connected
   */
  const checkConnectionStatus = async () => {
    try {
      const status = GarminService.getConnectionStatus();
      setIsConnected(status.isConnected);
      
      if (status.isConnected) {
        // Load existing health data
        await fetchHealthData();
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  /**
   * Handle Garmin connection
   */
  const handleConnect = async () => {
    if (!consumerKey.trim() || !consumerSecret.trim()) {
      Alert.alert('Missing Credentials', 'Please enter both Consumer Key and Consumer Secret');
      return;
    }

    setIsLoading(true);
    try {
      // Initialize Garmin service with credentials
      GarminService.consumerKey = consumerKey.trim();
      GarminService.consumerSecret = consumerSecret.trim();

      // Start OAuth flow
      const authResult = await GarminService.authenticate();
      
      if (authResult.success) {
        setIsConnected(true);
        setShowCredentials(false);
        
        Alert.alert(
          'Connected!',
          'Successfully connected to Garmin. Fetching your health data...',
          [{ text: 'OK', onPress: () => fetchHealthData() }]
        );
      } else {
        Alert.alert(
          'Connection Failed',
          authResult.error || 'Could not connect to Garmin. Please check your credentials and try again.'
        );
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect to Garmin: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch health data from Garmin
   */
  const fetchHealthData = async () => {
    try {
      const data = await GarminService.getHealthData();
      setHealthData(data);
      setLastSyncTime(new Date().toLocaleString());
      
      // Update context with Garmin data
      updateState({
        garminHeartRate: data.heartRate,
        garminHRV: data.hrv,
        garminSteps: data.steps,
        garminVO2Max: data.vo2Max,
        garminStressLevel: data.stressLevel,
        garminBodyBattery: data.bodyBattery,
        garminRespirationRate: data.respirationRate,
        lastGarminSync: data.lastSync
      });

      return data;
    } catch (error) {
      console.error('Error fetching health data:', error);
      Alert.alert('Sync Error', 'Could not fetch health data from Garmin');
      return null;
    }
  };

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
  };

  /**
   * Disconnect from Garmin
   */
  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Garmin',
      'Are you sure you want to disconnect from Garmin? Your health data will no longer sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await GarminService.disconnect();
            setIsConnected(false);
            setHealthData(null);
            setLastSyncTime(null);
            
            // Clear context data
            updateState({
              garminHeartRate: null,
              garminHRV: null,
              garminSteps: null,
              garminVO2Max: null,
              garminStressLevel: null,
              garminBodyBattery: null,
              garminRespirationRate: null,
              lastGarminSync: null
            });
          }
        }
      ]
    );
  };

  /**
   * Calculate fitness score from Garmin data
   */
  const calculateFitnessScore = () => {
    if (!healthData) return null;

    let score = 0;
    let count = 0;

    // HRV scoring (0-100)
    if (healthData.hrv !== null && healthData.hrv > 0) {
      if (healthData.hrv >= 70) score += 100;
      else if (healthData.hrv >= 50) score += 80;
      else if (healthData.hrv >= 30) score += 60;
      else score += 40;
      count++;
    }

    // Steps scoring (0-100)
    if (healthData.steps > 0) {
      if (healthData.steps >= 10000) score += 100;
      else if (healthData.steps >= 8000) score += 85;
      else if (healthData.steps >= 5000) score += 70;
      else if (healthData.steps >= 3000) score += 50;
      else score += 30;
      count++;
    }

    // VO2 Max scoring (0-100)
    if (healthData.vo2Max !== null && healthData.vo2Max > 0) {
      if (healthData.vo2Max >= 45) score += 100;
      else if (healthData.vo2Max >= 35) score += 85;
      else if (healthData.vo2Max >= 25) score += 70;
      else score += 50;
      count++;
    }

    // Body Battery scoring (0-100) - Garmin-specific metric
    if (healthData.bodyBattery !== null && healthData.bodyBattery > 0) {
      score += healthData.bodyBattery;
      count++;
    }

    // Stress Level scoring (inverted - lower is better)
    if (healthData.stressLevel !== null) {
      // Assume stress is 0-100 scale
      const stressScore = 100 - healthData.stressLevel;
      score += stressScore;
      count++;
    }

    return count > 0 ? Math.round(score / count) : null;
  };

  const fitnessScore = calculateFitnessScore();

  /**
   * Open Garmin Developer portal
   */
  const openGarminDeveloper = () => {
    Linking.openURL('https://developer.garmin.com/');
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4ff"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="fitness" size={32} color="#00d4ff" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Garmin Connect</Text>
              <Text style={styles.headerSubtitle}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, isConnected ? styles.connectedBadge : styles.disconnectedBadge]}>
            <Ionicons
              name={isConnected ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color="white"
            />
          </View>
        </View>

        {/* Connection Section */}
        {!isConnected ? (
          <View style={styles.connectionSection}>
            <Text style={styles.sectionTitle}>Connect Your Garmin Device</Text>
            <Text style={styles.instructionText}>
              To connect your Garmin wearable, you need API credentials from Garmin Developer:
            </Text>

            <TouchableOpacity style={styles.developerButton} onPress={openGarminDeveloper}>
              <Ionicons name="link" size={20} color="#00d4ff" />
              <Text style={styles.developerButtonText}>Get API Credentials</Text>
              <Ionicons name="open-outline" size={16} color="#00d4ff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleCredentialsButton}
              onPress={() => setShowCredentials(!showCredentials)}
            >
              <Text style={styles.toggleCredentialsText}>
                {showCredentials ? 'Hide' : 'Show'} Credential Fields
              </Text>
              <Ionicons
                name={showCredentials ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#00d4ff"
              />
            </TouchableOpacity>

            {showCredentials && (
              <View style={styles.credentialInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Consumer Key</Text>
                  <TextInput
                    style={styles.input}
                    value={consumerKey}
                    onChangeText={setConsumerKey}
                    placeholder="Enter Consumer Key"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Consumer Secret</Text>
                  <TextInput
                    style={styles.input}
                    value={consumerSecret}
                    onChangeText={setConsumerSecret}
                    placeholder="Enter Consumer Secret"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.connectButton, isLoading && styles.connectButtonDisabled]}
                  onPress={handleConnect}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="link" size={20} color="white" />
                      <Text style={styles.connectButtonText}>Connect to Garmin</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Fitness Score Card */}
            {fitnessScore !== null && (
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Overall Fitness Score</Text>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreValue}>{fitnessScore}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarFill, { width: `${fitnessScore}%` }]} />
                </View>
                <Text style={styles.scoreDescription}>
                  {fitnessScore >= 80 ? 'Excellent fitness level!' :
                   fitnessScore >= 60 ? 'Good fitness level' :
                   fitnessScore >= 40 ? 'Fair fitness level' :
                   'Needs improvement'}
                </Text>
              </View>
            )}

            {/* Health Metrics */}
            {healthData && (
              <View style={styles.metricsSection}>
                <Text style={styles.sectionTitle}>Health Metrics</Text>
                
                {/* Heart Rate */}
                {healthData.heartRate !== null && (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="heart" size={24} color="#ff6b6b" />
                      <Text style={styles.metricLabel}>Heart Rate</Text>
                    </View>
                    <Text style={styles.metricValue}>{healthData.heartRate} bpm</Text>
                  </View>
                )}

                {/* HRV */}
                {healthData.hrv !== null && (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="pulse" size={24} color="#4ecdc4" />
                      <Text style={styles.metricLabel}>HRV (RMSSD)</Text>
                    </View>
                    <Text style={styles.metricValue}>{healthData.hrv} ms</Text>
                  </View>
                )}

                {/* Steps */}
                {healthData.steps > 0 && (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="footsteps" size={24} color="#95e1d3" />
                      <Text style={styles.metricLabel}>Steps</Text>
                    </View>
                    <Text style={styles.metricValue}>{healthData.steps.toLocaleString()}</Text>
                  </View>
                )}

                {/* VO2 Max */}
                {healthData.vo2Max !== null && (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="analytics" size={24} color="#ffa07a" />
                      <Text style={styles.metricLabel}>VO₂ Max</Text>
                    </View>
                    <Text style={styles.metricValue}>{healthData.vo2Max} mL/kg/min</Text>
                  </View>
                )}

                {/* Body Battery */}
                {healthData.bodyBattery !== null && (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="battery-charging" size={24} color="#00d4ff" />
                      <Text style={styles.metricLabel}>Body Battery</Text>
                    </View>
                    <Text style={styles.metricValue}>{healthData.bodyBattery}/100</Text>
                  </View>
                )}

                {/* Stress Level */}
                {healthData.stressLevel !== null && (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="alert-circle" size={24} color="#ff6b9d" />
                      <Text style={styles.metricLabel}>Stress Level</Text>
                    </View>
                    <Text style={styles.metricValue}>
                      {typeof healthData.stressLevel === 'string'
                        ? healthData.stressLevel
                        : `${healthData.stressLevel}/100`}
                    </Text>
                  </View>
                )}

                {/* Respiration Rate */}
                {healthData.respirationRate !== null && (
                  <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Ionicons name="medical" size={24} color="#c7ceea" />
                      <Text style={styles.metricLabel}>Respiration Rate</Text>
                    </View>
                    <Text style={styles.metricValue}>{healthData.respirationRate} brpm</Text>
                  </View>
                )}
              </View>
            )}

            {/* Last Sync Info */}
            {lastSyncTime && (
              <View style={styles.syncInfo}>
                <Ionicons name="sync" size={16} color="#666" />
                <Text style={styles.syncText}>Last synced: {lastSyncTime}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.syncButton} onPress={fetchHealthData}>
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.syncButtonText}>Sync Now</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Ionicons name="unlink" size={20} color="#ff6b6b" />
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Garmin Integration</Text>
          <Text style={styles.infoText}>
            • Syncs health data from your Garmin wearable{'\n'}
            • Includes heart rate, HRV, steps, VO₂ max{'\n'}
            • Provides Body Battery and stress metrics{'\n'}
            • Contributes to your Fitness Score calculation{'\n'}
            • Data is encrypted and stored securely
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectedBadge: {
    backgroundColor: '#4caf50',
  },
  disconnectedBadge: {
    backgroundColor: '#666',
  },
  connectionSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 15,
  },
  developerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00d4ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  developerButtonText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 10,
  },
  toggleCredentialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 15,
  },
  toggleCredentialsText: {
    color: '#00d4ff',
    fontSize: 16,
    marginRight: 8,
  },
  credentialInputs: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  connectButtonDisabled: {
    backgroundColor: '#666',
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  scoreCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 15,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  scoreMax: {
    fontSize: 24,
    color: '#666',
    marginLeft: 5,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
  },
  scoreDescription: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  metricsSection: {
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  syncText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    marginRight: 10,
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disconnectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    marginLeft: 10,
  },
  disconnectButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 24,
  },
});
