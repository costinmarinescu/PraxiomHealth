// screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import WearableService from '../services/WearableService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [bioAge, setBioAge] = useState(35.2);
  const [oralHealthScore, setOralHealthScore] = useState(82);
  const [systemicHealthScore, setSystemicHealthScore] = useState(78);
  const [fitnessScore, setFitnessScore] = useState(85);
  
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [watchConnected, setWatchConnected] = useState(false);

  useEffect(() => {
    loadSavedData();
    checkWatchConnection();
    
    // Subscribe to real-time data from watch
    const unsubscribe = WearableService.onDataReceived((data) => {
      console.log('Received from watch:', data);
      // Handle incoming watch data
    });

    return () => unsubscribe();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedAge = await AsyncStorage.getItem('currentBioAge');
      const savedOral = await AsyncStorage.getItem('oralHealthScore');
      const savedSystemic = await AsyncStorage.getItem('systemicHealthScore');
      const savedFitness = await AsyncStorage.getItem('fitnessScore');

      if (savedAge) setBioAge(parseFloat(savedAge));
      if (savedOral) setOralHealthScore(parseFloat(savedOral));
      if (savedSystemic) setSystemicHealthScore(parseFloat(savedSystemic));
      if (savedFitness) setFitnessScore(parseFloat(savedFitness));
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const checkWatchConnection = () => {
    const status = WearableService.getConnectionStatus();
    setWatchConnected(status.connected && status.provider === 'pinetime');
  };

  const handleSyncToWatch = async () => {
    // Check if watch is connected
    if (!watchConnected) {
      Alert.alert(
        'Watch Not Connected',
        'Please connect your Praxiom watch first from the Watch tab.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Watch', onPress: () => navigation.navigate('Watch') }
        ]
      );
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await WearableService.sendPraxiomAgeToPineTime(
        bioAge,
        oralHealthScore / 100, // Convert to 0-1 range
        systemicHealthScore / 100,
        fitnessScore / 100
      );

      setSyncing(false);
      setSyncResult(result);
      setShowConfirmModal(true);

      // Auto-hide modal after 3 seconds if successful
      if (result.success && result.confirmed) {
        setTimeout(() => {
          setShowConfirmModal(false);
        }, 3000);
      }
    } catch (error) {
      setSyncing(false);
      Alert.alert('Sync Error', error.message);
    }
  };

  const renderConfirmationModal = () => (
    <Modal
      visible={showConfirmModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {syncResult?.success && syncResult?.confirmed ? (
            <>
              <Text style={styles.modalTitle}>✓ Synced Successfully!</Text>
              <Text style={styles.modalText}>
                Your watch received the update:
              </Text>
              <Text style={styles.modalBioAge}>{syncResult.receivedAge?.toFixed(1)} years</Text>
              <Text style={styles.modalSubtext}>Bio-Age confirmed by watch</Text>
            </>
          ) : syncResult?.success ? (
            <>
              <Text style={styles.modalTitle}>⏳ Data Sent</Text>
              <Text style={styles.modalText}>
                {syncResult.message || 'Waiting for watch confirmation...'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>⚠️ Sync Failed</Text>
              <Text style={styles.modalText}>
                {syncResult?.error || 'Could not sync to watch'}
              </Text>
            </>
          )}
          
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => setShowConfirmModal(false)}
          >
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTitle}>PRAXIOM</Text>
              <Text style={styles.logoSubtitle}>HEALTH</Text>
            </View>
          </View>
          
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>🕐</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>⌚</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.pageTitle}>Your Health Score</Text>

        {/* Health Score Cards */}
        <View style={styles.scoresRow}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreIcon}>🧡</Text>
            <Text style={styles.scoreLabel}>Oral Health</Text>
            <Text style={styles.scoreValue}>
              {oralHealthScore > 0 ? oralHealthScore : '0'}
            </Text>
            <Text style={styles.scoreStatus}>
              {oralHealthScore > 0 ? `${oralHealthScore}%` : 'NO DATA'}
            </Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreIcon}>❤️</Text>
            <Text style={styles.scoreLabel}>Systemic Health</Text>
            <Text style={styles.scoreValue}>
              {systemicHealthScore > 0 ? systemicHealthScore : '0'}
            </Text>
            <Text style={styles.scoreStatus}>
              {systemicHealthScore > 0 ? `${systemicHealthScore}%` : 'NO DATA'}
            </Text>
          </View>
        </View>

        {/* Fitness Score Card */}
        <View style={styles.fitnessCard}>
          <Text style={styles.fitnessIcon}>💪</Text>
          <Text style={styles.fitnessLabel}>Fitness Score</Text>
          <Text style={styles.fitnessValue}>
            {fitnessScore > 0 ? fitnessScore : '0'}
          </Text>
          <Text style={styles.fitnessStatus}>
            {fitnessScore > 0 ? `${fitnessScore}%` : 'NO DATA'}
          </Text>
        </View>

        {/* Main Bio-Age Card - Tap to Sync */}
        <TouchableOpacity
          style={[
            styles.bioAgeCard,
            watchConnected && styles.bioAgeCardConnected
          ]}
          onPress={handleSyncToWatch}
          disabled={syncing}
          activeOpacity={0.8}
        >
          <Text style={styles.bioAgeIcon}>🧬</Text>
          <Text style={styles.bioAgeLabel}>Biological Age</Text>
          
          <View style={styles.ageComparisonRow}>
            <View style={styles.ageColumn}>
              <Text style={styles.ageType}>Chronological</Text>
              <Text style={styles.ageArrow}>→</Text>
              <Text style={styles.ageValue}>--</Text>
            </View>
            
            <View style={styles.ageColumn}>
              <Text style={styles.ageType}>Biological</Text>
              <Text style={styles.ageValue} style={{ color: '#9B59B6' }}>
                {bioAge.toFixed(1)}
              </Text>
            </View>
          </View>
          
          {watchConnected && (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>● Watch Connected</Text>
            </View>
          )}
          
          {syncing ? (
            <View style={styles.syncingContainer}>
              <ActivityIndicator size="small" color="#9B59B6" />
              <Text style={styles.syncingText}>Syncing to watch...</Text>
            </View>
          ) : (
            <Text style={styles.syncHint}>
              {watchConnected ? '👆 Tap to sync to watch' : '⚠️ Connect watch first'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {renderConfirmationModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DCC8', // Cream/beige background
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E74C3C', // Red circle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    // 3D raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  logoText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoTextContainer: {
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  logoSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    // 3D raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconText: {
    fontSize: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 25,
  },
  bioAgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    // 3D raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  bioAgeCardConnected: {
    borderWidth: 2,
    borderColor: '#27AE60',
  },
  bioAgeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  bioAgeLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  ageComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  ageColumn: {
    alignItems: 'center',
    flex: 1,
  },
  ageType: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  ageArrow: {
    fontSize: 24,
    color: '#7F8C8D',
    marginVertical: 5,
  },
  ageValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 5,
  },
  connectedBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  connectedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  syncingText: {
    fontSize: 14,
    color: '#9B59B6',
    fontWeight: '600',
  },
  syncHint: {
    fontSize: 13,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    // 3D raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  scoreIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 15,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#95A5A6',
    marginBottom: 5,
  },
  scoreStatus: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '600',
  },
  fitnessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    // 3D raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  fitnessIcon: {
    fontSize: 52,
    marginBottom: 12,
  },
  fitnessLabel: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 15,
  },
  fitnessValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#95A5A6',
    marginBottom: 5,
  },
  fitnessStatus: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 35,
    width: '85%',
    alignItems: 'center',
    // 3D raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBioAge: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#27AE60',
    marginVertical: 15,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#95A5A6',
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: '#9B59B6',
    paddingVertical: 14,
    paddingHorizontal: 45,
    borderRadius: 25,
    // 3D raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
