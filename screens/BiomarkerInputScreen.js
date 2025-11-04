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
    // Patient Info
    age: '',
    
    // Oral Health Biomarkers
    salivaryPH: '',
    activeMMP8: '',
    salivaryFlowRate: '',
    
    // Systemic Health Biomarkers
    hsCRP: '',
    hbA1c: '',
    vitaminD: '',
    
    // Wearable Data
    heartRate: '',
    dailySteps: '',
    oxygenSaturation: '',
    
    // Optional Fitness Scores (0-10 each)
    aerobicFitness: '',
    flexibility: '',
    balance: '',
    mentalPreparedness: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateOralHealthScore = (pH, mmp8, flowRate) => {
    let score = 100;
    
    // Salivary pH (Optimal: 6.5-7.2)
    const ph = parseFloat(pH) || 7.0;
    if (ph < 5.5) score -= 30;
    else if (ph < 6.0) score -= 25;
    else if (ph < 6.5) score -= 15;
    else if (ph > 7.5) score -= 10;
    else if (ph > 7.2) score -= 5;
    
    // Active MMP-8 (Optimal: <60 ng/mL) - 2.5x weight for CVD correlation
    const mmp = parseFloat(mmp8) || 0;
    if (mmp > 200) score -= 30;
    else if (mmp > 150) score -= 25;
    else if (mmp > 100) score -= 15;
    else if (mmp > 60) score -= 10;
    
    // Salivary Flow Rate (Optimal: >1.5 mL/min)
    const flow = parseFloat(flowRate) || 1.5;
    if (flow < 0.5) score -= 25;
    else if (flow < 1.0) score -= 15;
    else if (flow < 1.5) score -= 8;
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateSystemicHealthScore = (crp, hba1c, vitD) => {
    let score = 100;
    
    // hs-CRP (Optimal: <1.0 mg/L) - 1.5x weight, ADA validated
    const crpVal = parseFloat(crp) || 0;
    if (crpVal > 10) score -= 40;
    else if (crpVal > 5) score -= 30;
    else if (crpVal > 3) score -= 20;
    else if (crpVal > 1.0) score -= 10;
    
    // HbA1c (Optimal: <5.7%) - 1.5x weight, ADA validated
    const hba1cVal = parseFloat(hba1c) || 5.0;
    if (hba1cVal > 9.0) score -= 40;
    else if (hba1cVal > 7.0) score -= 30;
    else if (hba1cVal > 6.5) score -= 20;
    else if (hba1cVal > 5.7) score -= 10;
    
    // Vitamin D 25-OH (Optimal: >30 ng/mL)
    const vitDVal = parseFloat(vitD) || 30;
    if (vitDVal < 10) score -= 30;
    else if (vitDVal < 20) score -= 20;
    else if (vitDVal < 30) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const calculateFitnessScore = (aerobic, flex, bal, mental) => {
    // Each domain is 0-10, total is out of 40, convert to percentage
    const a = parseFloat(aerobic) || 0;
    const f = parseFloat(flex) || 0;
    const b = parseFloat(bal) || 0;
    const m = parseFloat(mental) || 0;
    
    const totalScore = a + f + b + m;
    return (totalScore / 40) * 100;
  };

  const calculateBioAge = (chronAge, ohs, shs, fs) => {
    // Age-dependent coefficients
    let alpha = 0.10; // OHS coefficient
    let beta = 0.15;  // SHS coefficient  
    let gamma = 0.12; // FS coefficient
    
    // Adjust coefficients based on age
    if (chronAge < 40) {
      alpha = 0.08;
      beta = 0.12;
      gamma = 0.10;
    } else if (chronAge >= 60) {
      alpha = 0.12;
      beta = 0.18;
      gamma = 0.15;
    }
    
    // Bio-Age formula: Chron Age + [(100-OHS)×α + (100-SHS)×β + (100-FS)×γ]
    const oralImpact = (100 - ohs) * alpha;
    const systemicImpact = (100 - shs) * beta;
    const fitnessImpact = (100 - fs) * gamma;
    
    const bioAge = chronAge + oralImpact + systemicImpact + fitnessImpact;
    
    return {
      bioAge: Math.round(bioAge * 10) / 10,
      oralImpact,
      systemicImpact,
      fitnessImpact,
    };
  };

  const calculatePraxiomAge = async () => {
    // Validate required fields
    if (!formData.age) {
      Alert.alert('Missing Data', 'Please enter your age');
      return;
    }

    const age = parseFloat(formData.age) || 0;
    
    // Calculate component scores
    const oralHealthScore = calculateOralHealthScore(
      formData.salivaryPH,
      formData.activeMMP8,
      formData.salivaryFlowRate
    );
    
    const systemicHealthScore = calculateSystemicHealthScore(
      formData.hsCRP,
      formData.hbA1c,
      formData.vitaminD
    );
    
    // Calculate fitness score (optional, defaults to average if not provided)
    let fitnessScore = 70; // Default average
    if (formData.aerobicFitness || formData.flexibility || formData.balance || formData.mentalPreparedness) {
      fitnessScore = calculateFitnessScore(
        formData.aerobicFitness,
        formData.flexibility,
        formData.balance,
        formData.mentalPreparedness
      );
    }
    
    // Calculate Bio-Age
    const result = calculateBioAge(age, oralHealthScore, systemicHealthScore, fitnessScore);
    
    // Save to storage
    const entry = {
      date: new Date().toISOString(),
      chronologicalAge: age,
      bioAge: result.bioAge,
      oralHealthScore,
      systemicHealthScore,
      fitnessScore,
      data: formData,
      breakdown: {
        oralImpact: result.oralImpact.toFixed(1),
        systemicImpact: result.systemicImpact.toFixed(1),
        fitnessImpact: result.fitnessImpact.toFixed(1),
      },
    };

    try {
      const existing = await AsyncStorage.getItem('biomarker_entries');
      const entries = existing ? JSON.parse(existing) : [];
      entries.push(entry);
      await AsyncStorage.setItem('biomarker_entries', JSON.stringify(entries));

      const ageDiff = result.bioAge - age;
      const diffText = ageDiff > 0 
        ? `${ageDiff.toFixed(1)} years older` 
        : `${Math.abs(ageDiff).toFixed(1)} years younger`;

      Alert.alert(
        '✅ Praxiom Bio-Age Calculated!',
        `Chronological Age: ${age} years\n` +
        `Biological Age: ${result.bioAge} years\n\n` +
        `You are ${diffText} than your chronological age.\n\n` +
        `Component Scores:\n` +
        `• Oral Health: ${oralHealthScore.toFixed(0)}%\n` +
        `• Systemic Health: ${systemicHealthScore.toFixed(0)}%\n` +
        `• Fitness: ${fitnessScore.toFixed(0)}%`,
        [
          {
            text: 'View History',
            onPress: () => navigation.navigate('BiomarkerHistory'),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save biomarker data: ' + error.message);
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

        <Text style={styles.label}>Age (years) *</Text>
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
          placeholder="6.8"
          keyboardType="numeric"
          value={formData.salivaryPH}
          onChangeText={(text) => updateField('salivaryPH', text)}
        />

        <Text style={styles.label}>Active MMP-8 (ng/mL) (Optimal: {'<'}60)</Text>
        <TextInput
          style={styles.input}
          placeholder="50"
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
          placeholder="0.8"
          keyboardType="numeric"
          value={formData.hsCRP}
          onChangeText={(text) => updateField('hsCRP', text)}
        />
        <Text style={styles.weightNote}>Weight: 1.5x - ADA validated</Text>

        <Text style={styles.label}>HbA1c (%) (Optimal: {'<'}5.7)</Text>
        <TextInput
          style={styles.input}
          placeholder="5.4"
          keyboardType="numeric"
          value={formData.hbA1c}
          onChangeText={(text) => updateField('hbA1c', text)}
        />
        <Text style={styles.weightNote}>Weight: 1.5x - ADA validated</Text>

        <Text style={styles.label}>Vitamin D 25-OH (ng/mL) (Optimal: {'>'}30)</Text>
        <TextInput
          style={styles.input}
          placeholder="35"
          keyboardType="numeric"
          value={formData.vitaminD}
          onChangeText={(text) => updateField('vitaminD', text)}
        />

        {/* Wearable Data */}
        <Text style={styles.sectionTitle}>Wearable Data (PineTime/Watch)</Text>
        <View style={styles.sectionDivider} />

        <Text style={styles.label}>Heart Rate (bpm)</Text>
        <TextInput
          style={styles.input}
          placeholder="70"
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
          placeholder="98"
          keyboardType="numeric"
          value={formData.oxygenSaturation}
          onChangeText={(text) => updateField('oxygenSaturation', text)}
        />

        {/* Optional Fitness Evaluation */}
        <Text style={styles.sectionTitle}>Optional: Fitness Evaluation (0-10 each)</Text>
        <View style={styles.sectionDivider} />
        <Text style={styles.optionalNote}>Leave blank if not assessed by trainer</Text>

        <Text style={styles.label}>Aerobic Fitness (VO₂max proxy) (0-10)</Text>
        <TextInput
          style={styles.input}
          placeholder="7"
          keyboardType="numeric"
          value={formData.aerobicFitness}
          onChangeText={(text) => updateField('aerobicFitness', text)}
        />

        <Text style={styles.label}>Flexibility & Posture (0-10)</Text>
        <TextInput
          style={styles.input}
          placeholder="6"
          keyboardType="numeric"
          value={formData.flexibility}
          onChangeText={(text) => updateField('flexibility', text)}
        />

        <Text style={styles.label}>Coordination & Balance (0-10)</Text>
        <TextInput
          style={styles.input}
          placeholder="8"
          keyboardType="numeric"
          value={formData.balance}
          onChangeText={(text) => updateField('balance', text)}
        />

        <Text style={styles.label}>Mental Preparedness (0-10)</Text>
        <TextInput
          style={styles.input}
          placeholder="7"
          keyboardType="numeric"
          value={formData.mentalPreparedness}
          onChangeText={(text) => updateField('mentalPreparedness', text)}
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
  optionalNote: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
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
