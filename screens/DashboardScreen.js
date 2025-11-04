import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [praxiomAge, setPraxiomAge] = useState('--');
  const [oralHealth, setOralHealth] = useState('--');
  const [systemicHealth, setSystemicHealth] = useState('--');
  const [fitnessScore, setFitnessScore] = useState('--');
  const [wearableData, setWearableData] = useState({
    steps: '--',
    heartRate: '--',
    spo2: '--',
  });

  useEffect(() => {
    loadLatestData();
    
    // Listen for navigation focus to reload data when returning to screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadLatestData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadLatestData = async () => {
    try {
      // Load latest biomarker entry
      const entriesData = await AsyncStorage.getItem('biomarker_entries');
      if (entriesData) {
        const entries = JSON.parse(entriesData);
        if (entries.length > 0) {
          // Get most recent entry
          const latest = entries[entries.length - 1];
          setPraxiomAge(latest.bioAge ? latest.bioAge.toFixed(1) : '--');
          setOralHealth(latest.oralHealthScore ? latest.oralHealthScore.toFixed(0) : '--');
          setSystemicHealth(latest.systemicHealthScore ? latest.systemicHealthScore.toFixed(0) : '--');
          setFitnessScore(latest.fitnessScore ? latest.fitnessScore.toFixed(0) : '--');
          
          // Update wearable data if available
          if (latest.data) {
            setWearableData({
              steps: latest.data.dailySteps || '--',
              heartRate: latest.data.heartRate ? `${latest.data.heartRate}` : '--',
              spo2: latest.data.oxygenSaturation ? `${latest.data.oxygenSaturation}%` : '--',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#000" />
      
      <LinearGradient
        colors={['rgba(200, 200, 200, 0.3)', 'rgba(150, 150, 150, 0.3)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Praxiom Health</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Praxiom Age Card - Large at top */}
        <View style={[styles.card, styles.praxiomAgeCard]}>
          <Text style={styles.cardLabel}>Praxiom Age</Text>
          <Text style={styles.praxiomAgeValue}>{praxiomAge}</Text>
          <Text style={styles.yearsLabel}>years</Text>
        </View>

        {/* Health Score Cards Row */}
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardLabel}>Oral Health</Text>
            <Text style={[styles.scoreValue, { color: '#FF8C00' }]}>{oralHealth}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardLabel}>Systemic Health</Text>
            <Text style={[styles.scoreValue, { color: '#FF8C00' }]}>{systemicHealth}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>
        </View>

        {/* Fitness and Live Watch Row */}
        <View style={styles.cardsRow}>
          <View style={[styles.card, styles.halfCard, styles.fitnessCard]}>
            <Text style={styles.cardLabel}>Fitness Score</Text>
            <Text style={[styles.scoreValue, { color: '#FF8C00' }]}>{fitnessScore}</Text>
            <Text style={styles.scoreLabel}>level</Text>
          </View>
          <View style={[styles.card, styles.halfCard, styles.liveWatchCard]}>
            <Text style={styles.cardLabel}>Live Watch</Text>
            <View style={styles.wearableRow}>
              <Text style={styles.wearableLabel}>Steps</Text>
              <Text style={styles.wearableValue}>{wearableData.steps}</Text>
            </View>
            <View style={styles.wearableRow}>
              <Text style={styles.wearableLabel}>HR</Text>
              <Text style={styles.wearableValue}>{wearableData.heartRate}</Text>
            </View>
            <View style={styles.wearableRow}>
              <Text style={styles.wearableLabel}>O₂</Text>
              <Text style={styles.wearableValue}>{wearableData.spo2}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.actionButton, styles.dnaButton]}
        >
          <Ionicons name="fitness" size={24} color="white" />
          <Text style={styles.actionButtonText}>🧬 DNA Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.biomarkerButton]}
          onPress={() => navigation.navigate('BiomarkerInput')}
        >
          <Ionicons name="clipboard" size={24} color="white" />
          <Text style={styles.actionButtonText}>📝 Input Biomarkers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.calculateButton]}
          onPress={() => navigation.navigate('BiomarkerInput')}
        >
          <Ionicons name="calculator" size={24} color="white" />
          <Text style={styles.actionButtonText}>📊 Calculate Tier 1 Biomarkers</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 15,
    paddingBottom: 15,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
  },
  praxiomAgeCard: {
    borderWidth: 3,
    borderColor: '#FF8C00',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  praxiomAgeValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00CFC1',
    marginVertical: 10,
  },
  yearsLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfCard: {
    width: (width - 55) / 2,
    marginBottom: 0,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  fitnessCard: {
    borderWidth: 2,
    borderColor: '#00CFC1',
  },
  liveWatchCard: {
    borderWidth: 2,
    borderColor: '#00CFC1',
    alignItems: 'stretch',
  },
  wearableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  wearableLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  wearableValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
  },
  dnaButton: {
    backgroundColor: '#FF8C00',
  },
  biomarkerButton: {
    backgroundColor: '#9B59B6',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default DashboardScreen;
