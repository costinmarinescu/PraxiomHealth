import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../AppContext';
import WearableService from '../services/WearableService';

export default function DashboardScreen({ navigation }) {
  const { state, updateState, calculateScores } = useContext(AppContext);

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

  // 🔄 Handle recalculate age with watch sync
  const handleRecalculateAge = async () => {
    console.log('🔄 Recalculating biological age...');
    
    const newAge = calculateScores();
    
    // 🔥 AUTO-SEND TO WATCH if connected
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Praxiom Health</Text>
        <Text style={styles.headerSubtitle}>Bio-Age Overview</Text>
      </View>

      {/* Bio-Age Card */}
      <View style={styles.bioAgeCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="target" size={28} color="#00CFC1" />
          <Text style={styles.cardTitle}>Bio-Age Overview</Text>
        </View>

        <View style={styles.ageGrid}>
          {/* Chronological Age */}
          <View style={styles.ageItem}>
            <Text style={styles.ageLabel}>Chronological Age</Text>
            <Text style={styles.ageValue}>{state.chronologicalAge}</Text>
            <Text style={styles.ageUnit}>years</Text>
          </View>

          {/* Praxiom Age */}
          <View style={styles.ageItem}>
            <Text style={styles.ageLabel}>Praxiom Age</Text>
            <Text style={[styles.ageValue, { color: getScoreColor(state.biologicalAge) }]}>
              {state.biologicalAge.toFixed(1)}
            </Text>
            <Text style={styles.ageUnit}>years</Text>
          </View>
        </View>

        {/* Bio-Age Deviation */}
        <View style={styles.deviationSection}>
          <Text style={styles.deviationLabel}>Bio-Age Deviation:</Text>
          <Text
            style={[
              styles.deviationValue,
              {
                color: getDeviationColor(state.biologicalAge - state.chronologicalAge),
              },
            ]}
          >
            {state.biologicalAge > state.chronologicalAge ? '+' : ''}
            {(state.biologicalAge - state.chronologicalAge).toFixed(1)} years
          </Text>
        </View>
      </View>

      {/* Watch Connection Button */}
      <TouchableOpacity
        style={[
          styles.watchButton,
          {
            backgroundColor: state.watchConnected ? '#47C83E' : '#95A5A6',
          },
        ]}
        onPress={() => navigation.navigate('Watch')}
      >
        <Ionicons name="watch" size={24} color="#fff" />
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
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.recalculateText}>🔄 Recalculate Age</Text>
      </TouchableOpacity>

      {/* Health Scores Grid */}
      <View style={styles.scoresGrid}>
        {/* Oral Health */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="medical" size={24} color="#FF6B6B" />
            <Text style={styles.scoreTitle}>Oral Health</Text>
          </View>
          <Text style={[styles.scoreValue, { color: getScoreColor(state.oralHealthScore) }]}>
            {state.oralHealthScore}%
          </Text>
          <Text style={styles.scoreTarget}>Target: >85%</Text>
          <View style={[styles.scoreBar, { backgroundColor: getScoreColor(state.oralHealthScore) }]} />
        </View>

        {/* Systemic Health */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="heart" size={24} color="#FF6B6B" />
            <Text style={styles.scoreTitle}>Systemic Health</Text>
          </View>
          <Text style={[styles.scoreValue, { color: getScoreColor(state.systemicHealthScore) }]}>
            {state.systemicHealthScore}%
          </Text>
          <Text style={styles.scoreTarget}>Target: >85%</Text>
          <View style={[styles.scoreBar, { backgroundColor: getScoreColor(state.systemicHealthScore) }]} />
        </View>

        {/* Fitness Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="fitness" size={24} color="#FFB800" />
            <Text style={styles.scoreTitle}>Fitness Score</Text>
          </View>
          <Text style={[styles.scoreValue, { color: getScoreColor(state.fitnessScore) }]}>
            {state.fitnessScore}%
          </Text>
          <Text style={styles.scoreTarget}>Target: >85%</Text>
          <View style={[styles.scoreBar, { backgroundColor: getScoreColor(state.fitnessScore) }]} />
        </View>

        {/* Wearable Data */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="watch" size={24} color="#00CFC1" />
            <Text style={styles.scoreTitle}>Wearable Data</Text>
          </View>
          {state.watchConnected ? (
            <>
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
            </>
          ) : (
            <Text style={styles.noDataText}>Connect watch to see data</Text>
          )}
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationGrid}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('BiomarkerInput')}
        >
          <Ionicons name="document-text" size={24} color="#00CFC1" />
          <Text style={styles.navButtonText}>📝 Enter Biomarkers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Report')}
        >
          <Ionicons name="bar-chart" size={24} color="#00CFC1" />
          <Text style={styles.navButtonText}>📊 View Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Last synced: {state.lastSync ? new Date(state.lastSync).toLocaleString() : 'Never'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#00CFC1',
    marginTop: 4,
  },
  bioAgeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 10,
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
    marginBottom: 5,
  },
  ageValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  ageUnit: {
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  watchButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  recalculateButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#00CFC1',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recalculateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  scoresGrid: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  scoreTarget: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  scoreBar: {
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
  },
  wearableData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  dataItem: {
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  navigationGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 15,
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00CFC1',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
