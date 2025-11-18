import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../AppContext';

export default function Tier1BiomarkerInputScreen({ navigation }) {
  // ✅ FIX: Get correct functions from AppContext
  const { state, updateState, calculateScores } = useContext(AppContext);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Date picker state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    // Oral Health Biomarkers
    salivaryPH: '',
    activeMMP8: '',
    salivaryFlow: '',
    
    // Systemic Health Biomarkers
    hsCRP: '',
    omega3Index: '',
    hba1c: '',
    gdf15: '',
    vitaminD: '',
    
    // Optional HRV (from wearable or manual entry)
    hrvValue: state.wearableData?.hrv || ''
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const validateInputs = () => {
    const errors = [];
    
    // Check all required fields are filled
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
    
    // Validate numeric ranges
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

  // ✅ FIX: Corrected calculation flow
  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      
      // Check if birthdate is set
      if (!state.profile?.birthdate) {
        Alert.alert(
          'Profile Incomplete',
          'Please set your birthdate in Settings before calculating Praxiom Age.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => navigation.navigate('Settings', { screen: 'SettingsHome' }) }
          ]
        );
        setIsCalculating(false);
        return;
      }
      
      // Validate all inputs
      if (!validateInputs()) {
        setIsCalculating(false);
        return;
      }
      
      console.log('✅ Starting Tier 1 calculation...');
      
      // ✅ FIX STEP 1: Update biomarker values in state
      await updateState({
        salivaryPH: parseFloat(formData.salivaryPH),
        mmp8: parseFloat(formData.activeMMP8),
        flowRate: parseFloat(formData.salivaryFlow),
        hsCRP: parseFloat(formData.hsCRP),
        omega3Index: parseFloat(formData.omega3Index),
        hba1c: parseFloat(formData.hba1c),
        gdf15: parseFloat(formData.gdf15),
        vitaminD: parseFloat(formData.vitaminD),
      });
      
      console.log('✅ Biomarkers updated in state');
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ✅ FIX STEP 2: Calculate scores from biomarkers, which also calculates bio-age
      const biologicalAge = calculateScores();
      
      console.log('✅ Scores calculated, biological age:', biologicalAge);
      
      // Get the updated scores from state
      const oralScore = state.oralHealthScore;
      const systemicScore = state.systemicHealthScore;
      const vitalityIndex = state.vitalityIndex;
      const chronologicalAge = state.chronologicalAge;
      
      // Calculate deviation
      const deviation = parseFloat((biologicalAge - chronologicalAge).toFixed(1));
      
      // Show success message
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
            onPress: () => navigation.navigate('DashboardHome') 
          },
          { 
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
      
      console.log('✅ Tier 1 calculation complete!');
      
      // Clear form after successful calculation
      setFormData({
        salivaryPH: '',
        activeMMP8: '',
        salivaryFlow: '',
        hsCRP: '',
        omega3Index: '',
        hba1c: '',
        gdf15: '',
        vitaminD: '',
        hrvValue: state.wearableData?.hrv || ''
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
      return '⚠️ Recommended: Upgrade to Tier 2 for personalized interventions';
    } else if (oralScore >= 85 && systemicScore >= 85) {
      return '✅ Excellent health profile! Keep maintaining your current lifestyle.';
    } else {
      return '👍 Good health status. Continue monitoring with regular assessments.';
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FDC830', '#00CED1']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tier 1 Assessment</Text>
          <Text style={styles.subtitle}>Foundation Biomarkers</Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Oral Health Biomarkers */}
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

        {/* Systemic Health Biomarkers */}
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

        {/* Calculate Button */}
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

        {/* Upgrade Button */}
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
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
