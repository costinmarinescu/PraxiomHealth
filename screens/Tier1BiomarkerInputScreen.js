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
  const { state, calculatePraxiomAge } = useContext(AppContext);
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
            { text: 'Go to Settings', onPress: () => navigation.navigate('Settings') }
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
      
      // Prepare biomarker data - convert all to numbers
      const biomarkerData = {
        salivaryPH: parseFloat(formData.salivaryPH),
        activeMMP8: parseFloat(formData.activeMMP8),
        salivaryFlow: parseFloat(formData.salivaryFlow),
        hsCRP: parseFloat(formData.hsCRP),
        omega3Index: parseFloat(formData.omega3Index),
        hba1c: parseFloat(formData.hba1c),
        gdf15: parseFloat(formData.gdf15),
        vitaminD: parseFloat(formData.vitaminD),
        assessmentDate: selectedDate.toISOString(),
        dateEntered: selectedDate.toLocaleDateString()
      };
      
      // Add HRV if available
      const hrvValue = formData.hrvValue ? parseFloat(formData.hrvValue) : null;
      
      console.log('Calculating with data:', { biomarkerData, hrvValue });
      
      // Calculate Praxiom Age
      const result = await calculatePraxiomAge(biomarkerData, null, hrvValue);
      
      console.log('Calculation result:', result);
      
      // Show success message
      Alert.alert(
        'Praxiom Age Calculated! ✅',
        `Your Biological Age: ${result.biologicalAge} years\n` +
        `Chronological Age: ${result.chronologicalAge} years\n` +
        `Deviation: ${result.deviation > 0 ? '+' : ''}${result.deviation} years\n\n` +
        `Oral Health Score: ${result.scores.oralHealth}%\n` +
        `Systemic Health Score: ${result.scores.systemicHealth}%\n` +
        `Vitality Index: ${result.scores.vitalityIndex}%\n\n` +
        `Recommended Tier: ${result.tier}`,
        [
          { 
            text: 'View Dashboard', 
            onPress: () => navigation.navigate('Dashboard') 
          },
          { 
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
      
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
      console.error('Calculation error:', error);
      Alert.alert(
        'Calculation Error',
        `Failed to complete calculation.\n\nError: ${error.message}\n\nPlease check all values and try again.`
      );
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B35', '#00CFC1']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Tier 1: Foundation Biomarkers</Text>
        
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Date</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={24} color="#00CFC1" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Oral Health Biomarkers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oral Health Biomarkers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary pH</Text>
            <TextInput
              style={styles.input}
              value={formData.salivaryPH}
              onChangeText={(val) => updateField('salivaryPH', val)}
              keyboardType="decimal-pad"
              placeholder="6.5-7.2 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Normal range: 6.0-7.5</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Active MMP-8 (ng/mL)</Text>
            <TextInput
              style={styles.input}
              value={formData.activeMMP8}
              onChangeText={(val) => updateField('activeMMP8', val)}
              keyboardType="decimal-pad"
              placeholder="<60 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Updated 2025: &lt;60 ng/mL optimal</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary Flow Rate (mL/min)</Text>
            <TextInput
              style={styles.input}
              value={formData.salivaryFlow}
              onChangeText={(val) => updateField('salivaryFlow', val)}
              keyboardType="decimal-pad"
              placeholder=">1.5 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Normal range: 1.0-1.5 mL/min</Text>
          </View>
        </View>

        {/* Systemic Health Biomarkers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Systemic Health Biomarkers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>hs-CRP (mg/L)</Text>
            <TextInput
              style={styles.input}
              value={formData.hsCRP}
              onChangeText={(val) => updateField('hsCRP', val)}
              keyboardType="decimal-pad"
              placeholder="<1.0 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Low inflammation: &lt;1.0 mg/L</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Omega-3 Index (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.omega3Index}
              onChangeText={(val) => updateField('omega3Index', val)}
              keyboardType="decimal-pad"
              placeholder=">8.0 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Target: &gt;8.0%</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>HbA1c (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.hba1c}
              onChangeText={(val) => updateField('hba1c', val)}
              keyboardType="decimal-pad"
              placeholder="<5.7 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Prediabetic: 5.7-6.4%</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GDF-15 (pg/mL)</Text>
            <TextInput
              style={styles.input}
              value={formData.gdf15}
              onChangeText={(val) => updateField('gdf15', val)}
              keyboardType="decimal-pad"
              placeholder="<1200 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Strongest aging predictor</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vitamin D (ng/mL)</Text>
            <TextInput
              style={styles.input}
              value={formData.vitaminD}
              onChangeText={(val) => updateField('vitaminD', val)}
              keyboardType="decimal-pad"
              placeholder="40-60 optimal"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>Optimal range: 40-60 ng/mL</Text>
          </View>
        </View>

        {/* Optional HRV */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HRV - Heart Rate Variability (Optional)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>HRV RMSSD (ms)</Text>
            <TextInput
              style={styles.input}
              value={formData.hrvValue}
              onChangeText={(val) => updateField('hrvValue', val)}
              keyboardType="decimal-pad"
              placeholder="From wearable or doctor"
              placeholderTextColor="#999"
            />
            <Text style={styles.helpText}>
              {state.wearableData?.hrv 
                ? `Wearable: ${state.wearableData.hrv} ms` 
                : 'Use this field if HRV was measured by a doctor or external device.'}
            </Text>
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calculateButton, isCalculating && styles.calculateButtonDisabled]}
          onPress={handleCalculate}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Praxiom Age</Text>
          )}
        </TouchableOpacity>

        {/* Warning Note */}
        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <Text style={styles.warningText}>
            💡 Make sure your birthdate is set in Settings for accurate calculations
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00CFC1',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontWeight: '600',
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
    color: '#333',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calculateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
});
