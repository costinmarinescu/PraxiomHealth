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
          `Using sample data for demonstration:\n\nFitness Score: ${scores.fitnessScore}/100\nSystemic Health: ${scores.systemicScore}/100\n\n${scores.note || 'Connect your Praxiom watch or add native health module integrations for real-time data.'}`,
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
      colors={['rgba(255, 107, 53, 0.3)', 'rgba(0, 0, 0, 0.9)', 'rgba(0, 188, 212, 0.3)']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Watch Data Section */}
        <View style={styles.watchDataContainer}>
          <Text style={styles.sectionTitle}>Live Watch Data</Text>
          <View style={styles.watchDataRow}>
            <View style={styles.watchDataItem}>
              <Text style={styles.watchDataLabel}>Steps</Text>
              <Text style={styles.watchDataValue}>{watchData.steps}</Text>
            </View>
            <View style={styles.watchDataItem}>
              <Text style={styles.watchDataLabel}>Heart Rate</Text>
              <Text style={styles.watchDataValue}>{watchData.heartRate}</Text>
              <Text style={styles.watchDataUnit}>bpm</Text>
            </View>
            <View style={styles.watchDataItem}>
              <Text style={styles.watchDataLabel}>O₂ Sat</Text>
              <Text style={styles.watchDataValue}>{watchData.o2Saturation}</Text>
              <Text style={styles.watchDataUnit}>%</Text>
            </View>
          </View>
        </View>

        {/* Health Metrics */}
        <View style={styles.metricsContainer}>
          {/* Oral Health */}
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Oral Health</Text>
            <Text style={styles.metricValue}>
              {healthData.oralHealth !== null ? healthData.oralHealth : '--'}
            </Text>
            <Text style={styles.metricUnit}>score</Text>
          </View>

          {/* Systemic Health */}
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Systemic Health</Text>
            <Text style={styles.metricValue}>
              {healthData.systemicHealth !== null ? healthData.systemicHealth : '--'}
            </Text>
            <Text style={styles.metricUnit}>score</Text>
          </View>

          {/* Fitness Score */}
          <View style={styles.metricCardCenter}>
            <Text style={styles.metricTitle}>Fitness Score</Text>
            <Text style={styles.metricValue}>
              {healthData.fitnessScore !== null ? healthData.fitnessScore : '--'}
            </Text>
            <Text style={styles.metricUnit}>level</Text>
          </View>
        </View>

        {/* Bio Age Display */}
        <View style={styles.bioAgeContainer}>
          <Text style={styles.bioAgeLabel}>Praxiom Age</Text>
          <Text style={styles.bioAgeValue}>
            {healthData.praxiomAge !== null ? healthData.praxiomAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.bioAgeUnit}>years</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.dnaButton} onPress={handleDNATest}>
            <Text style={styles.buttonText}>🧬 Start DNA Methylation Test</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.biomarkerButton} onPress={handleBiomarkers}>
            <Text style={styles.buttonText}>📊 Calculate Biomarker Scores</Text>
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
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  watchDataContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 212, 0.4)',
  },
  watchDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  watchDataItem: {
    alignItems: 'center',
  },
  watchDataLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 5,
  },
  watchDataValue: {
    color: '#00BCD4',
    fontSize: 28,
    fontWeight: 'bold',
  },
  watchDataUnit: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  metricsContainer: {
    width: '100%',
    marginTop: 10,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  metricCardCenter: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'rgba(0, 188, 212, 0.3)',
    alignItems: 'center',
  },
  metricTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  metricValue: {
    color: '#FF6B35',
    fontSize: 48,
    fontWeight: 'bold',
  },
  metricUnit: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  bioAgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 30,
    padding: 30,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.5)',
    width: '100%',
  },
  bioAgeLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  bioAgeValue: {
    color: '#00BCD4',
    fontSize: 64,
    fontWeight: 'bold',
  },
  bioAgeUnit: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 5,
  },
  actionButtonsContainer: {
    width: '100%',
    marginTop: 30,
    marginBottom: 20,
  },
  dnaButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#FF6B35',
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
    marginBottom: 15,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});
