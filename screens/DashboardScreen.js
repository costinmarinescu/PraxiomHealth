import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  const [praxiomAge, setPraxiomAge] = useState(null);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [oralHealthScore, setOralHealthScore] = useState(0);
  const [systemicHealthScore, setSystemicHealthScore] = useState(0);
  const [fitnessScore, setFitnessScore] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const savedPraxiomAge = await AsyncStorage.getItem('praxiomAge');
      const savedChronAge = await AsyncStorage.getItem('chronologicalAge');
      const savedOralScore = await AsyncStorage.getItem('oralHealthScore');
      const savedSystemicScore = await AsyncStorage.getItem('systemicHealthScore');
      const savedFitnessScore = await AsyncStorage.getItem('fitnessScore');

      if (savedPraxiomAge) setPraxiomAge(parseFloat(savedPraxiomAge));
      if (savedChronAge) setChronologicalAge(parseFloat(savedChronAge));
      if (savedOralScore) setOralHealthScore(parseFloat(savedOralScore));
      if (savedSystemicScore) setSystemicHealthScore(parseFloat(savedSystemicScore));
      if (savedFitnessScore) setFitnessScore(parseFloat(savedFitnessScore));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>PRAXIOM{'\n'}HEALTH</Text>
        </View>

        {/* Bio-Age Card */}
        <View style={styles.ageCard}>
          <Text style={styles.ageLabel}>Praxiom Age</Text>
          <Text style={styles.ageValue}>
            {praxiomAge ? praxiomAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.chronAge}>
            Chronological: {chronologicalAge ? chronologicalAge.toFixed(0) : '--'} years
          </Text>
        </View>

        {/* Health Score Cards */}
        <View style={styles.cardsContainer}>
          <View style={styles.scoreCard}>
            <Ionicons name="medical" size={32} color="#FF8C00" />
            <Text style={styles.cardLabel}>Oral Health</Text>
            <Text style={styles.cardScore}>{oralHealthScore.toFixed(0)}%</Text>
          </View>

          <View style={styles.scoreCard}>
            <Ionicons name="heart" size={32} color="#00CFC1" />
            <Text style={styles.cardLabel}>Systemic Health</Text>
            <Text style={styles.cardScore}>{systemicHealthScore.toFixed(0)}%</Text>
          </View>
        </View>

        {/* Fitness Score Card (Centered) */}
        <View style={styles.fitnessCard}>
          <Ionicons name="fitness" size={36} color="#9D4EDD" />
          <Text style={styles.fitnessLabel}>Fitness Score</Text>
          <Text style={styles.fitnessScore}>{fitnessScore.toFixed(0)}%</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('DNATest')}
          >
            <Ionicons name="analytics" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>DNA Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.biomarkerButton]}
            onPress={() => navigation.navigate('BiomarkerInput')}
          >
            <Ionicons name="clipboard" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Biomarker Input</Text>
          </TouchableOpacity>
        </View>

        {/* Sync to Watch Button */}
        <TouchableOpacity style={styles.syncButton}>
          <Ionicons name="sync" size={20} color="#FFFFFF" />
          <Text style={styles.syncText}>Push to Watch</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 20,
    textAlign: 'center',
  },
  ageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  ageLabel: {
    fontSize: 18,
    color: '#FF8C00',
    fontWeight: '600',
    marginBottom: 8,
  },
  ageValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  chronAge: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  fitnessCard: {
    backgroundColor: 'rgba(157, 78, 221, 0.2)',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    width: '67%',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(157, 78, 221, 0.4)',
    shadowColor: '#9D4EDD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fitnessLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 12,
    marginBottom: 8,
  },
  fitnessScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  biomarkerButton: {
    backgroundColor: '#00CFC1',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  syncButton: {
    backgroundColor: 'rgba(157, 78, 221, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  syncText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
