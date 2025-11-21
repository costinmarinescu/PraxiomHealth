import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStorage from '../services/SecureStorageService';
import { AppContext } from '../AppContext';

export default function Tier1BiomarkerInputScreen({ navigation }) {
  const context = useContext(AppContext);
  
  if (!context) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text>Loading...</Text>
      </View>
    );
  }

  const { state, updateState, calculateBiologicalAge } = context;
  const [isCalculating, setIsCalculating] = useState(false);
  
  // ✅ FIX: Simple date inputs
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  
  const [formData, setFormData] = useState({
    salivaryPH: '',
    activeMMP8: '',
    salivaryFlow: '',
    hsCRP: '',
    omega3Index: '',
    hba1c: '',
    gdf15: '',
    vitaminD: '',
    hrvValue: ''
  });

  useEffect(() => {
    // Set today's date as default
    const today = new Date();
    setYear(today.getFullYear().toString());
    setMonth((today.getMonth() + 1).toString());
    setDay(today.getDate().toString());
    
    if (state?.wearableData?.hrv) {
      setFormData(prev => ({ ...prev, hrvValue: String(state.wearableData.hrv) }));
    }
  }, [state?.wearableData?.hrv]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateInputs = () => {
    const errors = [];
    
    const requiredFields = {
      salivaryPH: 'Salivary pH',
      activeMMP8: 'Active MMP-8',
      salivaryFlow: 'Salivary Flow Rate',
      hsCRP: 'hs-CRP',
      omega3Index: 'Omega-3 Index',
      hba1c: 'HbA1c',
      gdf15: 'GDF-15',
      vitaminD: 'Vitamin D'
    };
    
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field] || formData[field].trim() === '') {
        errors.push(`${label} is required`);
      }
    }
    
    if (errors.length > 0) {
      Alert.alert('Missing Data', errors.join('\n'));
      return false;
    }
    
    const validations = {
      salivaryPH: { min: 5.0, max: 9.0, name: 'Salivary pH' },
      activeMMP8: { min: 0, max: 500, name: 'Active MMP-8' },
      salivaryFlow: { min: 0, max: 10, name: 'Salivary Flow' },
      hsCRP: { min: 0, max: 50, name: 'hs-CRP' },
      omega3Index: { min: 0, max: 20, name: 'Omega-3 Index' },
      hba1c: { min: 4.0, max: 15.0, name: 'HbA1c' },
      gdf15: { min: 0, max: 10000, name: 'GDF-15' },
      vitaminD: { min: 0, max: 200, name: 'Vitamin D' }
    };
    
    for (const [field, { min, max, name }] of Object.entries(validations)) {
      const value = parseFloat(formData[field]);
      if (isNaN(value)) {
        errors.push(`${name} must be a valid number`);
      } else if (value < min || value > max) {
        errors.push(`${name} must be between ${min} and ${max}`);
      }
    }
    
    if (errors.length > 0) {
      Alert.alert('Invalid Data', errors.join('\n'));
      return false;
    }
    
    return true;
  };

  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      
      if (!state?.profile?.birthdate) {
        Alert.alert(
          'Profile Incomplete',
          'Please set your birthdate in Settings before calculating Praxiom Age.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => {
              try {
                navigation.navigate('Settings', { screen: 'SettingsHome' });
              } catch (e) {
                navigation.navigate('Settings');
              }
            }}
          ]
        );
        setIsCalculating(false);
        return;
      }
      
      if (!validateInputs()) {
        setIsCalculating(false);
        return;
      }
      
      console.log('✅ Starting Tier 1 calculation...');
      
      // Create assessment date
      const assessmentDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      
      // ✅ FIX: Save to history BEFORE calculation
      const tier1Entry = {
        salivaryPH: parseFloat(formData.salivaryPH),
        activeMMP8: parseFloat(formData.activeMMP8),
        salivaryFlow: parseFloat(formData.salivaryFlow),
        hsCRP: parseFloat(formData.hsCRP),
        omega3Index: parseFloat(formData.omega3Index),
        hba1c: parseFloat(formData.hba1c),
        gdf15: parseFloat(formData.gdf15),
        vitaminD: parseFloat(formData.vitaminD),
        hrvValue: formData.hrvValue ? parseFloat(formData.hrvValue) : null,
        timestamp: assessmentDate.toISOString(),
        dateEntered: assessmentDate.toLocaleDateString(),
        tier: 1,
      };

      try {
        // ✅ SECURITY FIX: Use encrypted storage for medical data
        const existingData = await SecureStorage.getItem('tier1Biomarkers');
        const tier1Array = existingData ? existingData : [];
        tier1Array.push(tier1Entry);
        await SecureStorage.setItem('tier1Biomarkers', tier1Array);
        console.log('✅ Tier 1 data saved to encrypted history');
      } catch (error) {
        console.error('Error saving to history:', error);
      }
      
      // Update state
      try {
        await updateState({
          salivaryPH: parseFloat(formData.salivaryPH),
          mmp8: parseFloat(formData.activeMMP8),
          flowRate: parseFloat(formData.salivaryFlow),
          hsCRP: parseFloat(formData.hsCRP),
          omega3Index: parseFloat(formData.omega3Index),
          hba1c: parseFloat(formData.hba1c),
          gdf15: parseFloat(formData.gdf15),
          vitaminD: parseFloat(formData.vitaminD),
          hrv: formData.hrvValue ? parseFloat(formData.hrvValue) : null,
        });
      } catch (error) {
        console.error('Error updating state:', error);
        throw new Error('Failed to save biomarkers');
      }
      
      console.log('✅ Biomarkers updated in state');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      let biologicalAge;
      try {
        biologicalAge = calculateBiologicalAge();
      } catch (error) {
        console.error('Error calculating biological age:', error);
        throw new Error('Failed to calculate biological age');
      }
      
      console.log('✅ Scores calculated, biological age:', biologicalAge);
      
      const oralScore = state?.oralHealthScore || 50;
      const systemicScore = state?.systemicHealthScore || 50;
      const vitalityIndex = state?.vitalityIndex || 50;
      const chronologicalAge = state?.chronologicalAge || 0;
      
      const deviation = parseFloat((biologicalAge - chronologicalAge).toFixed(1));
      
      Alert.alert(
        'Praxiom Age Calculated! ✅',
        `Your Biological Age: ${biologicalAge.toFixed(1)} years\n` +
        `Chronological Age: ${chronologicalAge} years\n` +
        `Deviation: ${deviation > 0 ? '+' : ''}${deviation} years\n\n` +
        `Oral Health Score: ${oralScore}%\n` +
        `Systemic Health Score: ${systemicScore}%\n` +
        `Vitality Index: ${vitalityIndex}%\n\n` +
        `${getRecommendation(oralScore, systemicScore)}`,
        [
          { 
            text: 'View Dashboard', 
            onPress: () => {
              try {
                navigation.navigate('DashboardHome');
              } catch (e) {
                navigation.navigate('Dashboard');
              }
            }
          },
          { 
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
      
      console.log('✅ Tier 1 calculation complete!');
      
      // Clear form
      setFormData({
        salivaryPH: '',
        activeMMP8: '',
        salivaryFlow: '',
        hsCRP: '',
        omega3Index: '',
        hba1c: '',
        gdf15: '',
        vitaminD: '',
        hrvValue: state?.wearableData?.hrv ? String(state.wearableData.hrv) : ''
      });
      
    } catch (error) {
      console.error('❌ Calculation error:', error);
      Alert.alert(
        'Calculation Error',
        `Failed to complete calculation.\n\nError: ${error.message}\n\nPlease check all values and try again.`
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const getRecommendation = (oralScore, systemicScore) => {
    if (oralScore < 75 || systemicScore < 75) {
      return '⚠️ Some scores are below target. Consider upgrading to Tier 2 for personalized interventions.';
    }
    if (oralScore >= 85 && systemicScore >= 85) {
      return '✅ Excellent scores! Continue current protocol and monitor regularly.';
    }
    return '📊 Good progress. Continue lifestyle optimizations to reach target scores.';
  };

  return (
    <LinearGradient colors={['#FF6B00', '#00CFC1']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Tier 1: Foundation</Text>
          <Text style={styles.subtitle}>Core Biomarker Assessment</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Assessment Date</Text>
          <View style={styles.dateInputContainer}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Year</Text>
              <TextInput
                style={styles.dateInput}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                placeholder="2025"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={4}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Month</Text>
              <TextInput
                style={styles.dateInput}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                placeholder="11"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={2}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>Day</Text>
              <TextInput
                style={styles.dateInput}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                placeholder="18"
                placeholderTextColor="rgba(255,255,255,0.5)"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🦷 Oral Health Biomarkers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary pH (6.5-7.2 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.salivaryPH}
              onChangeText={(value) => updateField('salivaryPH', value)}
              keyboardType="decimal-pad"
              placeholder="7.0"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Active MMP-8 (ng/mL, {'<'}60 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.activeMMP8}
              onChangeText={(value) => updateField('activeMMP8', value)}
              keyboardType="decimal-pad"
              placeholder="50"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary Flow (mL/min, {'>'}1.5 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.salivaryFlow}
              onChangeText={(value) => updateField('salivaryFlow', value)}
              keyboardType="decimal-pad"
              placeholder="1.8"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💉 Systemic Health Biomarkers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>hs-CRP (mg/L, {'<'}1.0 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.hsCRP}
              onChangeText={(value) => updateField('hsCRP', value)}
              keyboardType="decimal-pad"
              placeholder="0.8"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Omega-3 Index (%, {'>'}8.0 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.omega3Index}
              onChangeText={(value) => updateField('omega3Index', value)}
              keyboardType="decimal-pad"
              placeholder="8.5"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>HbA1c (%, {'<'}5.7 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.hba1c}
              onChangeText={(value) => updateField('hba1c', value)}
              keyboardType="decimal-pad"
              placeholder="5.5"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GDF-15 (pg/mL, {'<'}1200 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.gdf15}
              onChangeText={(value) => updateField('gdf15', value)}
              keyboardType="decimal-pad"
              placeholder="1100"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vitamin D (ng/mL, 30-100 optimal)</Text>
            <TextInput
              style={styles.input}
              value={formData.vitaminD}
              onChangeText={(value) => updateField('vitaminD', value)}
              keyboardType="decimal-pad"
              placeholder="35"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
          </View>
        </View>

        {/* ✅ NEW: HRV Input Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ Heart Rate Variability (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>HRV RMSSD (ms, age-adjusted)</Text>
            <TextInput
              style={styles.input}
              value={formData.hrvValue}
              onChangeText={(value) => updateField('hrvValue', value)}
              keyboardType="decimal-pad"
              placeholder={state?.wearableData?.hrv ? state.wearableData.hrv.toString() : "Enter HRV"}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <Text style={styles.helperText}>
              {state?.wearableData?.hrv 
                ? '✅ Auto-filled from watch' 
                : 'Leave empty if not measured'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.calculateButton, isCalculating && styles.calculateButtonDisabled]}
          onPress={handleCalculate}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <ActivityIndicator color="#FF6B35" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Praxiom Age</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => navigation.navigate('Tier2BiomarkerInput')}
        >
          <Text style={styles.upgradeButtonText}>Upgrade to Tier 2 →</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
    fontStyle: 'italic',
  },
  calculateButton: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginTop: 10,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  upgradeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
