import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import OuraRingService from '../services/OuraRingService';
import PraxiomBackground from '../components/PraxiomBackground';

const OuraRingScreen = ({ navigation }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    lastSyncTime: null,
    hasData: false,
    dataPoints: 0,
  });
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeOura();
  }, []);

  const initializeOura = async () => {
    setIsLoading(true);
    try {
      await OuraRingService.initialize();
      updateStatus();
    } catch (error) {
      console.error('Oura initialization error:', error);
    }
    setIsLoading(false);
  };

  const updateStatus = () => {
    const status = OuraRingService.getConnectionStatus();
    setConnectionStatus(status);
    
    if (status.isConnected) {
      const metrics = OuraRingService.getLatestMetrics();
      setLatestMetrics(metrics);
    }
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // Use your app's redirect URI
      const redirectUri = 'exp://127.0.0.1:19000'; // For development
      // For production: 'yourapp://oauth-redirect'
      
      const result = await OuraRingService.authenticate(redirectUri);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        updateStatus();
        
        // Auto-sync after connection
        handleSync();
      } else {
        Alert.alert('Connection Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to Oura Ring: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      const result = await OuraRingService.syncDailyData();
      
      if (result.success) {
        updateStatus();
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.data.dailyData.length} days of data`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Sync Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', 'Sync failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Oura Ring',
      'Are you sure you want to disconnect your Oura Ring? Your synced data will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const success = await OuraRingService.disconnect();
            if (success) {
              updateStatus();
              Alert.alert('Disconnected', 'Oura Ring has been disconnected');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleSync();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <PraxiomBackground style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00CFC1" />
          <Text style={styles.loadingText}>Loading Oura Ring...</Text>
        </View>
      </PraxiomBackground>
    );
  }

  return (
    <PraxiomBackground style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00CFC1"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Oura Ring</Text>
        </View>

        {/* Connection Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name={connectionStatus.isConnected ? 'checkmark-circle' : 'warning'}
              size={32}
              color={connectionStatus.isConnected ? '#47C83E' : '#fbbf24'}
            />
            <Text style={styles.cardTitle}>
              {connectionStatus.isConnected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>

          {connectionStatus.isConnected ? (
            <View style={styles.statusInfo}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Sync:</Text>
                <Text style={styles.statusValue}>
                  {formatDate(connectionStatus.lastSyncTime)}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Data Points:</Text>
                <Text style={styles.statusValue}>
                  {connectionStatus.dataPoints} days
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.disconnectedText}>
              Connect your Oura Ring to automatically sync sleep, activity, and recovery data.
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {!connectionStatus.isConnected ? (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnect}
              >
                <LinearGradient
                  colors={['#00CFC1', '#00a896']}
                  style={styles.gradientButton}
                >
                  <Ionicons name="link" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Connect Oura Ring</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, isSyncing && styles.buttonDisabled]}
                  onPress={handleSync}
                  disabled={isSyncing}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={styles.gradientButton}
                  >
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="refresh" size={20} color="#fff" />
                    )}
                    <Text style={styles.buttonText}>
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDisconnect}
                >
                  <View style={styles.disconnectButton}>
                    <Ionicons name="unlink" size={20} color="#ef4444" />
                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Latest Metrics */}
        {latestMetrics && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Latest Metrics</Text>
            
            <View style={styles.metricsGrid}>
              <MetricCard
                icon="heart"
                label="Resting HR"
                value={latestMetrics.heartRate}
                unit="bpm"
                color="#ef4444"
              />
              <MetricCard
                icon="pulse"
                label="HRV"
                value={latestMetrics.hrv}
                unit="ms"
                color="#3b82f6"
              />
              <MetricCard
                icon="walk"
                label="Steps"
                value={latestMetrics.steps}
                unit=""
                color="#47C83E"
              />
              <MetricCard
                icon="moon"
                label="Sleep Efficiency"
                value={latestMetrics.sleepEfficiency}
                unit="%"
                color="#8b5cf6"
              />
              <MetricCard
                icon="fitness"
                label="Readiness"
                value={latestMetrics.readinessScore}
                unit="/100"
                color="#f59e0b"
              />
              <MetricCard
                icon="time"
                label="Last Sync"
                value={latestMetrics.syncTime ? 'Today' : 'N/A'}
                unit=""
                color="#6b7280"
              />
            </View>

            <Text style={styles.sourceText}>
              Data source: {latestMetrics.source}
            </Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What Gets Synced</Text>
          
          <FeatureItem
            icon="moon"
            title="Sleep Data"
            description="Total sleep, deep sleep, REM, light sleep, efficiency"
          />
          <FeatureItem
            icon="walk"
            title="Activity Data"
            description="Steps, calories, activity score, MET minutes"
          />
          <FeatureItem
            icon="fitness"
            title="Readiness Score"
            description="Recovery index, temperature deviation, overall readiness"
          />
          <FeatureItem
            icon="pulse"
            title="Heart Metrics"
            description="Resting heart rate, HRV, heart rate variability trends"
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <Text style={styles.infoText}>
            Data syncs automatically every hour when connected. Pull down to refresh manually.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </PraxiomBackground>
  );
};

// Metric Card Component
const MetricCard = ({ icon, label, value, unit, color }) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>
      {value !== null && value !== undefined ? value : '--'}
      <Text style={styles.metricUnit}> {unit}</Text>
    </Text>
  </View>
);

// Feature Item Component
const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={24} color="#00CFC1" />
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 10,
  },
  statusInfo: {
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  disconnectedText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 10,
  },
  connectButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
  },
  disconnectButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#6b7280',
  },
  sourceText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  featureText: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
});

export default OuraRingScreen;
