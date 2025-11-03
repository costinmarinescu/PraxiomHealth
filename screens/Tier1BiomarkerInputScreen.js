import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Tier1BiomarkerInputScreen = ({ navigation }) => {
  // Patient Information
  const [age, setAge] = useState('');

  // ORAL HEALTH BIOMARKERS (Complete)
  const [salivaryPH, setSalivaryPH] = useState('');
  const [activeMMP8, setActiveMMP8] = useState('');
  const [salivaryFlow, setSalivaryFlow] = useState('');

  // SYSTEMIC HEALTH BIOMARKERS (Complete)
  const [hsCRP, setHsCRP] = useState('');
  const [omega3Index, setOmega3Index] = useState('');
  const [hbA1c, setHbA1c] = useState('');
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');

  // FITNESS SCORE COMPONENTS (New - from PDF)
  const [aerobicScore, setAerobicScore] = useState('');
  const [flexibilityScore, setFlexibilityScore] = useState('');
  const [balanceScore, setBalanceScore] = useState('');
  const [mindBodyScore, setMindBodyScore] = useState('');

  // WEARABLE DATA (PineTime)
  const [heartRate, setHeartRate] = useState('');
  const [dailySteps, setDailySteps] = useState('');
  const [oxygenSat, setOxygenSat] = useState('');

  const calculatePraxiomAge = () => {
    // Validate required fields
    if (!age || !salivaryPH || !activeMMP8 || !salivaryFlow || 
        !hsCRP || !omega3Index || !hbA1c || !gdf15 || !vitaminD) {
      Alert.alert('Missing Data', 'Please fill in all required biomarker fields');
      return;
    }

    // Convert strings to numbers
    const patientAge = parseFloat(age);
    const pH = parseFloat(salivaryPH);
    const mmp8 = parseFloat(activeMMP8);
    const flowRate = parseFloat(salivaryFlow);
    const crp = parseFloat(hsCRP);
    const omega3 = parseFloat(omega3Index);
    const a1c = parseFloat(hbA1c);
    const gdf = parseFloat(gdf15);
    const vitD = parseFloat(vitaminD);

    // ============================================
    // TIER 1 PRAXIOM ALGORITHM (EXACT FROM PROTOCOL)
    // ============================================

    // 1. ORAL HEALTH SCORE (OHS)
    // Formula: OHS = [(MMP-8 × 2.5) + (pH × 1.0) + (Flow Rate × 2.0)] / 5.5 × 100
    
    // Normalize each biomarker (0-10 scale based on ranges)
    const normalizedMMP8 = mmp8 <= 60 ? 10 : (mmp8 >= 100 ? 0 : 10 - ((mmp8 - 60) / 4));
    const normalizedPH = (pH >= 6.5 && pH <= 7.2) ? 10 : 
                        (pH >= 6.0 && pH < 6.5) ? 7 : 
                        (pH > 7.2 && pH <= 7.5) ? 7 : 3;
    const normalizedFlow = flowRate >= 1.5 ? 10 : (flowRate >= 1.0 ? 7 : 3);

    const OHS = ((normalizedMMP8 * 2.5) + (normalizedPH * 1.0) + (normalizedFlow * 2.0)) / 5.5 * 10;

    // 2. SYSTEMIC HEALTH SCORE (SHS)
    // Formula: SHS = [(hs-CRP × 2.0) + (Omega-3 × 2.0) + (GDF-15 × 2.0) + (HbA1c × 1.5) + (Vitamin D × 1.0)] / 9.5 × 100
    
    const normalizedCRP = crp <= 1.0 ? 10 : (crp <= 3.0 ? 7 : 3);
    const normalizedOmega3 = omega3 >= 8.0 ? 10 : (omega3 >= 6.0 ? 7 : 3);
    const normalizedGDF15 = gdf <= 1200 ? 10 : (gdf <= 1800 ? 7 : 3);
    const normalizedHbA1c = a1c < 5.7 ? 10 : (a1c <= 6.4 ? 7 : 3);
    const normalizedVitD = vitD >= 30 ? 10 : (vitD >= 20 ? 7 : 3);

    const SHS = ((normalizedCRP * 2.0) + (normalizedOmega3 * 2.0) + (normalizedGDF15 * 2.0) + 
                 (normalizedHbA1c * 1.5) + (normalizedVitD * 1.0)) / 9.5 * 10;

    // 3. FITNESS SCORE (FS) - Optional but strongly recommended
    let FS = 0;
    if (aerobicScore && flexibilityScore && balanceScore && mindBodyScore) {
      const aerobic = parseFloat(aerobicScore);
      const flexibility = parseFloat(flexibilityScore);
      const balance = parseFloat(balanceScore);
      const mindBody = parseFloat(mindBodyScore);
      
      // Composite FS = (sum of 4 domains / 40) × 100
      FS = ((aerobic + flexibility + balance + mindBody) / 40) * 100;
    }

    // 4. AGE-STRATIFIED COEFFICIENTS
    let alpha, beta, gamma;
    if (patientAge < 50) {
      alpha = 0.08;
      beta = 0.15;
      gamma = 0.10;
    } else if (patientAge <= 70) {
      alpha = 0.12;
      beta = 0.20;
      gamma = 0.15;
    } else {
      alpha = 0.15;
      beta = 0.25;
      gamma = 0.20;
    }

    // 5. CALCULATE PRAXIOM BIO-AGE
    // Bio-Age = Chronological Age + [(100 - OHS) × α + (100 - SHS) × β + (100 - FS) × γ]
    const oralAdjustment = (100 - OHS) * alpha;
    const systemicAdjustment = (100 - SHS) * beta;
    const fitnessAdjustment = FS > 0 ? (100 - FS) * gamma : 0;

    const praxiomAge = patientAge + oralAdjustment + systemicAdjustment + fitnessAdjustment;

    // 6. DETERMINE HEALTH CATEGORIES
    const getCategory = (score) => {
      if (score >= 90) return 'Excellent (Green)';
      if (score >= 75) return 'Good (Yellow)';
      if (score >= 60) return 'Fair (Orange)';
      return 'Poor (Red) - Immediate Intervention Required';
    };

    // 7. CHECK TIER UPGRADE TRIGGERS
    const needsTier2 = OHS < 75 || SHS < 75 || gdf > 1800 || omega3 < 6.0 || 
                       (praxiomAge - patientAge) > 3 || (mmp8 > 100 && crp > 3);

    // Show results
    Alert.alert(
      'Praxiom Bio-Age Calculated',
      `Your Praxiom Bio-Age: ${Math.round(praxiomAge * 10) / 10} years\n\n` +
      `Oral Health Score (OHS): ${Math.round(OHS)}% - ${getCategory(OHS)}\n` +
      `Systemic Health Score (SHS): ${Math.round(SHS)}% - ${getCategory(SHS)}\n` +
      (FS > 0 ? `Fitness Score (FS): ${Math.round(FS)}%\n\n` : '\n') +
      (needsTier2 ? '⚠️ TIER 2 UPGRADE RECOMMENDED\nSchedule personalized assessment' : '✓ Continue Tier 1 monitoring'),
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Dashboard', {
            bioAge: Math.round(praxiomAge * 10) / 10,
            oralHealth: Math.round(OHS),
            systemicHealth: Math.round(SHS),
            fitness: Math.round(FS),
            needsTier2: needsTier2
          })
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tier 1 Biomarker Input</Text>
        <Text style={styles.subtitle}>Praxiom Validated Protocol - Complete Assessment</Text>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>Age (years) *</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="45"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        {/* ORAL HEALTH BIOMARKERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oral Health Biomarkers</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>Salivary pH * (Optimal: 6.5-7.2)</Text>
          <TextInput
            style={styles.input}
            value={salivaryPH}
            onChangeText={setSalivaryPH}
            placeholder="6.8"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.0× - Oral microbiome balance</Text>

          <Text style={styles.label}>Active MMP-8 (ng/mL) * (Optimal: &lt;60)</Text>
          <TextInput
            style={styles.input}
            value={activeMMP8}
            onChangeText={setActiveMMP8}
            placeholder="55"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 2.5× - 89% sensitivity CVD correlation</Text>

          <Text style={styles.label}>Salivary Flow Rate (mL/min) * (Optimal: &gt;1.5)</Text>
          <TextInput
            style={styles.input}
            value={salivaryFlow}
            onChangeText={setSalivaryFlow}
            placeholder="1.8"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 2.0× - Immune function indicator</Text>
        </View>

        {/* SYSTEMIC HEALTH BIOMARKERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Systemic Health Biomarkers</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>hs-CRP (serum) (mg/L) * (Optimal: &lt;1.0)</Text>
          <TextInput
            style={styles.input}
            value={hsCRP}
            onChangeText={setHsCRP}
            placeholder="0.8"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 2.0× - Gold standard systemic inflammation</Text>

          <Text style={styles.label}>Omega-3 Index (%) * (Optimal: &gt;8.0)</Text>
          <TextInput
            style={styles.input}
            value={omega3Index}
            onChangeText={setOmega3Index}
            placeholder="8.5"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 2.0× - 5-year mortality predictor</Text>

          <Text style={styles.label}>HbA1c (%) * (Optimal: &lt;5.7)</Text>
          <TextInput
            style={styles.input}
            value={hbA1c}
            onChangeText={setHbA1c}
            placeholder="5.4"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.5× - ADA validated diabetes screening</Text>

          <Text style={styles.label}>GDF-15 (pg/mL) * (Optimal: &lt;1,200)</Text>
          <TextInput
            style={styles.input}
            value={gdf15}
            onChangeText={setGdf15}
            placeholder="1100"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 2.0× - STRONGEST aging predictor (β=0.26)</Text>

          <Text style={styles.label}>Vitamin D 25-OH (ng/mL) * (Optimal: &gt;30)</Text>
          <TextInput
            style={styles.input}
            value={vitaminD}
            onChangeText={setVitaminD}
            placeholder="35"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
          <Text style={styles.weightNote}>Weight: 1.0× - Immune function & longevity</Text>
        </View>

        {/* FITNESS SCORE (Optional but Recommended) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Score (Optional)</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Score each domain 0-10 (0=poor, 5=average, 10=excellent)</Text>
          
          <Text style={styles.label}>Aerobic Fitness (0-10)</Text>
          <Text style={styles.helperText}>3-min step test or 6-min walk test</Text>
          <TextInput
            style={styles.input}
            value={aerobicScore}
            onChangeText={setAerobicScore}
            placeholder="8"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Flexibility & Posture (0-10)</Text>
          <Text style={styles.helperText}>Sit-and-reach + posture assessment</Text>
          <TextInput
            style={styles.input}
            value={flexibilityScore}
            onChangeText={setFlexibilityScore}
            placeholder="7"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Balance & Coordination (0-10)</Text>
          <Text style={styles.helperText}>One-leg stance (30s = excellent)</Text>
          <TextInput
            style={styles.input}
            value={balanceScore}
            onChangeText={setBalanceScore}
            placeholder="8"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Mental Preparedness (0-10)</Text>
          <Text style={styles.helperText}>Confidence & mind-body alignment</Text>
          <TextInput
            style={styles.input}
            value={mindBodyScore}
            onChangeText={setMindBodyScore}
            placeholder="7"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        {/* Wearable Data (PineTime) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wearable Data (PineTime)</Text>
          <View style={styles.divider} />
          
          <Text style={styles.label}>Heart Rate (bpm)</Text>
          <TextInput
            style={styles.input}
            value={heartRate}
            onChangeText={setHeartRate}
            placeholder="65"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Daily Steps</Text>
          <TextInput
            style={styles.input}
            value={dailySteps}
            onChangeText={setDailySteps}
            placeholder="10000"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Oxygen Saturation (%)</Text>
          <TextInput
            style={styles.input}
            value={oxygenSat}
            onChangeText={setOxygenSat}
            placeholder="98"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 25,
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  divider: {
    height: 3,
    backgroundColor: '#FF8C00',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
  },
  weightNote: {
    fontSize: 13,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginTop: 5,
  },
  calculateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#757575',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Tier1BiomarkerInputScreen;