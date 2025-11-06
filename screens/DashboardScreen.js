import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const [bioAge, setBioAge] = useState(null);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [oralHealth, setOralHealth] = useState(85);
  const [systemicHealth, setSystemicHealth] = useState(82);
  const [fitnessScore, setFitnessScore] = useState(78);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedBioAge = await AsyncStorage.getItem('bioAge');
      const savedChronAge = await AsyncStorage.getItem('chronologicalAge');
      
      if (savedBioAge) setBioAge(parseFloat(savedBioAge));
      if (savedChronAge) setChronologicalAge(parseFloat(savedChronAge));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      {/* Background Logo with 80% transparency */}
      <View style={styles.logoBackground}>
        <Image
          source={require('../assets/praxiom-logo.png')}
          style={styles.backgroundLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Centered Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>PRAXIOM HEALTH</Text>
        </View>

        {/* Bio-Age Display */}
        <View style={styles.bioAgeCard}>
          <Text style={styles.cardLabel}>Biological Age</Text>
          <Text style={styles.bioAgeNumber}>
            {bioAge ? bioAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.cardSubtext}>years</Text>
          {chronologicalAge && bioAge && (
            <Text style={styles.comparisonText}>
              {bioAge < chronologicalAge
                ? `${(chronologicalAge - bioAge).toFixed(1)} years younger!`
                : bioAge > chronologicalAge
                ? `${(bioAge - chronologicalAge).toFixed(1)} years older`
                : 'On target!'}
            </Text>
          )}
        </View>

        {/* Health Score Cards Row 1 */}
        <View style={styles.cardsRow}>
          <View style={[styles.healthCard, styles.cardOral]}>
            <Text style={styles.cardLabel}>Oral Health</Text>
            <Text style={styles.cardScore}>{oralHealth}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${oralHealth}%` }]} />
            </View>
          </View>

          <View style={[styles.healthCard, styles.cardSystemic]}>
            <Text style={styles.cardLabel}>Systemic Health</Text>
            <Text style={styles.cardScore}>{systemicHealth}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${systemicHealth}%` }]} />
            </View>
          </View>
        </View>

        {/* Fitness Score - Centered */}
        <View style={styles.fitnessCardContainer}>
          <View style={[styles.healthCard, styles.cardFitness]}>
            <Text style={styles.cardLabel}>Fitness Score</Text>
            <Text style={styles.cardScore}>{fitnessScore}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${fitnessScore}%` }]} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.buttonText}>📊 View Full Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.buttonText}>🎯 Set New Goals</Text>
          </TouchableOpacity>
        </View>

        {/* Sync Status */}
        <View style={styles.syncCard}>
          <Text style={styles.syncText}>
            Last synced with watch: Just now
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoBackground: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  backgroundLogo: {
    width: '70%',
    height: '100%',
    opacity: 0.2, // 80% transparency (0.2 = 20% opacity)
  },
  scrollView: {
    flex: 1,
    padding: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    letterSpacing: 2,
  },
  bioAgeCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
    fontWeight: '600',
  },
  bioAgeNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  cardSubtext: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: -5,
  },
  comparisonText: {
    fontSize: 14,
    color: '#00CFC1',
    marginTop: 10,
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  healthCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardOral: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  cardSystemic: {
    borderLeftWidth: 4,
    borderLeftColor: '#00CFC1',
  },
  cardFitness: {
    borderLeftWidth: 4,
    borderLeftColor: '#9B59B6',
  },
  fitnessCardContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CFC1',
    borderRadius: 4,
  },
  buttonsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#00CFC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  syncText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
});
