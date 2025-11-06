import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [praxiomAge, setPraxiomAge] = useState('--');
  const [chronologicalAge, setChronologicalAge] = useState('-- years');
  const [oralHealth, setOralHealth] = useState('0%');
  const [systemicHealth, setSystemicHealth] = useState('0%');
  const [fitnessScore, setFitnessScore] = useState('0%');
  const [watchConnected, setWatchConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Load data on mount
  useEffect(() => {
    loadStoredData();
  }, []);

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

  const pushToWatch = () => {
    Alert.alert(
      'Push to Watch',
      `Send Praxiom Age ${praxiomAge} to your watch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            // BLE communication would go here
            Alert.alert('Success', 'Praxiom Age sent to watch!');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Praxiom Health</Text>
        </View>

        {/* Praxiom Age Card - Top Priority */}
        <View style={styles.praxiomAgeCard}>
          <Text style={styles.cardTitle}>Praxiom Age</Text>
          <View style={styles.ageDisplay}>
            <Text style={styles.ageNumber}>{praxiomAge}</Text>
          </View>
          <Text style={styles.chronologicalAge}>Chronological: {chronologicalAge}</Text>
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

          <View style={styles.liveWatchCard}>
            <Text style={styles.healthLabel}>Live Watch</Text>
            <View style={styles.liveDataRow}>
              <Text style={styles.liveLabel}>Steps</Text>
              <Text style={styles.liveValue}>--</Text>
            </View>
            <View style={styles.liveDataRow}>
              <Text style={styles.liveLabel}>HR</Text>
              <Text style={styles.liveValue}>--</Text>
            </View>
            <View style={styles.liveDataRow}>
              <Text style={styles.liveLabel}>O₂</Text>
              <Text style={styles.liveValue}>--</Text>
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
        <TouchableOpacity style={styles.pushButton} onPress={pushToWatch}>
          <Text style={styles.pushButtonIcon}>🔄</Text>
          <Text style={styles.pushButtonText}>Push to Watch</Text>
        </TouchableOpacity>

        {lastUpdated ? (
          <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E3D8', // Darker cream/beige background for better contrast
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C2C2C', // Dark text for contrast
  },
  
  // Praxiom Age Card - Top Priority
  praxiomAgeCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF8C42', // Orange border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C42', // Orange title
    marginBottom: 16,
  },
  ageDisplay: {
    alignItems: 'center',
    marginVertical: 12,
  },
  ageNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00CFC1', // Teal color for age
  },
  chronologicalAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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
    borderColor: '#FF8C42', // Orange border
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
    color: '#FF8C42', // Orange for scores
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
    borderColor: '#00CFC1', // Teal border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
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
    color: '#00CFC1', // Teal for live values
    fontWeight: 'bold',
  },

  // Action Buttons
  dnaButton: {
    backgroundColor: '#FF8C42', // Orange
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
    backgroundColor: '#A855F7', // Purple
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
    backgroundColor: '#00CFC1', // Teal
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
    backgroundColor: '#8B5CF6', // Purple
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
});
