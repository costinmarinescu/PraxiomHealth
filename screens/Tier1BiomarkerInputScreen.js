/**
 * Tier1BiomarkerInputScreen.js
 * 
 * FIXED VERSION with detailed error logging and validation
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
import WearableService from '../services/WearableService';

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

  // ✅ FIX #1: Add HRV from wearable data
  const [hrvValue, setHrvValue] = useState(null);

  const [isCalculating, setIsCalculating] = useState(false);

  // ✅ FIX #1: Load HRV from wearable service
  useEffect(() => {
    const interval = setInterval(() => {
      const data = WearableService.getLatestData();
      if (data.hrv && data.hrv > 0) {
        setHrvValue(data.hrv);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (field, value) => {
    setBiomarkers(prev => ({ ...prev, [field]: value }));
  };

  const validateInputs = () => {
    console.log('🔍 Validating inputs...');
    console.log('Current biomarkers:', biomarkers);
    
    // Check all fields are filled
    for (const [key, value] of Object.entries(biomarkers)) {
      if (!value || value.trim() === '') {
        const label = getFieldLabel(key);
        console.log(`❌ Validation failed: ${label} is empty`);
        Alert.alert('Missing Data', `Please enter ${label}`);
        return false;
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        const label = getFieldLabel(key);
        console.log(`❌ Validation failed: ${label} is not a number`);
        Alert.alert('Invalid Data', `${label} must be a number`);
        return false;
      }
    }
    
    console.log('✅ All inputs validated');
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
    console.log('📊 Starting Praxiom Age calculation...');
    
    if (!validateInputs()) {
      console.log('❌ Validation failed, aborting calculation');
      return;
    }

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

      console.log('📝 Parsed biomarker values:', values);

      // Calculate Oral Health Score (0-100)
      console.log('🦷 Calculating Oral Health Score...');
      const phScore = calculatePHScore(values.salivaryPH);
      const mmp8Score = calculateMMP8Score(values.mmp8);
      const flowScore = calculateFlowRateScore(values.flowRate);
      const oralHealthScore = (phScore + mmp8Score + flowScore) / 3;
      
      console.log(`  pH Score: ${phScore.toFixed(1)}`);
      console.log(`  MMP-8 Score: ${mmp8Score.toFixed(1)}`);
      console.log(`  Flow Score: ${flowScore.toFixed(1)}`);
      console.log(`  → Oral Health Score: ${oralHealthScore.toFixed(1)}%`);

      // Calculate Systemic Health Score (0-100)
      console.log('💉 Calculating Systemic Health Score...');
      const crpScore = calculateCRPScore(values.hsCRP);
      const omega3Score = calculateOmega3Score(values.omega3Index);
      const hba1cScore = calculateHbA1cScore(values.hba1c);
      const gdf15Score = calculateGDF15Score(values.gdf15);
      const vitaminDScore = calculateVitaminDScore(values.vitaminD);
      const systemicHealthScore = (crpScore + omega3Score + hba1cScore + gdf15Score + vitaminDScore) / 5;
      
      console.log(`  CRP Score: ${crpScore.toFixed(1)}`);
      console.log(`  Omega-3 Score: ${omega3Score.toFixed(1)}`);
      console.log(`  HbA1c Score: ${hba1cScore.toFixed(1)}`);
      console.log(`  GDF-15 Score: ${gdf15Score.toFixed(1)}`);
      console.log(`  Vitamin D Score: ${vitaminDScore.toFixed(1)}`);
      console.log(`  → Systemic Health Score: ${systemicHealthScore.toFixed(1)}%`);

      // Get chronological age
      let chronologicalAge = state.chronologicalAge;
      
      // If no chronological age is set, ask user
      if (!chronologicalAge) {
        console.log('⚠️ No chronological age found in state');
        Alert.alert(
          'Age Required',
          'Please enter your age to calculate Praxiom Age',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setIsCalculating(false);
              }
            },
            {
              text: 'Enter Age',
              onPress: () => {
                // For now, use a default - in production, navigate to profile
                chronologicalAge = 45;
                console.log(`Using default age: ${chronologicalAge}`);
                continueCalculation(values, oralHealthScore, systemicHealthScore, chronologicalAge);
              }
            }
          ]
        );
        return;
      }

      continueCalculation(values, oralHealthScore, systemicHealthScore, chronologicalAge);

    } catch (error) {
      console.error('❌ Calculation error:', error);
      console.error('Error stack:', error.stack);
      Alert.alert(
        'Calculation Error',
        `Failed to calculate Praxiom Age.\n\nError: ${error.message}\n\nPlease check the console for details.`
      );
      setIsCalculating(false);
    }
  };

  const continueCalculation = async (values, oralHealthScore, systemicHealthScore, chronologicalAge) => {
    try {
      console.log(`🎂 Chronological Age: ${chronologicalAge}`);

      // Get age-stratified coefficients
      const coefficients = getAgeStratifiedCoefficients(chronologicalAge);
      console.log(`📐 Age coefficients: α=${coefficients.alpha}, β=${coefficients.beta}`);

      // Calculate Biological Age deviation
      const oralDeviation = (100 - oralHealthScore) * coefficients.alpha;
      const systemicDeviation = (100 - systemicHealthScore) * coefficients.beta;
      const totalDeviation = oralDeviation + systemicDeviation;
      
      console.log(`📊 Deviations:`);
      console.log(`  Oral: ${oralDeviation.toFixed(2)} years`);
      console.log(`  Systemic: ${systemicDeviation.toFixed(2)} years`);
      console.log(`  Total: ${totalDeviation.toFixed(2)} years`);
      
      const biologicalAge = chronologicalAge + totalDeviation;
      const praxiomAge = Math.round(biologicalAge);

      console.log('=== FINAL RESULTS ===');
      console.log(`Chronological Age: ${chronologicalAge}`);
      console.log(`Oral Health Score: ${oralHealthScore.toFixed(1)}%`);
      console.log(`Systemic Health Score: ${systemicHealthScore.toFixed(1)}%`);
      console.log(`Biological Age: ${biologicalAge.toFixed(1)}`);
      console.log(`Praxiom Age (rounded): ${praxiomAge}`);
      console.log('=====================');

      // Save to history with timestamp
      console.log('💾 Saving to history...');
      const historyEntry = {
        date: new Date().toISOString(),
        tier: 'Tier 1',
        biomarkers: values,
        oralHealthScore,
        systemicHealthScore,
        biologicalAge: praxiomAge,
        chronologicalAge: chronologicalAge,
      };
      
      await StorageService.saveBiomarkerEntry(historyEntry);
      console.log('✅ Saved to history');

      // Update AppContext
      console.log('📱 Updating app context...');
      dispatch({
        type: 'UPDATE_HEALTH_DATA',
        payload: {
          praxiomAge,
          oralHealthScore,
          systemicHealthScore,
          lastBiomarkerUpdate: new Date().toISOString(),
        },
      });
      console.log('✅ App context updated');

      // Send to watch
      console.log('⌚ Attempting to send to watch...');
      if (WearableService.isConnected()) {
        console.log('✅ Watch is connected, sending data...');
        const success = await WearableService.sendPraxiomAgeToWatch(praxiomAge);
        
        if (success) {
          console.log('✅ Successfully sent to watch!');
          Alert.alert(
            '✅ Success!',
            `Praxiom Age: ${praxiomAge}\n\n` +
            `Oral Health: ${oralHealthScore.toFixed(1)}%\n` +
            `Systemic Health: ${systemicHealthScore.toFixed(1)}%\n\n` +
            `✅ Sent to your watch!\n\n` +
            `👀 Check your watch - it should display: ${praxiomAge}`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          console.log('⚠️ Failed to send to watch');
          Alert.alert(
            '⚠️ Partial Success',
            `Praxiom Age: ${praxiomAge}\n\n` +
            `Oral Health: ${oralHealthScore.toFixed(1)}%\n` +
            `Systemic Health: ${systemicHealthScore.toFixed(1)}%\n\n` +
            `⚠️ Could not send to watch\n` +
            `Data saved successfully but watch communication failed.`,
            [
              { text: 'OK', onPress: () => navigation.goBack() },
              { 
                text: 'Retry Watch Sync', 
                onPress: async () => {
                  const retry = await WearableService.sendPraxiomAgeToWatch(praxiomAge);
                  if (retry) {
                    Alert.alert('✅ Success!', 'Data sent to watch!');
                  }
                }
              }
            ]
          );
        }
      } else {
        console.log('⚠️ Watch not connected');
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
      console.error('❌ Error in continueCalculation:', error);
      console.error('Error stack:', error.stack);
      Alert.alert(
        'Error',
        `Failed in final calculation steps.\n\nError: ${error.message}`
      );
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

        {/* ✅ FIX #1: HRV Display from Wearable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wearable Data (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>HRV - Heart Rate Variability (ms)</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              {hrvValue ? (
                <Text style={styles.readOnlyText}>
                  {hrvValue.toFixed(1)} ms {hrvValue >= 70 ? '✅' : hrvValue >= 50 ? '⚠️' : '⚠️'}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>
                  Connect watch to see HRV data
                </Text>
              )}
            </View>
            <Text style={styles.helpText}>
              Optimal: ≥70 ms | Good: ≥50 ms
            </Text>
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

        <Text style={styles.debugNote}>
          💡 Check the console (developer tools) for detailed calculation logs
        </Text>
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
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  calculateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  debugNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 40,
  },
});
