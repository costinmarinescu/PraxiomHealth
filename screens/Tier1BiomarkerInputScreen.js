import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../AppContext';

export default function Tier1BiomarkerInputScreen({ navigation }) {
  const { tier1Data, updateState, calculateTier1BioAge } = useAppContext();

  // Local state for inputs
  const [biomarkers, setBiomarkers] = useState({
    salivaryPH: tier1Data.salivaryPH?.toString() || '',
    mmp8: tier1Data.mmp8?.toString() || '',
    flowRate: tier1Data.flowRate?.toString() || '',
    hsCRP: tier1Data.hsCRP?.toString() || '',
    omega3Index: tier1Data.omega3Index?.toString() || '',
    hba1c: tier1Data.hba1c?.toString() || '',
    gdf15: tier1Data.gdf15?.toString() || '',
    vitaminD: tier1Data.vitaminD?.toString() || '',
    hrv: tier1Data.hrv?.toString() || '', // HRV field added
  });

  const [isCalculating, setIsCalculating] = useState(false);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setBiomarkers(prev => ({ ...prev, [field]: value }));
  };

  // Validate inputs
  const validateInputs = () => {
    const required = ['salivaryPH', 'mmp8', 'flowRate', 'hsCRP', 'omega3Index', 'hba1c', 'gdf15', 'vitaminD'];
    
    for (const field of required) {
      if (!biomarkers[field] || biomarkers[field].trim() === '') {
        return { valid: false, field };
      }
      
      const value = parseFloat(biomarkers[field]);
      if (isNaN(value) || value < 0) {
        return { valid: false, field };
      }
    }
    
    return { valid: true };
  };

  // Handle calculate button press
  const handleCalculate = async () => {
    const validation = validateInputs();
    
    if (!validation.valid) {
      Alert.alert(
        'Missing Information',
        `Please enter a valid value for ${validation.field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCalculating(true);

    try {
      // Convert strings to numbers and update context
      const numericData = {
        salivaryPH: parseFloat(biomarkers.salivaryPH),
        mmp8: parseFloat(biomarkers.mmp8),
        flowRate: parseFloat(biomarkers.flowRate),
        hsCRP: parseFloat(biomarkers.hsCRP),
        omega3Index: parseFloat(biomarkers.omega3Index),
        hba1c: parseFloat(biomarkers.hba1c),
        gdf15: parseFloat(biomarkers.gdf15),
        vitaminD: parseFloat(biomarkers.vitaminD),
        hrv: biomarkers.hrv ? parseFloat(biomarkers.hrv) : null, // Optional HRV
      };

      // Update tier1Data in context
      await updateState({
        tier1Data: numericData,
      });

      // Calculate bio-age
      const result = await calculateTier1BioAge();

      // Show success and navigate to results
      Alert.alert(
        'Success!',
        `Your Biological Age: ${result.bioAge.toFixed(1)} years\n\nOral Health Score: ${result.scores.oralHealthScore.toFixed(1)}%\nSystemic Health Score: ${result.scores.systemicHealthScore.toFixed(1)}%\nVitality Index: ${result.scores.vitalityIndex.toFixed(1)}%`,
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Calculation Error',
        error.message || 'An error occurred during calculation. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Tier 1 calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#00BFA6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Foundation Biomarkers</Text>
            <Text style={styles.subtitle}>Tier 1 Assessment</Text>
          </View>

          {/* Oral Health Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🦷 Oral Health Biomarkers</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salivary pH (6.0 - 7.5)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.salivaryPH}
                onChangeText={(value) => handleInputChange('salivaryPH', value)}
                placeholder="e.g., 6.8"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: 6.5 - 7.2 (optimal)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Active MMP-8 (ng/mL)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.mmp8}
                onChangeText={(value) => handleInputChange('mmp8', value)}
                placeholder="e.g., 45"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: &lt;60 ng/mL (optimal)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salivary Flow Rate (mL/min)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.flowRate}
                onChangeText={(value) => handleInputChange('flowRate', value)}
                placeholder="e.g., 1.8"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: &gt;1.5 mL/min (optimal)</Text>
            </View>
          </View>

          {/* Systemic Health Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🩸 Systemic Health Biomarkers</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>hs-CRP (mg/L)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.hsCRP}
                onChangeText={(value) => handleInputChange('hsCRP', value)}
                placeholder="e.g., 0.8"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: &lt;1.0 mg/L (optimal)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Omega-3 Index (%)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.omega3Index}
                onChangeText={(value) => handleInputChange('omega3Index', value)}
                placeholder="e.g., 8.5"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: &gt;8.0% (optimal)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>HbA1c (%)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.hba1c}
                onChangeText={(value) => handleInputChange('hba1c', value)}
                placeholder="e.g., 5.4"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: &lt;5.7% (optimal)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GDF-15 (pg/mL)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.gdf15}
                onChangeText={(value) => handleInputChange('gdf15', value)}
                placeholder="e.g., 950"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: &lt;1200 pg/mL (optimal)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vitamin D (ng/mL)</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.vitaminD}
                onChangeText={(value) => handleInputChange('vitaminD', value)}
                placeholder="e.g., 45"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Target: 40-60 ng/mL (optimal)</Text>
            </View>
          </View>

          {/* Optional HRV Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💓 Optional: Heart Rate Variability</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>HRV-RMSSD (ms) - Optional</Text>
              <TextInput
                style={styles.input}
                value={biomarkers.hrv}
                onChangeText={(value) => handleInputChange('hrv', value)}
                placeholder="e.g., 45 (optional)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helperText}>Age-adjusted optimal ranges apply</Text>
            </View>
          </View>

          {/* Calculate Button */}
          <TouchableOpacity
            style={[styles.calculateButton, isCalculating && styles.calculateButtonDisabled]}
            onPress={handleCalculate}
            disabled={isCalculating}
          >
            <Text style={styles.calculateButtonText}>
              {isCalculating ? 'Calculating...' : 'Calculate Biological Age'}
            </Text>
          </TouchableOpacity>

          {/* Upgrade to Tier 2 */}
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Tier2BiomarkerInput')}
          >
            <Text style={styles.upgradeButtonText}>
              ⬆️ Upgrade to Tier 2 (Advanced Profiling)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
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
