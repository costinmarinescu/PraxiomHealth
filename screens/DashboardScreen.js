import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const { state, updateState, calculateScores } = useContext(AppContext);
  const [showWatchAlert, setShowWatchAlert] = React.useState(false);

  useEffect(() => {
    checkWatchConnection();
    const interval = setInterval(checkWatchConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWatchConnection = async () => {
    try {
      const watchStatus = await AsyncStorage.getItem('watchConnected');
      updateState({ watchConnected: watchStatus === 'true' });
    } catch (error) {
      console.error('Error checking watch connection:', error);
    }
  };

  const handleWatchButtonPress = () => {
    if (!state.watchConnected) {
      setShowWatchAlert(true);
    } else {
      navigation.getParent().navigate('Watch');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#47C83E';
    if (score >= 75) return '#FFB800';
    return '#E74C3C';
  };

  const getDeviationColor = (deviation) => {
    if (Math.abs(deviation) <= 5) return '#47C83E';
    if (Math.abs(deviation) <= 10) return '#FFB800';
    return '#E74C3C';
  };

  const handleRecalculateAge = () => {
    const newBioAge = calculateScores();
    if (newBioAge && !isNaN(newBioAge)) {
      Alert.alert(
        '✅ Recalculated',
        `Your Bio-Age has been recalculated based on your latest biomarkers.\n\nNew Bio-Age: ${newBioAge.toFixed(1)} years`
      );
    } else {
      Alert.alert(
        'Unable to Calculate',
        'Please enter your biomarkers first to calculate your biological age.'
      );
    }
  };

  return (
    <LinearGradient colors={['#FF6B00', '#FFB800']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✨ NEW: Praxiom Health Header with Logo */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../assets/praxiom-logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Praxiom Health</Text>
          <Text style={styles.headerSubtitle}>Precision Longevity Medicine</Text>
        </View>

        <View style={styles.bioAgeCard}>
          <View style={styles.bioAgeHeader}>
            <Text style={styles.targetIcon}>🎯</Text>
            <Text style={styles.bioAgeTitle}>Bio-Age Overview</Text>
          </View>

          <View style={styles.ageContainer}>
            <View style={styles.ageBox}>
              <Text style={styles.ageLabel}>Chronological Age</Text>
              <Text style={styles.ageValue}>{state.chronologicalAge}</Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>

            <View style={styles.ageBox}>
              <Text style={styles.ageLabel}>Praxiom Age</Text>
              <Text style={[styles.ageValue, styles.bioAge]}>
                {state.biologicalAge.toFixed(1)}
              </Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>
          </View>

          <View style={styles.deviationContainer}>
            <Text style={styles.deviationLabel}>Bio-Age Deviation:</Text>
            <Text style={[
              styles.deviationValue,
              { color: getDeviationColor(state.biologicalAge - state.chronologicalAge) }
            ]}>
              {state.biologicalAge > state.chronologicalAge ? '+' : ''}
              {(state.biologicalAge - state.chronologicalAge).toFixed(1)} years
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.watchButton,
            state.watchConnected ? styles.watchConnected : styles.watchDisconnected
          ]}
          onPress={handleWatchButtonPress}
        >
          <Text style={styles.watchButtonIcon}>
            {state.watchConnected ? '⌚✓' : '⌚'}
          </Text>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.watchButtonText}>
              {state.watchConnected ? 'Watch Connected' : 'Connect Watch'}
            </Text>
            {state.watchConnected && state.lastSync && (
              <Text style={styles.syncText}>
                Last sync: {new Date(state.lastSync).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.scoreCardsContainer}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Oral Health</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(state.oralHealthScore) }]}>
              {state.oralHealthScore}%
            </Text>
            <Text style={styles.scoreTarget}>Target: &gt;85%</Text>
            <View style={[
              styles.scoreIndicator,
              { backgroundColor: getScoreColor(state.oralHealthScore) }
            ]} />
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Systemic Health</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(state.systemicHealthScore) }]}>
              {state.systemicHealthScore}%
            </Text>
            <Text style={styles.scoreTarget}>Target: &gt;85%</Text>
            <View style={[
              styles.scoreIndicator,
              { backgroundColor: getScoreColor(state.systemicHealthScore) }
            ]} />
          </View>
        </View>

        <View style={styles.scoreCardsContainer}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Fitness Score</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(state.fitnessScore) }]}>
              {state.fitnessScore}%
            </Text>
            <Text style={styles.scoreTarget}>Target: &gt;85%</Text>
            <View style={[
              styles.scoreIndicator,
              { backgroundColor: getScoreColor(state.fitnessScore) }
            ]} />
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Wearable Data</Text>
            <View style={styles.wearableData}>
              <Text style={styles.wearableItem}>❤️ {state.heartRate || '--'} bpm</Text>
              <Text style={styles.wearableItem}>👟 {state.steps || 0}</Text>
              <Text style={styles.wearableItem}>📊 HRV: {state.hrv || '--'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Tier1BiomarkerInput')}
          >
            <Text style={styles.actionButtonText}>📝 Tier 1</Text>
            <Text style={styles.actionButtonText}>Biomarkers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Tier2BiomarkerInput')}
          >
            <Text style={styles.actionButtonText}>🔥 Tier 2</Text>
            <Text style={styles.actionButtonText}>Advanced</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('FitnessAssessment')}
          >
            <Text style={styles.actionButtonText}>💪 Fitness</Text>
            <Text style={styles.actionButtonText}>Assessment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleRecalculateAge}
          >
            <Text style={styles.actionButtonText}>🔄 Recalculate</Text>
            <Text style={styles.actionButtonText}>Age</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('HistoricalData')}
          >
            <Text style={styles.actionButtonText}>📈 History</Text>
          </TouchableOpacity>
        </View>

        {(state.oralHealthScore < 75 || state.systemicHealthScore < 75) && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ Tier Upgrade Recommended</Text>
            <Text style={styles.alertText}>
              Your health scores indicate you may benefit from Tier 2 assessment for more personalized insights.
            </Text>
          </View>
        )}

        <Modal
          visible={showWatchAlert}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowWatchAlert(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Watch Not Connected</Text>
              <Text style={styles.modalText}>
                Please go to the Watch tab and connect to your PineTime watch first.
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowWatchAlert(false);
                  navigation.getParent().navigate('Watch');
                }}
              >
                <Text style={styles.modalButtonText}>Go to Watch Tab</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowWatchAlert(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  // ✨ NEW: Header styles
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  bioAgeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bioAgeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  targetIcon: { fontSize: 24, marginRight: 10 },
  bioAgeTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  ageContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  ageBox: { alignItems: 'center' },
  ageLabel: { fontSize: 14, color: '#7F8C8D', marginBottom: 5 },
  ageValue: { fontSize: 48, fontWeight: 'bold', color: '#2C3E50' },
  bioAge: { color: '#FF6B00' },
  ageUnit: { fontSize: 16, color: '#7F8C8D', marginTop: 5 },
  deviationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deviationLabel: { fontSize: 16, color: '#7F8C8D', marginRight: 10 },
  deviationValue: { fontSize: 18, fontWeight: 'bold' },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  watchConnected: { backgroundColor: '#47C83E' },
  watchDisconnected: { backgroundColor: '#95A5A6' },
  watchButtonIcon: { fontSize: 24, marginRight: 10, color: '#FFF' },
  watchButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  syncText: { fontSize: 12, color: '#FFF', marginTop: 2 },
  scoreCardsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  scoreTitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 10 },
  scoreValue: { fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  scoreTarget: { fontSize: 12, color: '#95A5A6', marginBottom: 10 },
  scoreIndicator: { width: 50, height: 50, borderRadius: 25, marginTop: 10 },
  wearableData: { alignItems: 'center', marginTop: 10 },
  wearableItem: { fontSize: 14, color: '#2C3E50', marginVertical: 2 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 10 },
  actionButton: {
    backgroundColor: '#0099DB',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  alertCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#856404', marginBottom: 5 },
  alertText: { fontSize: 14, color: '#856404' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 10 },
  modalText: { fontSize: 16, color: '#7F8C8D', textAlign: 'center', marginBottom: 20 },
  modalButton: { backgroundColor: '#0099DB', borderRadius: 10, padding: 15, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalCancelButton: { backgroundColor: '#E0E0E0' },
  modalCancelButtonText: { color: '#7F8C8D', fontSize: 16, fontWeight: 'bold' },
});
