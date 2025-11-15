/**
 * Tier1BiomarkerInputScreen.js
 * 
 * Enhanced with automatic Praxiom Age transmission to watch
 * 
 * CHANGES:
 * - Imports WearableService
 * - Calls sendPraxiomAgeToWatch() after successful calculation
 * - Shows confirmation when data is sent to watch
 */

import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../AppContext';
import StorageService from '../services/StorageService';
import WearableService from '../services/WearableService';  // 🆕 ADDED

export default function Tier1BiomarkerInputScreen({ navigation }) {
  const { state, dispatch } = useContext(AppContext);
  
  const [biomarkers, setBiomarkers] = useState({
    salivaryPH: '',
    mmp8: '',
    flowRate: '',
    hsCRP: '',
    omega3Index: '',
    hba1c: '',
    gdf15: '',
    vitaminD: '',
  });

  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field, value) => {
    setBiomarkers(prev => ({ ...prev, [field]: value }));
  };

  const validateInputs = () => {
    // Check all fields are filled
    for (const [key, value] of Object.entries(biomarkers)) {
      if (!value || value.trim() === '') {
        Alert.alert('Missing Data', `Please enter ${getFieldLabel(key)}`);
        return false;
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        Alert.alert('Invalid Data', `${getFieldLabel(key)} must be a number`);
        return false;
      }
    }
    
    return true;
  };

  const getFieldLabel = (field) => {
    const labels = {
      salivaryPH: 'Salivary pH',
      mmp8: 'MMP-8',
      flowRate: 'Flow Rate',
      hsCRP: 'hs-CRP',
      omega3Index: 'Omega-3 Index',
      hba1c: 'HbA1c',
      gdf15: 'GDF-15',
      vitaminD: 'Vitamin D',
    };
    return labels[field] || field;
  };

  const calculatePraxiomAge = async () => {
    if (!validateInputs()) return;

    setIsCalculating(true);

    try {
      // Convert to numbers
      const values = {
        salivaryPH: parseFloat(biomarkers.salivaryPH),
        mmp8: parseFloat(biomarkers.mmp8),
        flowRate: parseFloat(biomarkers.flowRate),
        hsCRP: parseFloat(biomarkers.hsCRP),
        omega3Index: parseFloat(biomarkers.omega3Index),
        hba1c: parseFloat(biomarkers.hba1c),
        gdf15: parseFloat(biomarkers.gdf15),
        vitaminD: parseFloat(biomarkers.vitaminD),
      };

      // Calculate Oral Health Score (0-100)
      const phScore = calculatePHScore(values.salivaryPH);
      const mmp8Score = calculateMMP8Score(values.mmp8);
      const flowScore = calculateFlowRateScore(values.flowRate);
      const oralHealthScore = (phScore + mmp8Score + flowScore) / 3;

      // Calculate Systemic Health Score (0-100)
      const crpScore = calculateCRPScore(values.hsCRP);
      const omega3Score = calculateOmega3Score(values.omega3Index);
      const hba1cScore = calculateHbA1cScore(values.hba1c);
      const gdf15Score = calculateGDF15Score(values.gdf15);
      const vitaminDScore = calculateVitaminDScore(values.vitaminD);
      const systemicHealthScore = (crpScore + omega3Score + hba1cScore + gdf15Score + vitaminDScore) / 5;

      // Get age-stratified coefficients
      const age = state.chronologicalAge || 45; // Use stored age or default
      const coefficients = getAgeStratifiedCoefficients(age);

      // Calculate Biological Age deviation
      const oralDeviation = (100 - oralHealthScore) * coefficients.alpha;
      const systemicDeviation = (100 - systemicHealthScore) * coefficients.beta;
      const totalDeviation = oralDeviation + systemicDeviation;
      
      const biologicalAge = age + totalDeviation;
      const praxiomAge = Math.round(biologicalAge);

      console.log('=== CALCULATION RESULTS ===');
      console.log('Oral Health Score:', oralHealthScore.toFixed(1));
      console.log('Systemic Health Score:', systemicHealthScore.toFixed(1));
      console.log('Biological Age:', praxiomAge);

      // Save to history with timestamp
      const historyEntry = {
        date: new Date().toISOString(),
        tier: 'Tier 1',
        biomarkers: values,
        oralHealthScore,
        systemicHealthScore,
        biologicalAge: praxiomAge,
      };
      
      await StorageService.saveBiomarkerEntry(historyEntry);

      // Update AppContext
      dispatch({
        type: 'UPDATE_HEALTH_DATA',
        payload: {
          praxiomAge,
          oralHealthScore,
          systemicHealthScore,
          lastBiomarkerUpdate: new Date().toISOString(),
        },
      });

      // 🆕 AUTOMATICALLY SEND TO WATCH
      console.log('📤 Attempting to send Praxiom Age to watch...');
      if (WearableService.isConnected()) {
        const success = await WearableService.sendPraxiomAgeToWatch(praxiomAge);
        
        if (success) {
          Alert.alert(
            '✅ Success!',
            `Praxiom Age: ${praxiomAge}\n\n` +
            `Oral Health: ${oralHealthScore.toFixed(1)}%\n` +
            `Systemic Health: ${systemicHealthScore.toFixed(1)}%\n\n` +
            `✅ Sent to your watch!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert(
            '⚠️ Partial Success',
            `Praxiom Age: ${praxiomAge}\n\n` +
            `Oral Health: ${oralHealthScore.toFixed(1)}%\n` +
            `Systemic Health: ${systemicHealthScore.toFixed(1)}%\n\n` +
            `⚠️ Could not send to watch (not connected)`,
            [
              { text: 'OK', onPress: () => navigation.goBack() },
              { 
                text: 'Connect Watch', 
                onPress: () => navigation.navigate('Watch')
              }
            ]
          );
        }
      } else {
        // Watch not connected - still save data but inform user
        Alert.alert(
          '✅ Calculated!',
          `Praxiom Age: ${praxiomAge}\n\n` +
          `Oral Health: ${oralHealthScore.toFixed(1)}%\n` +
          `Systemic Health: ${systemicHealthScore.toFixed(1)}%\n\n` +
          `💡 Connect your watch to sync this value`,
          [
            { text: 'OK', onPress: () => navigation.goBack() },
            { 
              text: 'Connect Watch', 
              onPress: () => navigation.navigate('Watch')
            }
          ]
        );
      }

    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Error', 'Failed to calculate Praxiom Age. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Scoring functions (0-100 scale)
  const calculatePHScore = (ph) => {
    const optimal = 7.0;
    const deviation = Math.abs(ph - optimal);
    return Math.max(0, 100 - (deviation * 20));
  };

  const calculateMMP8Score = (mmp8) => {
    if (mmp8 < 60) return 100;
    if (mmp8 > 100) return 0;
    return 100 - ((mmp8 - 60) / 40) * 100;
  };

  const calculateFlowRateScore = (flow) => {
    if (flow > 1.5) return 100;
    if (flow < 0.5) return 0;
    return ((flow - 0.5) / 1.0) * 100;
  };

  const calculateCRPScore = (crp) => {
    if (crp < 1.0) return 100;
    if (crp > 10.0) return 0;
    return 100 - ((crp - 1.0) / 9.0) * 100;
  };

  const calculateOmega3Score = (omega3) => {
    if (omega3 > 8.0) return 100;
    if (omega3 < 4.0) return 0;
    return ((omega3 - 4.0) / 4.0) * 100;
  };

  const calculateHbA1cScore = (hba1c) => {
    if (hba1c < 5.7) return 100;
    if (hba1c > 7.0) return 0;
    return 100 - ((hba1c - 5.7) / 1.3) * 100;
  };

  const calculateGDF15Score = (gdf15) => {
    if (gdf15 < 1200) return 100;
    if (gdf15 > 1800) return 0;
    return 100 - ((gdf15 - 1200) / 600) * 100;
  };

  const calculateVitaminDScore = (vitD) => {
    if (vitD > 30) return 100;
    if (vitD < 20) return 0;
    return ((vitD - 20) / 10) * 100;
  };

  const getAgeStratifiedCoefficients = (age) => {
    if (age < 40) return { alpha: 0.15, beta: 0.20 };
    if (age < 50) return { alpha: 0.18, beta: 0.22 };
    if (age < 60) return { alpha: 0.20, beta: 0.25 };
    if (age < 70) return { alpha: 0.22, beta: 0.28 };
    return { alpha: 0.25, beta: 0.30 };
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tier 1: Foundation Biomarkers</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oral Health Markers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary pH</Text>
            <TextInput
              style={styles.input}
              placeholder="6.5 - 7.2 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.salivaryPH}
              onChangeText={(value) => handleInputChange('salivaryPH', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MMP-8 (ng/mL)</Text>
            <TextInput
              style={styles.input}
              placeholder="<60 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.mmp8}
              onChangeText={(value) => handleInputChange('mmp8', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary Flow Rate (mL/min)</Text>
            <TextInput
              style={styles.input}
              placeholder=">1.5 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.flowRate}
              onChangeText={(value) => handleInputChange('flowRate', value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Systemic Health Markers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>hs-CRP (mg/L)</Text>
            <TextInput
              style={styles.input}
              placeholder="<1.0 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.hsCRP}
              onChangeText={(value) => handleInputChange('hsCRP', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Omega-3 Index (%)</Text>
            <TextInput
              style={styles.input}
              placeholder=">8.0 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.omega3Index}
              onChangeText={(value) => handleInputChange('omega3Index', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>HbA1c (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="<5.7 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.hba1c}
              onChangeText={(value) => handleInputChange('hba1c', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GDF-15 (pg/mL)</Text>
            <TextInput
              style={styles.input}
              placeholder="<1200 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.gdf15}
              onChangeText={(value) => handleInputChange('gdf15', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vitamin D (ng/mL)</Text>
            <TextInput
              style={styles.input}
              placeholder=">30 (optimal)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.vitaminD}
              onChangeText={(value) => handleInputChange('vitaminD', value)}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.calculateButton, isCalculating && styles.calculateButtonDisabled]}
          onPress={calculatePraxiomAge}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Praxiom Age</Text>
          )}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00CFC1',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  calculateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
