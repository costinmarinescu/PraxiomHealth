/**
 * Tier1BiomarkerInputScreen.js
 * 
 * UPDATED VERSION - Added date picker matching Tier 2 style
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppContext } from '../AppContext';
import StorageService from '../services/StorageService';
import WearableService from '../services/WearableService';

export default function Tier1BiomarkerInputScreen({ navigation }) {
  const { state, dispatch } = useContext(AppContext);
  
  // Date selection - NEW
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [biomarkers, setBiomarkers] = useState({
    salivaryPH: '',
    mmp8: '',
    flowRate: '',
    hsCRP: '',
    omega3Index: '',
    hba1c: '',
    gdf15: '',
    vitaminD: '',
    hrvManual: '',
  });

  const [hrvWearable, setHrvWearable] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Load HRV from wearable service
  useEffect(() => {
    const interval = setInterval(() => {
      const data = WearableService.getLatestData();
      if (data.hrv && data.hrv > 0) {
        setHrvWearable(data.hrv);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Date picker handler - NEW
  const onDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        setShowDatePicker(false);
      } else if (event.type === 'dismissed') {
        setShowDatePicker(false);
      }
    } else {
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setBiomarkers(prev => ({ ...prev, [field]: value }));
  };

  const validateInputs = () => {
    console.log('🔍 Validating inputs...');
    console.log('Current biomarkers:', biomarkers);
    
    // Check all fields are filled
    for (const [key, value] of Object.entries(biomarkers)) {
      // Skip hrvManual as it's optional
      if (key === 'hrvManual') continue;
      
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
      hrvManual: 'HRV Manual',
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

      // Save to history with timestamp and date
      console.log('💾 Saving to history...');
      const historyEntry = {
        date: new Date().toISOString(),
        assessmentDate: selectedDate.toISOString(), // NEW: Store the assessment date
        dateEntered: selectedDate.toLocaleDateString(), // NEW: Formatted date
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

      // Send Bio-Age to watch if connected
      console.log('⌚ Checking watch connection...');
      const watchStatus = WearableService.getConnectionStatus();
      if (watchStatus.isConnected) {
        try {
          console.log('📤 Sending Bio-Age to watch...');
          await WearableService.sendBioAge(biologicalAge);
          console.log('✅ Bio-Age sent to watch');
        } catch (error) {
          console.error('❌ Failed to send to watch:', error);
          // Don't block on watch failure
        }
      } else {
        console.log('⚠️ Watch not connected, skipping transmission');
      }

      setIsCalculating(false);

      // Show success message
      Alert.alert(
        '✅ Calculation Complete!',
        `Your Praxiom Age is ${praxiomAge} years\n\nOral Health Score: ${oralHealthScore.toFixed(1)}%\nSystemic Health Score: ${systemicHealthScore.toFixed(1)}%\n\nAssessment Date: ${selectedDate.toLocaleDateString()}`,
        [
          {
            text: 'View History',
            onPress: () => navigation.navigate('BiomarkerHistory')
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error in continueCalculation:', error);
      Alert.alert('Error', 'Failed to complete calculation');
      setIsCalculating(false);
    }
  };

  // Scoring functions (using original precise formulas)
  const calculatePHScore = (ph) => {
    if (ph >= 6.5 && ph <= 7.2) return 100;
    if (ph < 6.0 || ph > 7.5) return 0;
    if (ph < 6.5) return 50 + (ph - 6.0) * 100;
    return 100 - (ph - 7.2) * 166.67;
  };

  const calculateMMP8Score = (mmp8) => {
    if (mmp8 <= 60) return 100;
    if (mmp8 >= 200) return 0;
    return 100 - ((mmp8 - 60) / 140) * 100;
  };

  const calculateFlowRateScore = (flowRate) => {
    if (flowRate >= 1.5) return 100;
    if (flowRate <= 0.5) return 0;
    return ((flowRate - 0.5) / 1.0) * 100;
  };

  const calculateCRPScore = (crp) => {
    if (crp <= 1.0) return 100;
    if (crp >= 10) return 0;
    return 100 - ((crp - 1.0) / 9.0) * 100;
  };

  const calculateOmega3Score = (omega3) => {
    if (omega3 >= 8.0) return 100;
    if (omega3 <= 4.0) return 0;
    return ((omega3 - 4.0) / 4.0) * 100;
  };

  const calculateHbA1cScore = (hba1c) => {
    if (hba1c <= 5.7) return 100;
    if (hba1c >= 6.5) return 0;
    return 100 - ((hba1c - 5.7) / 0.8) * 100;
  };

  const calculateGDF15Score = (gdf15) => {
    if (gdf15 <= 1200) return 100;
    if (gdf15 >= 2500) return 0;
    return 100 - ((gdf15 - 1200) / 1300) * 100;
  };

  const calculateVitaminDScore = (vitaminD) => {
    if (vitaminD >= 30) return 100;
    if (vitaminD <= 10) return 0;
    return ((vitaminD - 10) / 20) * 100;
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
        <Text style={styles.title}>Tier 1 Foundation Assessment</Text>

        {/* Date Selection Section - NEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Assessment Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#00CFC1" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.doneDateButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.doneDateButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Oral Health Markers Section */}
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

        {/* Systemic Health Markers Section */}
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

        {/* HRV Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HRV - Heart Rate Variability</Text>
          
          {/* HRV from Wearable (Auto-populated, Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>HRV from Connected Watch (ms)</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              {hrvWearable ? (
                <Text style={styles.readOnlyText}>
                  {hrvWearable.toFixed(1)} ms {hrvWearable >= 70 ? '✅' : hrvWearable >= 50 ? '⚠️' : '❌'}
                </Text>
              ) : (
                <Text style={styles.placeholderText}>
                  Connect watch to see HRV data
                </Text>
              )}
            </View>
            <Text style={styles.helpText}>
              Automatically populated from wearable | Optimal: ≥70 ms | Good: ≥50 ms
            </Text>
          </View>

          {/* Manual HRV Input (For doctor-provided values) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Manual HRV Input (ms) - Optional</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter HRV if measured separately (e.g., 65.3)"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={biomarkers.hrvManual}
              onChangeText={(value) => handleInputChange('hrvManual', value)}
            />
            <Text style={styles.helpText}>
              Use this field if HRV was measured by a doctor or external device.
              {hrvWearable && biomarkers.hrvManual && '\n⚠️ Both values present - manual value will be used.'}
            </Text>
          </View>
        </View>

        {/* Calculate Button */}
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
  // Date picker styles - NEW
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00CFC1',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontWeight: '600',
  },
  doneDateButton: {
    backgroundColor: '#00CFC1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  doneDateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
