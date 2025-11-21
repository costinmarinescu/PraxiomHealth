import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';
import OuraRingService from '../services/OuraRingService';

export default function OuraRingScreen({ navigation }) {
  const { state, updateState } = useContext(AppContext);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const initialized = await OuraRingService.init();
      const authenticated = OuraRingService.isAuthenticated();
      
      setIsConnected(authenticated);
      
      if (authenticated) {
        await fetchHealthData();
      }
    } catch (error) {
      console.error('Error checking Oura connection:', error);
    }
  };

  const handleConnect = async () => {
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

  const fetchHealthData = async () => {
    try {
      setIsSyncing(true);
      
      const summary = await OuraRingService.getHealthSummary();
      
      if (summary) {
        setHealthData(summary);
        
        // Update app context with HRV for bio-age calculation
        if (summary.hrv && summary.hrv.hrv) {
          updateState({
            ouraData: summary,
            wearableData: {
              ...state.wearableData,
              hrv: summary.hrv.hrv,
              source: 'Oura Ring'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      Alert.alert('Sync Error', 'Failed to sync data from Oura Ring');
    } finally {
      setIsSyncing(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#00CFC1';
    if (score >= 70) return '#FFC107';
    return '#F44336';
  };

  if (!isConnected) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.centerContent}>
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <Ionicons name="fitness" size={100} color="#00CFC1" />
          
          <Text style={styles.title}>Connect Oura Ring</Text>
          <Text style={styles.subtitle}>
            Automatically import your HRV, sleep, and activity data for more accurate Bio-Age calculations
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={24} color="#00CFC1" />
              <Text style={styles.featureText}>Auto-sync HRV for bio-age</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="moon" size={24} color="#00CFC1" />
              <Text style={styles.featureText}>Track sleep quality</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={24} color="#00CFC1" />
              <Text style={styles.featureText}>Monitor readiness scores</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={24} color="#00CFC1" />
              <Text style={styles.featureText}>View activity metrics</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="link" size={24} color="#FFF" />
                <Text style={styles.connectButtonText}>Connect Oura Ring</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.privacyText}>
            🔒 Your data is secure and only used for Bio-Age calculations
          </Text>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00CFC1"
          />
        }
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.connectedHeader}>
          <Ionicons name="fitness" size={40} color="#00CFC1" />
          <View style={styles.connectedInfo}>
            <Text style={styles.connectedTitle}>Oura Ring Connected</Text>
            <Text style={styles.connectedSubtitle}>Last synced: {healthData?.lastUpdated ? new Date(healthData.lastUpdated).toLocaleTimeString() : 'Never'}</Text>
          </View>
        </View>

        {/* HRV Card */}
        {healthData?.hrv && (
          <View style={styles.dataCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={24} color="#00CFC1" />
              <Text style={styles.cardTitle}>Heart Rate Variability</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.bigValue}>{healthData.hrv.hrv} ms</Text>
              <Text style={styles.cardSubtext}>RMSSD - {formatDate(healthData.hrv.date)}</Text>
              <Text style={styles.cardInfo}>
                ✅ This value will be used automatically in your next Praxiom Age calculation
              </Text>
            </View>
          </View>
        )}

        {/* Sleep Card */}
        {healthData?.sleep && (
          <View style={styles.dataCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="moon" size={24} color="#00CFC1" />
              <Text style={styles.cardTitle}>Sleep Quality</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Duration</Text>
                  <Text style={styles.metricValue}>
                    {Math.round((healthData.sleep.total_sleep_duration || 0) / 3600)}h
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Efficiency</Text>
                  <Text style={styles.metricValue}>
                    {healthData.sleep.sleep_efficiency || 0}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Deep Sleep</Text>
                  <Text style={styles.metricValue}>
                    {Math.round((healthData.sleep.deep_sleep_duration || 0) / 60)}min
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Readiness Card */}
        {healthData?.readiness && (
          <View style={styles.dataCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="fitness-outline" size={24} color="#00CFC1" />
              <Text style={styles.cardTitle}>Readiness Score</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[
                styles.bigValue,
                { color: getScoreColor(healthData.readiness.score || 0) }
              ]}>
                {healthData.readiness.score || 0}/100
              </Text>
              <Text style={styles.cardSubtext}>
                {healthData.readiness.score >= 85 ? 'Optimal Recovery' :
                 healthData.readiness.score >= 70 ? 'Moderate Recovery' :
                 'Poor Recovery'}
              </Text>
            </View>
          </View>
        )}

        {/* Activity Card */}
        {healthData?.activity && (
          <View style={styles.dataCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="walk" size={24} color="#00CFC1" />
              <Text style={styles.cardTitle}>Activity</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Steps</Text>
                  <Text style={styles.metricValue}>
                    {(healthData.activity.steps || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Calories</Text>
                  <Text style={styles.metricValue}>
                    {healthData.activity.active_calories || 0}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Score</Text>
                  <Text style={styles.metricValue}>
                    {healthData.activity.score || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          style={styles.syncButton}
          onPress={handleRefresh}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="sync" size={20} color="#FFF" />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnect}
        >
          <Ionicons name="unlink" size={20} color="#F44336" />
          <Text style={styles.disconnectButtonText}>Disconnect Oura Ring</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  headerContainer: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#FFF',
    marginLeft: 15,
  },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: '#00CFC1',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 207, 193, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
  },
  connectedInfo: {
    marginLeft: 15,
    flex: 1,
  },
  connectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  connectedSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  dataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  cardContent: {
    alignItems: 'center',
  },
  bigValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  cardSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  cardInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#00CFC1',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  disconnectButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: 10,
  },
});
