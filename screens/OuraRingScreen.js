import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';
import OuraRingService from '../services/OuraRingService';
import PraxiomBackground from '../components/PraxiomBackground';
import * as SecureStorage from '../services/SecureStorageService';

export default function OuraRingScreen({ navigation }) {
  const { state, updateState } = useContext(AppContext);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Credentials management
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    checkCredentialsAndConnection();
  }, []);

  const checkCredentialsAndConnection = async () => {
    try {
      // Check if credentials are saved
      const savedClientId = await SecureStorage.getItem('oura_client_id');
      const savedClientSecret = await SecureStorage.getItem('oura_client_secret');
      
      if (savedClientId && savedClientSecret) {
        setHasCredentials(true);
        setClientId(savedClientId);
        setClientSecret(savedClientSecret);
        
        // Initialize service with saved credentials
        await OuraRingService.init(savedClientId, savedClientSecret);
        
        // Check connection status
        const authenticated = OuraRingService.isAuthenticated();
        setIsConnected(authenticated);
        
        if (authenticated) {
          await fetchHealthData();
        }
      } else {
        // No credentials - show modal
        setShowCredentialsModal(true);
      }
    } catch (error) {
      console.error('Error checking Oura credentials:', error);
    }
  };

  const saveCredentials = async () => {
    if (!clientId || !clientSecret) {
      Alert.alert('Error', 'Please enter both Client ID and Client Secret');
      return;
    }

    try {
      // Save credentials securely
      await SecureStorage.setItem('oura_client_id', clientId.trim());
      await SecureStorage.setItem('oura_client_secret', clientSecret.trim());
      
      // Initialize service with new credentials
      await OuraRingService.init(clientId.trim(), clientSecret.trim());
      
      setHasCredentials(true);
      setShowCredentialsModal(false);
      
      Alert.alert(
        'Credentials Saved',
        'Your Oura API credentials have been saved securely. You can now connect to your Oura Ring.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials: ' + error.message);
    }
  };

  const handleConnect = async () => {
    if (!hasCredentials) {
      Alert.alert(
        'Credentials Required',
        'Please enter your Oura API credentials first',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter Credentials', onPress: () => setShowCredentialsModal(true) }
        ]
      );
      return;
    }

    try {
      setIsConnecting(true);
      
      const result = await OuraRingService.authenticate();
      
      if (result.success) {
        setIsConnected(true);
        Alert.alert('Success', result.message);
        await fetchHealthData();
        
        // Update app context
        updateState({
          ouraConnected: true
        });
      } else {
        Alert.alert('Connection Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to Oura: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Oura Ring',
      'Are you sure you want to disconnect your Oura Ring? This will stop automatic HRV sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await OuraRingService.disconnect();
              setIsConnected(false);
              setHealthData(null);
              
              updateState({
                ouraConnected: false,
                ouraData: null
              });
              
              Alert.alert('Success', 'Disconnected from Oura Ring');
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const clearCredentials = () => {
    Alert.alert(
      'Clear Credentials',
      'This will remove your saved Oura API credentials. You will need to re-enter them to connect.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStorage.removeItem('oura_client_id');
              await SecureStorage.removeItem('oura_client_secret');
              await OuraRingService.disconnect();
              
              setClientId('');
              setClientSecret('');
              setHasCredentials(false);
              setIsConnected(false);
              setHealthData(null);
              
              Alert.alert('Success', 'Credentials cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear credentials: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const fetchHealthData = async () => {
    try {
      setIsSyncing(true);
      const data = await OuraRingService.getLatestHealthData();
      setHealthData(data);
      
      // Update app context with latest data
      if (data) {
        updateState({
          ouraHeartRate: data.heartRate,
          ouraHRV: data.hrv,
          ouraSteps: data.steps,
          ouraSleepEfficiency: data.sleepEfficiency,
          ouraReadinessScore: data.readinessScore,
          lastOuraSync: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      Alert.alert('Sync Error', 'Failed to fetch latest health data');
    } finally {
      setIsSyncing(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      await fetchHealthData();
    } else {
      setRefreshing(false);
    }
  };

  return (
    <PraxiomBackground>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#47C83E"
          />
        }
      >
        <View style={styles.header}>
          <Ionicons name="fitness" size={48} color="#47C83E" />
          <Text style={styles.title}>Oura Ring</Text>
          <Text style={styles.subtitle}>Enhanced HRV & Sleep Tracking</Text>
        </View>

        {/* Credentials Modal */}
        <Modal
          visible={showCredentialsModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Oura API Credentials</Text>
                <TouchableOpacity onPress={() => setShowCredentialsModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                To connect your Oura Ring, you need to create an app in the Oura Developer Portal and enter your credentials below.
              </Text>

              <Text style={styles.inputLabel}>Client ID</Text>
              <TextInput
                style={styles.input}
                value={clientId}
                onChangeText={setClientId}
                placeholder="18a798fd-289f-45d4-99b6-ade377b3ba15"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Client Secret</Text>
              <TextInput
                style={styles.input}
                value={clientSecret}
                onChangeText={setClientSecret}
                placeholder="07SgBRP_w7zSdetMcidQNtv3gKsUmKQokpq0_0HUw"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={true}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveCredentials}
              >
                <Text style={styles.saveButtonText}>Save Credentials</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => {
                  Alert.alert(
                    'How to Get Credentials',
                    '1. Go to cloud.ouraring.com\n' +
                    '2. Log in with your Oura account\n' +
                    '3. Go to "Personal Access Tokens"\n' +
                    '4. Click "Create New Personal Access Token"\n' +
                    '5. Create an OAuth Application\n' +
                    '6. Copy your Client ID and Client Secret\n\n' +
                    'Redirect URI: praxiomhealth://oura-callback'
                  );
                }}
              >
                <Text style={styles.helpButtonText}>How to get credentials?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isConnected ? '#47C83E' : '#E74C3C' }
              ]} />
              <Text style={styles.statusText}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
            {hasCredentials && (
              <TouchableOpacity onPress={() => setShowCredentialsModal(true)}>
                <Ionicons name="settings-outline" size={24} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {!isConnected ? (
            <TouchableOpacity
              style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="link" size={20} color="#FFF" />
                  <Text style={styles.connectButtonText}>
                    {hasCredentials ? 'Connect to Oura Ring' : 'Enter Credentials First'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.connectedActions}>
              <TouchableOpacity
                style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
                onPress={fetchHealthData}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator color="#47C83E" />
                ) : (
                  <>
                    <Ionicons name="sync" size={20} color="#47C83E" />
                    <Text style={styles.syncButtonText}>Sync Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnect}
              >
                <Ionicons name="close-circle" size={20} color="#E74C3C" />
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Credentials Management */}
        {hasCredentials && (
          <View style={styles.credentialsCard}>
            <Text style={styles.credentialsTitle}>API Credentials</Text>
            <Text style={styles.credentialsText}>
              ✅ Client ID: {clientId.substring(0, 8)}...
            </Text>
            <Text style={styles.credentialsText}>
              ✅ Client Secret: ***********
            </Text>
            <TouchableOpacity
              style={styles.clearCredentialsButton}
              onPress={clearCredentials}
            >
              <Text style={styles.clearCredentialsText}>Clear Credentials</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Health Data Display */}
        {isConnected && healthData && (
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Latest Health Metrics</Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Ionicons name="heart" size={32} color="#E74C3C" />
                <Text style={styles.metricValue}>
                  {healthData.heartRate || '--'} bpm
                </Text>
                <Text style={styles.metricLabel}>Heart Rate</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="pulse" size={32} color="#47C83E" />
                <Text style={styles.metricValue}>
                  {healthData.hrv || '--'}
                </Text>
                <Text style={styles.metricLabel}>HRV</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="walk" size={32} color="#3498DB" />
                <Text style={styles.metricValue}>
                  {healthData.steps || 0}
                </Text>
                <Text style={styles.metricLabel}>Steps</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="moon" size={32} color="#9B59B6" />
                <Text style={styles.metricValue}>
                  {healthData.sleepEfficiency || '--'}%
                </Text>
                <Text style={styles.metricLabel}>Sleep</Text>
              </View>

              <View style={styles.metricCard}>
                <Ionicons name="analytics" size={32} color="#F39C12" />
                <Text style={styles.metricValue}>
                  {healthData.readinessScore || '--'}
                </Text>
                <Text style={styles.metricLabel}>Readiness</Text>
              </View>
            </View>

            {healthData.lastSync && (
              <Text style={styles.lastSyncText}>
                Last synced: {new Date(healthData.lastSync).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Integration Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Oura Integration Benefits</Text>
          <Text style={styles.infoText}>
            • Continuous HRV monitoring{'\n'}
            • Enhanced sleep quality tracking{'\n'}
            • Readiness score integration{'\n'}
            • Automatic Bio-Age updates{'\n'}
            • Recovery optimization insights
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </PraxiomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCC',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  connectButton: {
    backgroundColor: '#47C83E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  syncButton: {
    flex: 1,
    backgroundColor: 'rgba(71, 200, 62, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#47C83E',
    gap: 10,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#47C83E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E74C3C',
    gap: 10,
  },
  disconnectButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  credentialsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  credentialsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  credentialsText: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 5,
  },
  clearCredentialsButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  clearCredentialsText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
  },
  dataSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 5,
  },
  lastSyncText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 15,
  },
  infoSection: {
    backgroundColor: 'rgba(71, 200, 62, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#47C83E',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#47C83E',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2C2C2C',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalDescription: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#444',
  },
  saveButton: {
    backgroundColor: '#47C83E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpButton: {
    padding: 15,
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#47C83E',
    fontSize: 14,
  },
});
