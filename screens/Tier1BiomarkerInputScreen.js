import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import PraxiomBackground from '../components/PraxiomBackground';
import PraxiomAlgorithm from '../services/PraxiomAlgorithm';
import StorageService from '../services/StorageService';
import WearableService from '../services/WearableService';

const Tier1BiomarkerInputScreen = ({ navigation }) => {
  // Date selection
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Patient Information
  const [age, setAge] = useState('');

  // Oral Health Biomarkers
  const [salivaryPH, setSalivaryPH] = useState('');
  const [activeMMP8, setActiveMMP8] = useState('');
  const [salivaryFlowRate, setSalivaryFlowRate] = useState('');

  // Systemic Health Biomarkers
  const [hsCRP, setHsCRP] = useState('');
  const [omega3Index, setOmega3Index] = useState('');
  const [hbA1c, setHbA1c] = useState('');
  const [gdf15, setGDF15] = useState('');
  const [vitaminD, setVitaminD] = useState('');

  // Wearable Data
  const [heartRate, setHeartRate] = useState('');
  const [steps, setSteps] = useState('');
  const [spO2, setSpO2] = useState('');
  const [hrv, setHRV] = useState(''); // ✅ ADDED: HRV input field

  const [loading, setLoading] = useState(false);

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const validateInputs = () => {
    if (!age || parseFloat(age) < 18 || parseFloat(age) > 120) {
      Alert.alert('Invalid Input', 'Please enter a valid age (18-120)');
      return false;
    }

    const requiredFields = [
      { value: salivaryPH, name: 'Salivary pH' },
      { value: activeMMP8, name: 'Active MMP-8' },
      { value: salivaryFlowRate, name: 'Salivary Flow Rate' },
      { value: hsCRP, name: 'hs-CRP' },
      { value: omega3Index, name: 'Omega-3 Index' },
      { value: hbA1c, name: 'HbA1c' },
      { value: gdf15, name: 'GDF-15' },
      { value: vitaminD, name: 'Vitamin D' },
      { value: heartRate, name: 'Heart Rate' },
      { value: steps, name: 'Daily Steps' },
      { value: spO2, name: 'Oxygen Saturation' },
      { value: hrv, name: 'HRV' }, // ✅ ADDED: HRV validation
    ];

    for (const field of requiredFields) {
      if (!field.value || field.value.trim() === '') {
        Alert.alert('Missing Data', `Please enter ${field.name}`);
        return false;
      }
    }

    return true;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      // Prepare biomarker data
      const biomarkerData = {
        age: parseFloat(age),
        salivaryPH: parseFloat(salivaryPH),
        activeMMP8: parseFloat(activeMMP8),
        salivaryFlowRate: parseFloat(salivaryFlowRate),
        hsCRP: parseFloat(hsCRP),
        omega3Index: parseFloat(omega3Index),
        hbA1c: parseFloat(hbA1c),
        gdf15: parseFloat(gdf15),
        vitaminD: parseFloat(vitaminD),
        heartRate: parseFloat(heartRate),
        steps: parseInt(steps),
        spO2: parseFloat(spO2),
        hrv: parseFloat(hrv), // ✅ ADDED: HRV in biomarker data
      };

      // Calculate Bio-Age using Praxiom Algorithm
      const results = PraxiomAlgorithm.calculateFromBiomarkers(biomarkerData);

      // Prepare entry for storage
      const entry = {
        ...biomarkerData,
        ...results,
        timestamp: selectedDate.toISOString(),
        tier: 1,
      };

      // Save to storage
      await StorageService.saveBiomarkerEntry(entry);

      // Send to watch if connected
      if (WearableService.isConnected()) {
        try {
          await WearableService.sendBioAge({ praxiomAge: results.bioAge });
          
          Alert.alert(
            'Success!',
            `Bio-Age: ${results.bioAge} years\nData saved and synced to watch!`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } catch (bleError) {
          console.error('BLE sync error:', bleError);
          Alert.alert(
            'Partial Success',
            `Bio-Age: ${results.bioAge} years\nData saved but watch sync failed.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Alert.alert(
          'Success!',
          `Bio-Age: ${results.bioAge} years\nData saved successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Error', 'Failed to calculate Bio-Age. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PraxiomBackground>
      <ScrollView style={styles.container}>
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assessment Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#00d4ff" />
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

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (years)</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="e.g., 45"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Oral Health Biomarkers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oral Health Biomarkers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary pH (Optimal: 6.5-7.2)</Text>
            <TextInput
              style={styles.input}
              value={salivaryPH}
              onChangeText={setSalivaryPH}
              keyboardType="decimal-pad"
              placeholder="e.g., 7.0"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Active MMP-8 (ng/mL) (Optimal: &lt;60)</Text>
            <TextInput
              style={styles.input}
              value={activeMMP8}
              onChangeText={setActiveMMP8}
              keyboardType="numeric"
              placeholder="e.g., 45"
              placeholderTextColor="#666"
            />
            <Text style={styles.hint}>Weight: 2.5x - CVD correlation</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salivary Flow Rate (mL/min) (Optimal: &gt;1.5)</Text>
            <TextInput
              style={styles.input}
              value={salivaryFlowRate}
              onChangeText={setSalivaryFlowRate}
              keyboardType="decimal-pad"
              placeholder="e.g., 1.8"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Systemic Health Biomarkers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Systemic Health Biomarkers</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>hs-CRP (mg/L) (Optimal: &lt;1.0)</Text>
            <TextInput
              style={styles.input}
              value={hsCRP}
              onChangeText={setHsCRP}
              keyboardType="decimal-pad"
              placeholder="e.g., 0.8"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Omega-3 Index (%) (Optimal: &gt;8)</Text>
            <TextInput
              style={styles.input}
              value={omega3Index}
              onChangeText={setOmega3Index}
              keyboardType="decimal-pad"
              placeholder="e.g., 8.5"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>HbA1c (%) (Optimal: &lt;5.7)</Text>
            <TextInput
              style={styles.input}
              value={hbA1c}
              onChangeText={setHbA1c}
              keyboardType="decimal-pad"
              placeholder="e.g., 5.4"
              placeholderTextColor="#666"
            />
            <Text style={styles.hint}>Weight: 1.5x - ADA validated</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GDF-15 (pg/mL) (Optimal: &lt;1200)</Text>
            <TextInput
              style={styles.input}
              value={gdf15}
              onChangeText={setGDF15}
              keyboardType="numeric"
              placeholder="e.g., 1000"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vitamin D 25-OH (ng/mL) (Optimal: &gt;30)</Text>
            <TextInput
              style={styles.input}
              value={vitaminD}
              onChangeText={setVitaminD}
              keyboardType="decimal-pad"
              placeholder="e.g., 35"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        {/* Wearable Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wearable Data (Chest Band / PineTime)</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Heart Rate (bpm)</Text>
            <TextInput
              style={styles.input}
              value={heartRate}
              onChangeText={setHeartRate}
              keyboardType="numeric"
              placeholder="e.g., 65"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Steps</Text>
            <TextInput
              style={styles.input}
              value={steps}
              onChangeText={setSteps}
              keyboardType="numeric"
              placeholder="e.g., 10000"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Oxygen Saturation (%)</Text>
            <TextInput
              style={styles.input}
              value={spO2}
              onChangeText={setSpO2}
              keyboardType="numeric"
              placeholder="e.g., 98"
              placeholderTextColor="#666"
            />
          </View>

          {/* ✅ ADDED: HRV Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>HRV - Heart Rate Variability (ms) (Optimal: ≥70)</Text>
            <TextInput
              style={styles.input}
              value={hrv}
              onChangeText={setHRV}
              keyboardType="numeric"
              placeholder="e.g., 55"
              placeholderTextColor="#666"
            />
            <Text style={styles.hint}>
              Weight: 2.5x - Measured with chest band. Higher HRV indicates better autonomic function and longevity.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCalculate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Calculating...' : 'Calculate Praxiom Bio-Age'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PraxiomBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  dateText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e1e2e',
    color: '#ffffff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  hint: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#4ade80',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8e8e93',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e8e93',
  },
});

export default Tier1BiomarkerInputScreen;
