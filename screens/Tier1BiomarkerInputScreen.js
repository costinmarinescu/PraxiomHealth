import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import PraxiomAlgorithm from '../services/PraxiomAlgorithm';

const Tier1BiomarkerInputScreen = ({ navigation }) => {
  // Patient Information
  const [age, setAge] = useState('');

  // Oral Health Biomarkers
  const [salivaryPH, setSalivaryPH] = useState('');
  const [activeMMP8, setActiveMMP8] = useState('');
  const [salivaryFlowRate, setSalivaryFlowRate] = useState('');

  // Systemic Health Biomarkers
  const [hsCRP, setHsCRP] = useState('');
  const [omega3Index, setOmega3Index] = useState('');
  const [hba1c, setHba1c] = useState('');

  const handleSubmit = () => {
    // Validate inputs
    if (!age || !salivaryPH || !activeMMP8 || !salivaryFlowRate || !hsCRP || !omega3Index || !hba1c) {
      Alert.alert('Missing Data', 'Please fill in all fields');
      return;
    }

    const ageNum = parseFloat(age);
    if (ageNum <= 0 || ageNum > 150) {
      Alert.alert('Invalid Age', 'Please enter a valid age');
      return;
    }

    // Calculate scores
    const oralScore = calculateOralScore(parseFloat(salivaryPH), parseFloat(activeMMP8), parseFloat(salivaryFlowRate));
    const systemicScore = calculateSystemicScore(parseFloat(hsCRP), parseFloat(omega3Index), parseFloat(hba1c));
    const fitnessScore = 50; // Default for manual entry

    // ✅ CORRECTED: Use actual PraxiomAlgorithm.calculateBioAge() API
    // Expects 4 separate parameters, not an object!
    const result = PraxiomAlgorithm.calculateBioAge(
      ageNum,
      oralScore,
      systemicScore,
      fitnessScore
    );

    const bioAge = result.bioAge; // Extract bioAge from result object

    Alert.alert('Success', `Calculated Biological Age: ${bioAge.toFixed(1)} years`);

    // Reset form
    resetForm();
    navigation.goBack();
  };

  const calculateOralScore = (ph, mmp8, flowRate) => {
    let score = 75;
    const phDiff = Math.abs(ph - 6.8);
    score -= phDiff * 5;
    score -= Math.min(40, mmp8 * 0.5);
    if (flowRate > 1.5) score += 10;
    return Math.max(0, Math.min(100, score));
  };

  const calculateSystemicScore = (hsCRP, omega3, hba1c) => {
    let score = 75;
    score -= Math.min(30, hsCRP * 10);
    if (omega3 >= 8) score += 15;
    const hba1cDiff = Math.abs(hba1c - 5.2);
    score -= hba1cDiff * 5;
    return Math.max(0, Math.min(100, score));
  };

  const resetForm = () => {
    setAge('');
    setSalivaryPH('');
    setActiveMMP8('');
    setSalivaryFlowRate('');
    setHsCRP('');
    setOmega3Index('');
    setHba1c('');
  };

  return (
    <View style={styles.container}>
      <PraxiomBackground />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tier 1 Biomarkers</Text>
        <Text style={styles.subtitle}>Essential Health Measurements</Text>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Patient Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chronological Age (years)</Text>
            <Text style={styles.hint}>Your actual age</Text>
            <TextInput
              style={styles.input}
              placeholder="53"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={age}
              onChangeText={setAge}
            />
          </View>
        </View>

        {/* Oral Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🦷 Oral Health</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary pH (Optimal: 6.5-7.2)</Text>
            <Text style={styles.hint}>Neutral pH indicates better oral health</Text>
            <TextInput
              style={styles.input}
              placeholder="6.8"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={salivaryPH}
              onChangeText={setSalivaryPH}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>MMP-8 ng/mL (Optimal: &lt;60)</Text>
            <Text style={styles.hint}>Matrix Metalloproteinase-8 indicator</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={activeMMP8}
              onChangeText={setActiveMMP8}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Flow Rate mL/min (Optimal: &gt;1.5)</Text>
            <Text style={styles.hint}>Salivary flow rate measurement</Text>
            <TextInput
              style={styles.input}
              placeholder="1.8"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={salivaryFlowRate}
              onChangeText={setSalivaryFlowRate}
            />
          </View>
        </View>

        {/* Systemic Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ Systemic Health</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>hs-CRP mg/L (Optimal: &lt;1.0)</Text>
            <Text style={styles.hint}>High-sensitivity C-Reactive Protein</Text>
            <TextInput
              style={styles.input}
              placeholder="0.8"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={hsCRP}
              onChangeText={setHsCRP}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Omega-3 Index % (Optimal: &gt;8.0)</Text>
            <Text style={styles.hint}>Omega-3 Fatty Acid content percentage</Text>
            <TextInput
              style={styles.input}
              placeholder="8.5"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={omega3Index}
              onChangeText={setOmega3Index}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>HbA1c % (Optimal: &lt;5.7)</Text>
            <Text style={styles.hint}>Glycated hemoglobin blood glucose</Text>
            <TextInput
              style={styles.input}
              placeholder="5.2"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="decimal-pad"
              value={hba1c}
              onChangeText={setHba1c}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Calculate Bio-Age</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 24,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonGroup: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#00CFC1',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  spacer: {
    height: 20,
  },
});

export default Tier1BiomarkerInputScreen;
