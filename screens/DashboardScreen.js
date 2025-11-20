import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../AppContext';

const DashboardScreen = ({ navigation }) => {
  const {
    dateOfBirth,
    chronologicalAge,
    bioAge,
    lastCalculated,
    tier1Results,
    tier2Results,
    tier3Results,
    watchConnected,
    autoSync,
    syncBioAgeToWatch,
    getWatchInfo
  } = useContext(AppContext);

  const [syncing, setSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState(null);

  /**
   * Check sync status on mount and when bio-age changes
   */
  useEffect(() => {
    checkSyncStatus();
  }, [bioAge, watchConnected, autoSync]);

  /**
   * Check if data is synced
   */
  const checkSyncStatus = () => {
    if (!bioAge) {
      setLastSyncStatus(null);
      return;
    }

    if (!watchConnected) {
      setLastSyncStatus('not_connected');
      return;
    }

    if (autoSync) {
      setLastSyncStatus('auto_synced');
    } else {
      setLastSyncStatus('manual_sync_available');
    }
  };

  /**
   * Calculate bio-age deviation
   */
  const calculateDeviation = () => {
    if (!bioAge || !chronologicalAge) return null;
    return (bioAge - chronologicalAge).toFixed(1);
  };

  /**
   * Get deviation color
   */
  const getDeviationColor = () => {
    const deviation = calculateDeviation();
    if (!deviation) return '#666';
    
    if (deviation < -5) return '#4CAF50'; // Excellent
    if (deviation < 0) return '#8BC34A'; // Good
    if (deviation < 5) return '#FFC107'; // Fair
    return '#F44336'; // Needs improvement
  };

  /**
   * Get current tier level
   */
  const getCurrentTier = () => {
    if (tier3Results) return 3;
    if (tier2Results) return 2;
    if (tier1Results) return 1;
    return 0;
  };

  /**
   * Format date
   */
  const formatDate = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Handle manual sync to watch
   */
  const handleManualSync = async () => {
    if (!watchConnected) {
      Alert.alert(
        'Watch Not Connected',
        'Please connect your PineTime watch in Settings first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }
        ]
      );
      return;
    }

    if (!bioAge) {
      Alert.alert('No Data', 'Please complete a bio-age assessment first.');
      return;
    }

    setSyncing(true);
    try {
      await syncBioAgeToWatch();
      setLastSyncStatus('manually_synced');
      Alert.alert('Success', 'Bio-age synced to watch successfully!');
    } catch (error) {
      Alert.alert('Sync Failed', error.message);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Render sync status indicator
   */
  const renderSyncStatus = () => {
    if (!bioAge) return null;

    let statusText = '';
    let statusColor = '#666';
    let showSyncButton = false;

    switch (lastSyncStatus) {
      case 'not_connected':
        statusText = '⚠️ Watch not connected';
        statusColor = '#FFC107';
        showSyncButton = false;
        break;
      case 'auto_synced':
        statusText = '✓ Auto-synced to watch';
        statusColor = '#4CAF50';
        showSyncButton = false;
        break;
      case 'manual_sync_available':
        statusText = '↻ Manual sync available';
        statusColor = '#2196F3';
        showSyncButton = true;
        break;
      case 'manually_synced':
        statusText = '✓ Manually synced';
        statusColor = '#4CAF50';
        showSyncButton = true;
        break;
      default:
        statusText = '— Sync status unknown';
        statusColor = '#999';
        showSyncButton = true;
    }

    return (
      <View style={styles.syncStatusContainer}>
        <Text style={[styles.syncStatusText, { color: statusColor }]}>
          {statusText}
        </Text>
        {showSyncButton && watchConnected && (
          <TouchableOpacity
            style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
            onPress={handleManualSync}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.syncButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * Handle setting date of birth
   */
  const handleSetDOB = () => {
    navigation.navigate('Profile');
  };

  /**
   * Navigate to assessment
   */
  const handleStartAssessment = () => {
    if (!dateOfBirth) {
      Alert.alert(
        'Date of Birth Required',
        'Please set your date of birth first to calculate your biological age.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set DOB', onPress: handleSetDOB }
        ]
      );
      return;
    }

    const currentTier = getCurrentTier();
    if (currentTier === 0) {
      navigation.navigate('Tier1BiomarkerInput');
    } else {
      Alert.alert(
        'Choose Assessment',
        'Which tier would you like to assess?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Tier 1 (Foundation)', onPress: () => navigation.navigate('Tier1BiomarkerInput') },
          { text: 'Tier 2 (Personalized)', onPress: () => navigation.navigate('Tier2BiomarkerInput') },
          { text: 'Tier 3 (Optimization)', onPress: () => navigation.navigate('Tier3BiomarkerInput') }
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#20B2AA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Vitality Dashboard</Text>
        {dateOfBirth && (
          <Text style={styles.headerSubtitle}>
            Age {chronologicalAge} years
          </Text>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* Bio-Age Card */}
        {bioAge ? (
          <View style={styles.bioAgeCard}>
            <Text style={styles.cardLabel}>Biological Age</Text>
            <Text style={styles.bioAgeValue}>{bioAge.toFixed(1)} years</Text>
            
            {chronologicalAge && (
              <>
                <View style={styles.deviationContainer}>
                  <Text style={styles.deviationLabel}>Deviation: </Text>
                  <Text style={[styles.deviationValue, { color: getDeviationColor() }]}>
                    {calculateDeviation() > 0 ? '+' : ''}{calculateDeviation()} years
                  </Text>
                </View>
                
                <Text style={styles.lastCalculated}>
                  Calculated: {formatDate(lastCalculated)}
                </Text>
              </>
            )}

            {/* Sync Status */}
            {renderSyncStatus()}

            {/* Tier Badge */}
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>
                Tier {getCurrentTier()} Assessment
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Bio-Age Data Yet</Text>
            <Text style={styles.emptyText}>
              Complete your first assessment to see your biological age
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleStartAssessment}
            >
              <Text style={styles.primaryButtonText}>Start Assessment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleStartAssessment}
          >
            <Text style={styles.actionTitle}>📊 New Assessment</Text>
            <Text style={styles.actionDescription}>
              Calculate your current biological age
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.actionTitle}>📈 View History</Text>
            <Text style={styles.actionDescription}>
              Track your bio-age progress over time
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Report')}
          >
            <Text style={styles.actionTitle}>📄 Generate Report</Text>
            <Text style={styles.actionDescription}>
              Get detailed insights and recommendations
            </Text>
          </TouchableOpacity>

          {bioAge && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ProtocolInfo')}
            >
              <Text style={styles.actionTitle}>📚 Protocol Guide</Text>
              <Text style={styles.actionDescription}>
                Learn about the Praxiom Bio-Age Protocol
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Watch Status */}
        {watchConnected && (
          <View style={styles.watchStatusCard}>
            <Text style={styles.watchStatusTitle}>⌚ PineTime Connected</Text>
            <Text style={styles.watchStatusText}>
              Auto-Sync: {autoSync ? 'Enabled' : 'Disabled'}
            </Text>
            <TouchableOpacity
              style={styles.settingsLink}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsLinkText}>Manage Watch Settings →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 30,
    paddingTop: 50,
    paddingBottom: 30
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9
  },
  content: {
    padding: 20,
    marginTop: -20
  },
  bioAgeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  bioAgeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 12
  },
  deviationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  deviationLabel: {
    fontSize: 16,
    color: '#666'
  },
  deviationValue: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  lastCalculated: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16
  },
  syncStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12
  },
  syncStatusText: {
    fontSize: 14,
    fontWeight: '600'
  },
  syncButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6
  },
  syncButtonDisabled: {
    opacity: 0.6
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600'
  },
  tierBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  tierBadgeText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '600'
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  actionsContainer: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  actionDescription: {
    fontSize: 13,
    color: '#666'
  },
  watchStatusCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  watchStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8
  },
  watchStatusText: {
    fontSize: 14,
    color: '#4caf50',
    marginBottom: 12
  },
  settingsLink: {
    alignSelf: 'flex-start'
  },
  settingsLinkText: {
    color: '#1b5e20',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default DashboardScreen;
