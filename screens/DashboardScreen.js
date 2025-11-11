import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';
import WearableService from '../services/WearableService';

export default function DashboardScreen({ navigation }) {
  const { state, calculateScores } = useContext(AppContext);

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

  const handleRecalculateAge = async () => {
    console.log('🔄 Recalculating biological age...');
    const newAge = calculateScores();

    if (state.watchConnected) {
      try {
        console.log('📤 Sending bio-age to watch:', newAge);
        await WearableService.sendBiologicalAge(newAge);
        console.log('✅ Bio-age synced to watch!');
      } catch (error) {
        console.error('❌ Failed to sync bio-age:', error.message);
      }
    } else {
      console.log('⚠️ Watch not connected, bio-age not sent');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Praxiom Health</Text>
          <Text style={styles.headerSubtitle}>Bio-Age Overview</Text>
        </View>

        {/* Bio-Age Card */}
        <View style={styles.bioAgeCard}>
          <Text style={styles.cardTitle}>Bio-Age Overview</Text>

          {/* Age Grid */}
          <View style={styles.ageGrid}>
            <View style={styles.ageItem}>
              <Text style={styles.ageLabel}>Chronological Age</Text>
              <Text style={styles.ageValue}>{state.chronologicalAge}</Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>

            <View style={styles.ageItem}>
              <Text style={styles.ageLabel}>Praxiom Age</Text>
              <Text style={[styles.ageValue, { color: getDeviationColor(state.biologicalAge - state.chronologicalAge) }]}>
                {state.biologicalAge.toFixed(1)}
              </Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>
          </View>

          {/* Deviation */}
          <View style={styles.deviationSection}>
            <Text style={styles.deviationLabel}>Bio-Age Deviation:</Text>
            <Text style={[styles.deviationValue, { color: getDeviationColor(state.biologicalAge - state.chronologicalAge) }]}>
              {state.biologicalAge > state.chronologicalAge ? '+' : ''}
              {(state.biologicalAge - state.chronologicalAge).toFixed(1)} years
            </Text>
          </View>
        </View>

        {/* Watch Connection Button */}
        <TouchableOpacity 
          style={[styles.watchButton, { backgroundColor: state.watchConnected ? '#47C83E' : '#666' }]}
          onPress={() => navigation.navigate('Watch')}>
          <Ionicons name={state.watchConnected ? 'checkmark-circle' : 'watch-outline'} size={24} color="#fff" />
          <View style={styles.watchButtonText}>
            <Text style={styles.watchButtonTitle}>
              {state.watchConnected ? '✓ Connected to Watch' : 'Connect Watch'}
            </Text>
            {state.watchConnected && (
              <Text style={styles.watchButtonSubtitle}>Tap to manage connection</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Recalculate Button */}
        <TouchableOpacity style={styles.recalculateButton} onPress={handleRecalculateAge}>
          <Text style={styles.recalculateText}>🔄 Recalculate Age</Text>
        </TouchableOpacity>

        {/* Health Scores Grid (2x2) */}
        <View style={styles.scoresGrid}>
          {/* Oral Health */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="water" size={20} color={getScoreColor(state.oralHealthScore)} />
              <Text style={styles.scoreTitle}>Oral Health</Text>
            </View>
            <Text style={[styles.scoreValue, { color: getScoreColor(state.oralHealthScore) }]}>
              {state.oralHealthScore}%
            </Text>
            <Text style={styles.scoreTarget}>Target: >85%</Text>
            <View style={[styles.scoreBar, { backgroundColor: getScoreColor(state.oralHealthScore), width: `${state.oralHealthScore}%` }]} />
          </View>

          {/* Systemic Health */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="fitness" size={20} color={getScoreColor(state.systemicHealthScore)} />
              <Text style={styles.scoreTitle}>Systemic Health</Text>
            </View>
            <Text style={[styles.scoreValue, { color: getScoreColor(state.systemicHealthScore) }]}>
              {state.systemicHealthScore}%
            </Text>
            <Text style={styles.scoreTarget}>Target: >85%</Text>
            <View style={[styles.scoreBar, { backgroundColor: getScoreColor(state.systemicHealthScore), width: `${state.systemicHealthScore}%` }]} />
          </View>

          {/* Fitness Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="walk" size={20} color={getScoreColor(state.fitnessScore)} />
              <Text style={styles.scoreTitle}>Fitness Score</Text>
            </View>
            <Text style={[styles.scoreValue, { color: getScoreColor(state.fitnessScore) }]}>
              {state.fitnessScore}%
            </Text>
            <Text style={styles.scoreTarget}>Target: >85%</Text>
            <View style={[styles.scoreBar, { backgroundColor: getScoreColor(state.fitnessScore), width: `${state.fitnessScore}%` }]} />
          </View>

          {/* Wearable Data */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Ionicons name="watch" size={20} color="#00CFC1" />
              <Text style={styles.scoreTitle}>Wearable Data</Text>
            </View>
            {state.watchConnected ? (
              <View style={styles.wearableData}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>❤️ HR</Text>
                  <Text style={styles.dataValue}>{state.heartRate || '--'} bpm</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>👟 Steps</Text>
                  <Text style={styles.dataValue}>{state.steps || 0}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>📊 HRV</Text>
                  <Text style={styles.dataValue}>{state.hrv ? state.hrv : '--'}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>Connect watch to see data</Text>
            )}
          </View>
        </View>

        {/* Navigation Buttons Grid (2x2) */}
        <View style={styles.navigationGrid}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('BiomarkerInput')}>
            <Ionicons name="create-outline" size={32} color="#00CFC1" />
            <Text style={styles.navButtonText}>📝 Enter Biomarkers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Report')}>
            <Ionicons name="stats-chart" size={32} color="#00CFC1" />
            <Text style={styles.navButtonText}>📊 View Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('DNATest')}>
            <Ionicons name="gitlab" size={32} color="#00CFC1" />
            <Text style={styles.navButtonText}>🧬 DNA Test</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('HistoricalData')}>
            <Ionicons name="trending-up" size={32} color="#00CFC1" />
            <Text style={styles.navButtonText}>📈 History</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last synced: {state.lastSync ? new Date(state.lastSync).toLocaleString() : 'Never'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#00CFC1',
    marginTop: 4,
    opacity: 0.9,
  },
  bioAgeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  ageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  ageItem: {
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  ageValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  ageUnit: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  deviationSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    alignItems: 'center',
  },
  deviationLabel: {
    fontSize: 14,
    color: '#999',
  },
  deviationValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  watchButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  watchButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  watchButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  watchButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  recalculateButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#00CFC1',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  recalculateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginVertical: 15,
    justifyContent: 'space-between',
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 6,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  scoreTarget: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  scoreBar: {
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  wearableData: {
    marginTop: 8,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
  },
  dataValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  noDataText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginVertical: 15,
    justifyContent: 'space-between',
  },
  navButton: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00CFC1',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
