import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BiomarkerInputScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    age: '',
    salivaryPH: '',
    activeMMP8: '',
    salivaryFlowRate: '',
    hsCRP: '',
    hbA1c: '',
    vitaminD: '',
    heartRate: '',
    dailySteps: '',
    oxygenSaturation: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePraxiomAge = async () => {
    // Validate required fields
    if (!formData.age) {
      Alert.alert('Missing Data', 'Please enter your age');
      return;
    }

    // Calculate Praxiom Bio-Age (simplified algorithm)
    const age = parseFloat(formData.age) || 0;
    let bioAge = age;

    // Oral Health adjustments
    const pH = parseFloat(formData.salivaryPH) || 7.0;
    if (pH < 6.5) bioAge += 2;
    else if (pH > 7.2) bioAge += 1;

    const mmp8 = parseFloat(formData.activeMMP8) || 0;
    if (mmp8 > 60) bioAge += Math.min((mmp8 - 60) / 30, 5);

    const flowRate = parseFloat(formData.salivaryFlowRate) || 1.5;
    if (flowRate < 1.5) bioAge += 2;

    // Systemic Health adjustments
    const crp = parseFloat(formData.hsCRP) || 0;
    if (crp > 1.0) bioAge += Math.min((crp - 1.0) * 1.5, 4);

    const hba1c = parseFloat(formData.hbA1c) || 5.0;
    if (hba1c > 5.7) bioAge += Math.min((hba1c - 5.7) * 2, 5);

    const vitD = parseFloat(formData.vitaminD) || 30;
    if (vitD < 30) bioAge += Math.min((30 - vitD) / 10, 3);

    // Fitness adjustments
    const steps = parseFloat(formData.dailySteps) || 0;
    if (steps < 5000) bioAge += 3;
    else if (steps > 10000) bioAge -= 2;

    const spo2 = parseFloat(formData.oxygenSaturation) || 98;
    if (spo2 < 95) bioAge += 2;

    // Round to 1 decimal
    bioAge = Math.round(bioAge * 10) / 10;

    // Save to storage
    const entry = {
      date: new Date().toISOString(),
      chronologicalAge: age,
      bioAge: bioAge,
      data: formData,
    };

    try {
      const existing = await AsyncStorage.getItem('biomarker_entries');
      const entries = existing ? JSON.parse(existing) : [];
      entries.push(entry);
      await AsyncStorage.setItem('biomarker_entries', JSON.stringify(entries));

      Alert.alert(
        'Success',
        `Praxiom Bio-Age Calculated!\n\nChronological Age: ${age}\nBiological Age: ${bioAge}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save biomarker data');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Tier 1 Biomarker Input</Text>
        <Text style={styles.subtitle}>Praxiom Validated Protocol</Text>

        {/* Patient Information */}
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <View style={styles.sectionDivider} />

        <Text style={styles.label}>Age (years)</Text>
        <TextInput
          style={styles.input}
          placeholder="45"
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(text) => updateField('age', text)}
        />

        {/* Oral Health Biomarkers */}
        <Text style={styles.sectionTitle}>Oral Health Biomarkers</Text>
        <View style={styles.sectionDivider} />

        <Text style={styles.label}>Salivary pH (Optimal: 6.5-7.2)</Text>
        <TextInput
          style={styles.input}
          placeholder="5"
          keyboardType="numeric"
          value={formData.salivaryPH}
          onChangeText={(text) => updateField('salivaryPH', text)}
        />

        <Text style={styles.label}>Active MMP-8 (ng/mL) (Optimal: {'<'}60)</Text>
        <TextInput
          style={styles.input}
          placeholder="150"
          keyboardType="numeric"
          value={formData.activeMMP8}
          onChangeText={(text) => updateField('activeMMP8', text)}
        />
        <Text style={styles.weightNote}>Weight: 2.5x - CVD correlation</Text>

        <Text style={styles.label}>Salivary Flow Rate (mL/min) (Optimal: {'>'}1.5)</Text>
        <TextInput
          style={styles.input}
          placeholder="1.5"
          keyboardType="numeric"
          value={formData.salivaryFlowRate}
          onChangeText={(text) => updateField('salivaryFlowRate', text)}
        />

        {/* Systemic Health Biomarkers */}
        <Text style={styles.sectionTitle}>Systemic Health Biomarkers</Text>
        <View style={styles.sectionDivider} />

        <Text style={styles.label}>hs-CRP (mg/L) (Optimal: {'<'}1.0)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5.4"
          keyboardType="numeric"
          value={formData.hsCRP}
          onChangeText={(text) => updateField('hsCRP', text)}
        />
        <Text style={styles.weightNote}>Weight: 1.5x - ADA validated</Text>

        <Text style={styles.label}>HbA1c (%) (Optimal: {'<'}5.7)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5.4"
          keyboardType="numeric"
          value={formData.hbA1c}
          onChangeText={(text) => updateField('hbA1c', text)}
        />
        <Text style={styles.weightNote}>Weight: 1.5x - ADA validated</Text>

        <Text style={styles.label}>Vitamin D 25-OH (ng/mL) (Optimal: {'>'}30)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 35"
          keyboardType="numeric"
          value={formData.vitaminD}
          onChangeText={(text) => updateField('vitaminD', text)}
        />

        {/* Wearable Data */}
        <Text style={styles.sectionTitle}>Wearable Data (PineTime)</Text>
        <View style={styles.sectionDivider} />

        <Text style={styles.label}>Heart Rate (bpm)</Text>
        <TextInput
          style={styles.input}
          placeholder="100"
          keyboardType="numeric"
          value={formData.heartRate}
          onChangeText={(text) => updateField('heartRate', text)}
        />

        <Text style={styles.label}>Daily Steps</Text>
        <TextInput
          style={styles.input}
          placeholder="10000"
          keyboardType="numeric"
          value={formData.dailySteps}
          onChangeText={(text) => updateField('dailySteps', text)}
        />

        <Text style={styles.label}>Oxygen Saturation (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="96"
          keyboardType="numeric"
          value={formData.oxygenSaturation}
          onChangeText={(text) => updateField('oxygenSaturation', text)}
        />

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculatePraxiomAge}
        >
          <Text style={styles.calculateButtonText}>Calculate Praxiom Bio-Age</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionDivider: {
    height: 3,
    backgroundColor: '#FF8C00',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  weightNote: {
    fontSize: 13,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginTop: -10,
    marginBottom: 15,
  },
  calculateButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BiomarkerInputScreen;
