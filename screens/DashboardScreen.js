import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableService from '../services/WearableService';

export default function DashboardScreen({ navigation }) {
  const [praxiomAge, setPraxiomAge] = useState('--');
  const [chronologicalAge, setChronologicalAge] = useState('-- years');
  const [oralHealth, setOralHealth] = useState('0%');
  const [systemicHealth, setSystemicHealth] = useState('0%');
  const [fitnessScore, setFitnessScore] = useState('0%');
  const [watchConnected, setWatchConnected] = useState(false);
  const [watchName, setWatchName] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Live watch data
  const [liveSteps, setLiveSteps] = useState('--');
  const [liveHR, setLiveHR] = useState('--');
  const [liveO2, setLiveO2] = useState('--');
  
  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Load data and setup BLE callbacks
  useEffect(() => {
    loadStoredData();
    setupBLECallbacks();
    
    // Check if already connected
    if (WearableService.isConnected()) {
      setWatchConnected(true);
      setWatchName(WearableService.getDeviceName());
    }
    
    return () => {
      // Cleanup
      WearableService.onConnectionChange = null;
      WearableService.onLiveDataUpdate = null;
    };
  }, []);

  const setupBLECallbacks = () => {
    // Connection status callback
    WearableService.onConnectionChange = (connected) => {
      setWatchConnected(connected);
      if (connected) {
        setWatchName(WearableService.getDeviceName());
      } else {
        setWatchName('');
        setLiveHR('--');
        setLiveSteps('--');
        setLiveO2('--');
      }
    };
    
    // Live data callback
    WearableService.onLiveDataUpdate = (data) => {
      if (data.heartRate) {
        setLiveHR(data.heartRate.toString());
      }
      if (data.steps) {
        setLiveSteps(data.steps.toString());
      }
      if (data.oxygen) {
        setLiveO2(data.oxygen.toString() + '%');
      }
    };
  };

  const loadStoredData = async () => {
    try {
      const storedAge = await AsyncStorage.getItem('praxiomAge');
      const storedDOB = await AsyncStorage.getItem('dateOfBirth');
      const storedOral = await AsyncStorage.getItem('oralHealthScore');
      const storedSystemic = await AsyncStorage.getItem('systemicHealthScore');
      const storedFitness = await AsyncStorage.getItem('fitnessScore');
      const updated = await AsyncStorage.getItem('lastUpdated');

      if (storedAge) setPraxiomAge(storedAge);
      if (storedOral) setOralHealth(storedOral + '%');
      if (storedSystemic) setSystemicHealth(storedSystemic + '%');
      if (storedFitness) setFitnessScore(storedFitness);
      if (updated) setLastUpdated(updated);

      // Calculate chronological age from DOB
      if (storedDOB) {
        const dob = new Date(storedDOB);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        setChronologicalAge(age + ' years');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handlePushToWatch = async () => {
    if (!watchConnected) {
      Alert.alert(
        'Watch Not Connected',
        'Please connect your watch from the Watch tab first',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Watch', onPress: () => navigation.navigate('Watch') }
        ]
      );
      return;
    }

    if (praxiomAge === '--') {
      Alert.alert(
        'No Bio-Age Data',
        'Please calculate your Bio-Age first by entering biomarkers'
      );
      return;
    }

    setSyncing(true);
    
    try {
      // Send Bio-Age to watch
      const success = await WearableService.sendBioAgeToWatch(praxiomAge);
      
      if (success) {
        // Show confirmation modal
        setShowConfirmModal(true);
        setTimeout(() => {
          setShowConfirmModal(false);
        }, 3000);
      } else {
        Alert.alert('Sync Failed', 'Could not verify Bio-Age on watch. Please try again.');
      }
    } catch (error) {
      console.error('Push to watch error:', error);
      Alert.alert('Sync Failed', 'An error occurred while syncing to watch');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with connection status */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Praxiom Health</Text>
          {watchConnected && (
            <View style={styles.connectionBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.connectionText}>Live</Text>
            </View>
          )}
        </View>

        {/* Praxiom Age Card - Top Priority */}
        <View style={styles.praxiomAgeCard}>
          <Text style={styles.cardTitle}>Praxiom Age</Text>
          <View style={styles.ageDisplay}>
            <Text style={styles.ageNumber}>{praxiomAge}</Text>
          </View>
          <Text style={styles.chronologicalAge}>Chronological: {chronologicalAge}</Text>
          
          {watchConnected && (
            <Text style={styles.syncHint}>
              {watchName ? `Connected to ${watchName}` : 'Watch Connected ✓'}
            </Text>
          )}
        </View>

        {/* Oral Health and Systemic Health - Side by Side */}
        <View style={styles.row}>
          <View style={styles.healthCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🦷</Text>
            </View>
            <Text style={styles.healthLabel}>Oral Health</Text>
            <Text style={styles.scoreNumber}>{oralHealth}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>

          <View style={styles.healthCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>❤️</Text>
            </View>
            <Text style={styles.healthLabel}>Systemic Health</Text>
            <Text style={styles.scoreNumber}>{systemicHealth}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>
        </View>

        {/* Fitness Score and Live Watch - Side by Side */}
        <View style={styles.row}>
          <View style={styles.healthCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💪</Text>
            </View>
            <Text style={styles.healthLabel}>Fitness Score</Text>
            <Text style={styles.scoreNumber}>{fitnessScore}</Text>
            <Text style={styles.scoreLabel}>level</Text>
          </View>

          <View style={[styles.liveWatchCard, !watchConnected && styles.liveWatchDisconnected]}>
            <Text style={styles.healthLabel}>Live Watch</Text>
            <View style={styles.liveDataRow}>
              <Text style={styles.liveLabel}>Steps</Text>
              <Text style={[styles.liveValue, !watchConnected && styles.liveValueDisabled]}>
                {liveSteps}
              </Text>
            </View>
            <View style={styles.liveDataRow}>
              <Text style={styles.liveLabel}>HR</Text>
              <Text style={[styles.liveValue, !watchConnected && styles.liveValueDisabled]}>
                {liveHR}
              </Text>
            </View>
            <View style={styles.liveDataRow}>
              <Text style={styles.liveLabel}>O₂</Text>
              <Text style={[styles.liveValue, !watchConnected && styles.liveValueDisabled]}>
                {liveO2}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.dnaButton}
          onPress={() => navigation.navigate('DNATest')}
        >
          <Text style={styles.buttonIcon}>🧬</Text>
          <Text style={styles.buttonText}>DNA Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.biomarkerButton}
          onPress={() => navigation.navigate('BiomarkerInput')}
        >
          <Text style={styles.buttonIcon}>📝</Text>
          <Text style={styles.buttonText}>Input Biomarkers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={() => navigation.navigate('BiomarkerInput')}
        >
          <Text style={styles.buttonIcon}>📊</Text>
          <Text style={styles.buttonText}>Calculate Tier 1 Biomarkers</Text>
        </TouchableOpacity>

        {/* Push to Watch Button */}
        <TouchableOpacity
          style={[styles.pushButton, syncing && styles.pushButtonDisabled]}
          onPress={handlePushToWatch}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 12 }} />
              <Text style={styles.pushButtonText}>Syncing...</Text>
            </>
          ) : (
            <>
              <Text style={styles.pushButtonIcon}>🔄</Text>
              <Text style={styles.pushButtonText}>Push to Watch</Text>
            </>
          )}
        </TouchableOpacity>

        {lastUpdated ? (
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
        ) : null}
      </ScrollView>

      {/* Sync Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>✅</Text>
            <Text style={styles.modalTitle}>Bio-Age Synced!</Text>
            <Text style={styles.modalMessage}>
              Your Praxiom Age ({praxiomAge}) has been successfully sent to your watch.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowConfirmModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E3D8', // Darker cream/beige background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00CFC1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  connectionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Praxiom Age Card
  praxiomAgeCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF8C42',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 16,
  },
  ageDisplay: {
    alignItems: 'center',
    marginVertical: 12,
  },
  ageNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  chronologicalAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  syncHint: {
    fontSize: 12,
    color: '#00CFC1',
    marginTop: 12,
    fontWeight: '600',
  },

  // Health Cards Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  healthCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C42',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#888',
  },

  // Live Watch Card
  liveWatchCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    borderWidth: 2,
    borderColor: '#00CFC1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  liveWatchDisconnected: {
    borderColor: '#CCC',
    opacity: 0.6,
  },
  liveDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  liveLabel: {
    fontSize: 13,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  liveValue: {
    fontSize: 14,
    color: '#00CFC1',
    fontWeight: 'bold',
  },
  liveValueDisabled: {
    color: '#999',
  },

  // Action Buttons
  dnaButton: {
    backgroundColor: '#FF8C42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  biomarkerButton: {
    backgroundColor: '#A855F7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  pushButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  pushButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pushButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pushButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#00CFC1',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
