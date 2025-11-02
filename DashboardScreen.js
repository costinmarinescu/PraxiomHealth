import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BLEService from '../services/BLEService';

export default function DashboardScreen({ navigation }) {
  const [healthData, setHealthData] = useState({
    biologicalAge: 0,
    chronologicalAge: 0,
    oralHealthScore: 0,
    systemicHealthScore: 0,
    fitnessScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
    // Listen for watch data updates
    const unsubscribe = BLEService.onDataReceived((data) => {
      if (data.praxiomAge) {
        updateHealthData({ biologicalAge: data.praxiomAge });
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const loadHealthData = async () => {
    try {
      const stored = await AsyncStorage.getItem('healthData');
      if (stored) {
        setHealthData(JSON.parse(stored));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading health data:', error);
      setLoading(false);
    }
  };

  const updateHealthData = async (newData) => {
    const updated = { ...healthData, ...newData };
    setHealthData(updated);
    await AsyncStorage.setItem('healthData', JSON.stringify(updated));
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#4CAF50'; // Green
    if (score >= 70) return '#8BC34A'; // Light green
    if (score >= 50) return '#FFA726'; // Orange
    return '#EF5350'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const HealthScoreCard = ({ title, score, style }) => {
    const color = getScoreColor(score);
    const label = getScoreLabel(score);
    const percentage = Math.min(100, Math.max(0, score));

    return (
      <View style={[styles.scoreCard, style]}>
        <View style={styles.scoreCircleContainer}>
          <View style={styles.scoreCircleOuter}>
            <View 
              style={[
                styles.scoreCircleProgress, 
                { 
                  borderColor: color,
                  borderWidth: 8,
                  transform: [{ rotate: `${(percentage / 100) * 360}deg` }]
                }
              ]} 
            />
            <View style={styles.scoreCircleInner}>
              <Text style={styles.scoreValue}>{Math.round(score)}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.scoreTitle}>{title}</Text>
        <View style={[styles.scoreLabel, { backgroundColor: color }]}>
          <Text style={styles.scoreLabelText}>{label}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['rgba(21, 133, 181, 0.3)', 'rgba(94, 221, 238, 0.3)']}
        style={styles.container}
      >
        <ActivityIndicator size="large" color="#1585B5" />
      </LinearGradient>
    );
  }

  const ageDifference = healthData.biologicalAge - healthData.chronologicalAge;

  return (
    <LinearGradient
      colors={['rgba(21, 133, 181, 0.3)', 'rgba(94, 221, 238, 0.3)']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Age Section */}
        <View style={styles.ageSection}>
          <Text style={styles.sectionTitle}>Your Biological Age</Text>
          <Text style={styles.biologicalAge}>
            {healthData.biologicalAge.toFixed(1)} years
          </Text>
          <Text style={styles.chronologicalAge}>
            Chronological Age: {healthData.chronologicalAge} years 
            {ageDifference !== 0 && (
              <Text style={[
                styles.ageDifference,
                { color: ageDifference > 0 ? '#EF5350' : '#4CAF50' }
              ]}>
                {' '}({ageDifference > 0 ? '+' : ''}{ageDifference.toFixed(1)} years)
              </Text>
            )}
          </Text>
        </View>

        {/* Health Scores Section */}
        <View style={styles.scoresContainer}>
          <View style={styles.topRow}>
            <HealthScoreCard 
              title="Oral Health Score"
              score={healthData.oralHealthScore}
              style={styles.halfCard}
            />
            <HealthScoreCard 
              title="Systemic Health Score"
              score={healthData.systemicHealthScore}
              style={styles.halfCard}
            />
          </View>
          
          <HealthScoreCard 
            title="Fitness Score"
            score={healthData.fitnessScore}
            style={styles.fullCard}
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Watch')}
        >
          <Text style={styles.buttonText}>Connect to Watch</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>Import Wearable Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  ageSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  biologicalAge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#EF5350',
    marginBottom: 8,
  },
  chronologicalAge: {
    fontSize: 14,
    color: '#666',
  },
  ageDifference: {
    fontWeight: '600',
  },
  scoresContainer: {
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfCard: {
    width: '48%',
  },
  fullCard: {
    width: '100%',
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreCircleContainer: {
    marginBottom: 15,
  },
  scoreCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scoreCircleProgress: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  scoreCircleInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  scoreLabel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scoreLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1585B5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#5EDDEE',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
