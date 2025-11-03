import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BLEService from '../services/BLEService';
import WearableDataService from '../services/WearableDataService';

export default function DashboardScreen() {
  const [healthData, setHealthData] = useState({
    praxiomAge: null,
    oralHealth: null,
    systemicHealth: null,
    fitnessScore: null,
  });

  const [watchData, setWatchData] = useState({
    steps: '--',
    heartRate: '--',
    o2Saturation: '--'
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    setupBLEListener();
    
    return () => {
      BLEService.removeListener(handleBLEData);
    };
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem('healthData');
      if (saved) {
        setHealthData(JSON.parse(saved));
      }
      setLoading(false);
    } catch (error) {
      console.error('Load data error:', error);
      setLoading(false);
    }
  };

  const setupBLEListener = () => {
    BLEService.addListener(handleBLEData);
    
    // Try auto-reconnect
    BLEService.autoReconnect().then(connected => {
      if (connected) {
        console.log('Auto-reconnected to watch');
      }
    });
  };

  const handleBLEData = (data) => {
    setHealthData(prev => {
      const updated = { ...prev, ...data };
      AsyncStorage.setItem('healthData', JSON.stringify(updated));
      return updated;
    });

    // Update watch data if available
    if (data.heartRate) setWatchData(prev => ({ ...prev, heartRate: data.heartRate }));
    if (data.steps) setWatchData(prev => ({ ...prev, steps: data.steps }));
    if (data.o2Saturation) setWatchData(prev => ({ ...prev, o2Saturation: data.o2Saturation }));
  };

  const handleDNATest = () => {
    Alert.alert(
      'DNA Methylation Test',
      'This feature will guide you through the DNA methylation testing process.\n\nComing soon!',
      [{ text: 'OK' }]
    );
  };

  const handleInputBiomarkers = () => {
    Alert.alert(
      'Input Tier Biomarkers',
      'Enter your biomarker data manually.\n\nThis feature will allow you to input:\n• Blood test results\n• Health metrics\n• Lab values\n\nComing soon!',
      [{ text: 'OK' }]
    );
  };

  const handleBiomarkers = async () => {
    try {
      const scores = await WearableDataService.importAndCalculateScores();
      if (scores) {
        setHealthData(prev => ({
          ...prev,
          fitnessScore: scores.fitnessScore,
          systemicHealth: scores.systemicScore,
        }));
        
        Alert.alert(
          'Biomarkers Calculated',
          `Fitness Score: ${scores.fitnessScore}/100\nSystemic Health: ${scores.systemicScore}/100\n\n${scores.note || 'Scores calculated based on health data.'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate biomarker scores');
    }
  };

  const sendDataToWatch = async () => {
    if (!BLEService.isConnected()) {
      Alert.alert('Not Connected', 'Please connect to your watch first from the Watch tab.');
      return;
    }

    try {
      await BLEService.writeHealthData(
        healthData.praxiomAge || 0,
        healthData.oralHealth || 0,
        healthData.systemicHealth || 0,
        healthData.fitnessScore || 0
      );
      Alert.alert('Success', 'Health data sent to your Praxiom watch!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send data to watch. Make sure you are still connected.');
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255, 107, 53, 0.15)', 'rgba(0, 0, 0, 0.9)', 'rgba(0, 188, 212, 0.15)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Praxiom Age - Top Centered */}
        <View style={styles.bioAgeContainer}>
          <Text style={styles.bioAgeLabel}>Praxiom Age</Text>
          <Text style={styles.bioAgeValue}>
            {healthData.praxiomAge !== null ? healthData.praxiomAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.bioAgeUnit}>years</Text>
        </View>

        {/* Row 1: Oral Health | Systemic Health */}
        <View style={styles.row}>
          <View style={[styles.metricCard, styles.halfWidth]}>
            <Text style={styles.metricTitle}>Oral Health</Text>
            <Text style={styles.metricValue}>
              {healthData.oralHealth !== null ? healthData.oralHealth : '--'}
            </Text>
            <Text style={styles.metricUnit}>score</Text>
          </View>

          <View style={[styles.metricCard, styles.halfWidth]}>
            <Text style={styles.metricTitle}>Systemic Health</Text>
            <Text style={styles.metricValue}>
              {healthData.systemicHealth !== null ? healthData.systemicHealth : '--'}
            </Text>
            <Text style={styles.metricUnit}>score</Text>
          </View>
        </View>

        {/* Row 2: Fitness Score | Live Watch Data */}
        <View style={styles.row}>
          <View style={[styles.metricCardTeal, styles.fiftyFiveWidth]}>
            <Text style={styles.metricTitle}>Fitness Score</Text>
            <Text style={styles.metricValue}>
              {healthData.fitnessScore !== null ? healthData.fitnessScore : '--'}
            </Text>
            <Text style={styles.metricUnit}>level</Text>
          </View>

          <View style={[styles.watchDataCardSmall, styles.fortyFiveWidth]}>
            <Text style={styles.watchDataTitleSmall}>Live Watch</Text>
            <View style={styles.watchDataItemSmall}>
              <Text style={styles.watchDataLabelSmall}>Steps</Text>
              <Text style={styles.watchDataValueSmall}>{watchData.steps}</Text>
            </View>
            <View style={styles.watchDataItemSmall}>
              <Text style={styles.watchDataLabelSmall}>HR</Text>
              <Text style={styles.watchDataValueSmall}>{watchData.heartRate}</Text>
            </View>
            <View style={styles.watchDataItemSmall}>
              <Text style={styles.watchDataLabelSmall}>O₂</Text>
              <Text style={styles.watchDataValueSmall}>{watchData.o2Saturation}%</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Row 1: DNA Test | Input Biomarkers (side by side) */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.dnaButtonHalf} onPress={handleDNATest}>
              <Text style={styles.buttonText}>🧬 DNA Test</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.inputButtonHalf} onPress={handleInputBiomarkers}>
              <Text style={styles.buttonText}>📝 Input Biomarkers</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Calculate Biomarkers (full width) */}
          <TouchableOpacity style={styles.biomarkerButton} onPress={handleBiomarkers}>
            <Text style={styles.buttonText}>📊 Calculate Tier 1 Biomarkers</Text>
          </TouchableOpacity>

          {BLEService.isConnected() && (
            <TouchableOpacity style={styles.syncButton} onPress={sendDataToWatch}>
              <Text style={styles.buttonText}>📲 Send to Watch</Text>
            </TouchableOpacity>
          )}
        </View>

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
    alignItems: 'center',
  },
  bioAgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
    padding: 25,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.5)',
    width: '100%',
  },
  bioAgeLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  bioAgeValue: {
    color: '#00BCD4',
    fontSize: 56,
    fontWeight: 'bold',
  },
  bioAgeUnit: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  fiftyFiveWidth: {
    width: '53%',
  },
  fortyFiveWidth: {
    width: '45%',
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    alignItems: 'center',
  },
  metricCardTeal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 212, 0.3)',
    alignItems: 'center',
  },
  metricTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricValue: {
    color: '#FF6B35',
    fontSize: 42,
    fontWeight: 'bold',
  },
  metricUnit: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  watchDataCardSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 212, 0.4)',
  },
  watchDataTitleSmall: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  watchDataItemSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  watchDataLabelSmall: {
    color: '#aaa',
    fontSize: 11,
  },
  watchDataValueSmall: {
    color: '#00BCD4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dnaButtonHalf: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 25,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inputButtonHalf: {
    backgroundColor: '#9C27B0',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 25,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  biomarkerButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  syncButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
