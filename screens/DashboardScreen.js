import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppContext } from '../AppContext';

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Bio-Age Overview Card */}
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
          <Text 
            style={[
              styles.deviationValue, 
              { color: getDeviationColor(state.biologicalAge - state.chronologicalAge) }
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
          state.watchConnected ? styles.watchConnected : styles.watchDisconnected
        ]}
        onPress={() => navigation.navigate('Watch')}
      >
        <Text style={styles.watchButtonIcon}>{state.watchConnected ? '⌚✓' : '⌚'}</Text>
        <Text style={styles.watchButtonText}>
          {state.watchConnected ? 'Watch Connected' : 'Connect Watch'}
        </Text>
        {state.watchConnected && state.lastSync && (
          <Text style={styles.syncText}>
            Last sync: {new Date(state.lastSync).toLocaleTimeString()}
          </Text>
        )}
      </TouchableOpacity>

      {/* Health Score Cards */}
      <View style={styles.scoreCardsContainer}>
        {/* Oral Health Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Oral Health</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(state.oralHealthScore) }]}>
            {state.oralHealthScore}%
          </Text>
          <Text style={styles.scoreTarget}>Target: &gt;85%</Text>
          <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(state.oralHealthScore) }]} />
        </View>

        {/* Systemic Health Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Systemic Health</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(state.systemicHealthScore) }]}>
            {state.systemicHealthScore}%
          </Text>
          <Text style={styles.scoreTarget}>Target: &gt;85%</Text>
          <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(state.systemicHealthScore) }]} />
        </View>
      </View>

      {/* Additional Score Cards */}
      <View style={styles.scoreCardsContainer}>
        {/* Fitness Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Fitness Score</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(state.fitnessScore) }]}>
            {state.fitnessScore}%
          </Text>
          <Text style={styles.scoreTarget}>Target: &gt;85%</Text>
          <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(state.fitnessScore) }]} />
        </View>

        {/* Wearable Data Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Wearable Data</Text>
          <View style={styles.wearableData}>
            <Text style={styles.wearableItem}>❤️ {state.heartRate || '--'} bpm</Text>
            <Text style={styles.wearableItem}>👟 {state.steps || 0}</Text>
            <Text style={styles.wearableItem}>📊 HRV: {state.hrv || '--'}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions - FIXED NAVIGATION */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('BiomarkerInput')}
        >
          <Text style={styles.actionButtonText}>📝 Enter Biomarkers</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            calculateScores();
            updateState({ lastSync: new Date().toISOString() });
          }}
        >
          <Text style={styles.actionButtonText}>🔄 Recalculate Age</Text>
        </TouchableOpacity>
      </View>

      {/* Tier Upgrade Alert */}
      {(state.oralHealthScore < 75 || state.systemicHealthScore < 75) && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>⚠️ Tier Upgrade Recommended</Text>
          <Text style={styles.alertText}>
            Your health scores indicate you may benefit from Tier 2 assessment for more personalized insights.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  bioAgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  targetIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  bioAgeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  ageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  ageBox: {
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  ageValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  bioAge: {
    color: '#FF6B00',
  },
  ageUnit: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 5,
  },
  deviationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deviationLabel: {
    fontSize: 16,
    color: '#7F8C8D',
    marginRight: 10,
  },
  deviationValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
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
  watchConnected: {
    backgroundColor: '#47C83E',
  },
  watchDisconnected: {
    backgroundColor: '#95A5A6',
  },
  watchButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  watchButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  syncText: {
    fontSize: 12,
    color: '#FFF',
    marginLeft: 10,
  },
  scoreCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
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
  scoreTitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreTarget: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 10,
  },
  scoreIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: 10,
  },
  wearableData: {
    alignItems: 'center',
    marginTop: 10,
  },
  wearableItem: {
    fontSize: 14,
    color: '#2C3E50',
    marginVertical: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#0099DB',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  alertText: {
    fontSize: 14,
    color: '#856404',
  },
});
