import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
  // State for user data
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [chronologicalAge, setChronologicalAge] = useState(0);
  const [praxiomAge, setPraxiomAge] = useState(0);
  const [oralHealthScore, setOralHealthScore] = useState(0);
  const [systemicHealthScore, setSystemicHealthScore] = useState(0);
  const [fitnessScore, setFitnessScore] = useState(0);

  // Biomarker values
  const [salivaryPH, setSalivaryPH] = useState('');
  const [mmp8, setMmp8] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [hsCRP, setHsCRP] = useState('');
  const [omega3, setOmega3] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');

  // Wearable data
  const [hrv, setHrv] = useState('');
  const [sleepEfficiency, setSleepEfficiency] = useState('');
  const [dailySteps, setDailySteps] = useState('');

  // Modals
  const [showDOBModal, setShowDOBModal] = useState(false);
  const [showBiomarkerModal, setShowBiomarkerModal] = useState(false);
  const [showWearableModal, setShowWearableModal] = useState(false);
  const [showDNAModal, setShowDNAModal] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedDOB = await AsyncStorage.getItem('dateOfBirth');
      const storedPraxiomAge = await AsyncStorage.getItem('praxiomAge');
      const storedOralScore = await AsyncStorage.getItem('oralHealthScore');
      const storedSystemicScore = await AsyncStorage.getItem('systemicHealthScore');
      const storedFitnessScore = await AsyncStorage.getItem('fitnessScore');

      // Biomarkers
      const storedPH = await AsyncStorage.getItem('salivaryPH');
      const storedMMP8 = await AsyncStorage.getItem('mmp8');
      const storedFlow = await AsyncStorage.getItem('flowRate');
      const storedCRP = await AsyncStorage.getItem('hsCRP');
      const storedOmega = await AsyncStorage.getItem('omega3');
      const storedHbA1c = await AsyncStorage.getItem('hba1c');
      const storedGDF = await AsyncStorage.getItem('gdf15');
      const storedVitD = await AsyncStorage.getItem('vitaminD');

      // Wearable data
      const storedHRV = await AsyncStorage.getItem('hrv');
      const storedSleep = await AsyncStorage.getItem('sleepEfficiency');
      const storedSteps = await AsyncStorage.getItem('dailySteps');

      if (storedDOB) {
        setDateOfBirth(storedDOB);
        calculateChronologicalAge(storedDOB);
      }
      if (storedPraxiomAge) setPraxiomAge(parseFloat(storedPraxiomAge));
      if (storedOralScore) setOralHealthScore(parseFloat(storedOralScore));
      if (storedSystemicScore) setSystemicHealthScore(parseFloat(storedSystemicScore));
      if (storedFitnessScore) setFitnessScore(parseFloat(storedFitnessScore));

      if (storedPH) setSalivaryPH(storedPH);
      if (storedMMP8) setMmp8(storedMMP8);
      if (storedFlow) setFlowRate(storedFlow);
      if (storedCRP) setHsCRP(storedCRP);
      if (storedOmega) setOmega3(storedOmega);
      if (storedHbA1c) setHba1c(storedHbA1c);
      if (storedGDF) setGdf15(storedGDF);
      if (storedVitD) setVitaminD(storedVitD);

      if (storedHRV) setHrv(storedHRV);
      if (storedSleep) setSleepEfficiency(storedSleep);
      if (storedSteps) setDailySteps(storedSteps);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculateChronologicalAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setChronologicalAge(age);
  };

  const saveDOB = async () => {
    if (!dateOfBirth) {
      Alert.alert('Error', 'Please enter your date of birth');
      return;
    }
    try {
      await AsyncStorage.setItem('dateOfBirth', dateOfBirth);
      calculateChronologicalAge(dateOfBirth);
      setShowDOBModal(false);
      Alert.alert('Success', 'Date of birth saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save date of birth');
    }
  };

  const calculateBioAge = async () => {
    // Validate inputs
    const ph = parseFloat(salivaryPH);
    const mmp = parseFloat(mmp8);
    const flow = parseFloat(flowRate);
    const crp = parseFloat(hsCRP);
    const omega = parseFloat(omega3);
    const hb = parseFloat(hba1c);
    const gdf = parseFloat(gdf15);
    const vitD = parseFloat(vitaminD);

    if (isNaN(ph) || isNaN(mmp) || isNaN(flow) || isNaN(crp) || 
        isNaN(omega) || isNaN(hb) || isNaN(gdf) || isNaN(vitD)) {
      Alert.alert('Error', 'Please fill in all biomarker values with valid numbers');
      return;
    }

    // Calculate Oral Health Score (OHS)
    // Optimal ranges: pH 6.5-7.2, MMP-8 <60, Flow >1.5
    const phScore = (ph >= 6.5 && ph <= 7.2) ? 100 : (ph < 6.0 || ph > 7.5) ? 50 : 75;
    const mmpScore = mmp < 60 ? 100 : mmp < 100 ? 75 : 50;
    const flowScore = flow > 1.5 ? 100 : flow > 1.0 ? 75 : 50;
    
    const ohs = ((mmpScore * 2.5 + phScore * 1.0 + flowScore * 1.0) / 4.5);

    // Calculate Systemic Health Score (SHS)
    // Optimal ranges: CRP <1.0, Omega-3 >8.0, HbA1c <5.7, GDF-15 <1200, Vit D >30
    const crpScore = crp < 1.0 ? 100 : crp < 3.0 ? 75 : 50;
    const omegaScore = omega > 8.0 ? 100 : omega > 6.0 ? 75 : 50;
    const hbScore = hb < 5.7 ? 100 : hb < 6.5 ? 75 : 50;
    const gdfScore = gdf < 1200 ? 100 : gdf < 1800 ? 75 : 50;
    const vitDScore = vitD > 30 ? 100 : vitD > 20 ? 75 : 50;

    const shs = ((crpScore * 2.0 + omegaScore * 2.0 + gdfScore * 2.0 + 
                  hbScore * 1.5 + vitDScore * 1.0) / 8.5);

    // Calculate Fitness Score from wearable data
    let fs = 85; // Default if no wearable data
    if (hrv && sleepEfficiency && dailySteps) {
      const hrvVal = parseFloat(hrv);
      const sleepVal = parseFloat(sleepEfficiency);
      const stepsVal = parseFloat(dailySteps);

      const hrvScore = hrvVal > 70 ? 100 : hrvVal > 50 ? 75 : 50;
      const sleepScore = sleepVal > 85 ? 100 : sleepVal > 75 ? 75 : 50;
      const stepsScore = stepsVal > 8000 ? 100 : stepsVal > 5000 ? 75 : 50;

      fs = (hrvScore + sleepScore + stepsScore) / 3;
    }

    // Age-stratified coefficients for Bio-Age calculation
    let alpha, beta;
    if (chronologicalAge < 50) {
      alpha = 0.08;
      beta = 0.15;
    } else if (chronologicalAge <= 70) {
      alpha = 0.12;
      beta = 0.20;
    } else {
      alpha = 0.15;
      beta = 0.25;
    }

    // Calculate Praxiom Age (Bio-Age)
    const bioAge = chronologicalAge + 
                   ((100 - ohs) * alpha) + 
                   ((100 - shs) * beta);

    // Save all values
    try {
      await AsyncStorage.setItem('praxiomAge', bioAge.toFixed(1));
      await AsyncStorage.setItem('oralHealthScore', ohs.toFixed(1));
      await AsyncStorage.setItem('systemicHealthScore', shs.toFixed(1));
      await AsyncStorage.setItem('fitnessScore', fs.toFixed(1));

      await AsyncStorage.setItem('salivaryPH', salivaryPH);
      await AsyncStorage.setItem('mmp8', mmp8);
      await AsyncStorage.setItem('flowRate', flowRate);
      await AsyncStorage.setItem('hsCRP', hsCRP);
      await AsyncStorage.setItem('omega3', omega3);
      await AsyncStorage.setItem('hba1c', hba1c);
      await AsyncStorage.setItem('gdf15', gdf15);
      await AsyncStorage.setItem('vitaminD', vitaminD);

      setPraxiomAge(bioAge);
      setOralHealthScore(ohs);
      setSystemicHealthScore(shs);
      setFitnessScore(fs);

      setShowBiomarkerModal(false);
      Alert.alert('Success', `Your Praxiom Age has been calculated: ${bioAge.toFixed(1)} years`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save calculation');
    }
  };

  const saveWearableData = async () => {
    try {
      if (hrv) await AsyncStorage.setItem('hrv', hrv);
      if (sleepEfficiency) await AsyncStorage.setItem('sleepEfficiency', sleepEfficiency);
      if (dailySteps) await AsyncStorage.setItem('dailySteps', dailySteps);

      setShowWearableModal(false);
      Alert.alert('Success', 'Wearable data saved!');
      
      // Recalculate if we have biomarker data
      if (salivaryPH && mmp8) {
        calculateBioAge();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save wearable data');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 75) return '#FFC107'; // Yellow
    if (score >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getAgeDeviation = () => {
    if (chronologicalAge === 0 || praxiomAge === 0) return 0;
    return (praxiomAge - chronologicalAge).toFixed(1);
  };

  const getDeviationColor = () => {
    const deviation = parseFloat(getAgeDeviation());
    if (deviation <= -5) return '#4CAF50'; // Green - younger
    if (deviation <= 0) return '#FFC107'; // Yellow - slightly younger
    if (deviation <= 5) return '#FF9800'; // Orange - slightly older
    return '#F44336'; // Red - significantly older
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>

        {/* Age Overview Section */}
        <View style={styles.ageOverviewCard}>
          <Text style={styles.sectionTitle}>🎯 Bio-Age Overview</Text>
          
          <View style={styles.ageComparisonRow}>
            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Chronological Age</Text>
              <TouchableOpacity onPress={() => setShowDOBModal(true)}>
                <Text style={styles.ageValue}>
                  {chronologicalAge > 0 ? `${chronologicalAge}` : 'Set DOB'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.ageUnit}>years</Text>
            </View>

            <View style={styles.ageDivider} />

            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Praxiom Age</Text>
              <Text style={styles.praxiomAgeValue}>
                {praxiomAge > 0 ? praxiomAge.toFixed(1) : '--'}
              </Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>
          </View>

          <View style={styles.deviationCard}>
            <Text style={styles.deviationLabel}>Bio-Age Deviation:</Text>
            <Text style={[styles.deviationValue, { color: getDeviationColor() }]}>
              {getAgeDeviation() > 0 ? '+' : ''}{getAgeDeviation()} years
            </Text>
          </View>

          <Text style={styles.goalText}>
            Goal: Reduce biological age by 3-10 years through tiered longevity protocol
          </Text>
        </View>

        {/* Health Scores Section */}
        <View style={styles.scoresSection}>
          <Text style={styles.sectionTitle}>📊 Health Score Summary</Text>
          
          <View style={styles.scoreRow}>
            <View style={[styles.scoreCard, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
              <Text style={styles.scoreName}>Oral Health</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(oralHealthScore) }]}>
                {oralHealthScore > 0 ? `${oralHealthScore.toFixed(0)}%` : '--'}
              </Text>
              <Text style={styles.scoreTarget}>Target: >85%</Text>
            </View>

            <View style={[styles.scoreCard, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}>
              <Text style={styles.scoreName}>Systemic Health</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(systemicHealthScore) }]}>
                {systemicHealthScore > 0 ? `${systemicHealthScore.toFixed(0)}%` : '--'}
              </Text>
              <Text style={styles.scoreTarget}>Target: >85%</Text>
            </View>
          </View>

          <View style={[styles.scoreCard, styles.fitnessCard]}>
            <Text style={styles.scoreName}>Fitness Score</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(fitnessScore) }]}>
              {fitnessScore > 0 ? `${fitnessScore.toFixed(0)}%` : '--'}
            </Text>
            <Text style={styles.scoreTarget}>Target: >85%</Text>
          </View>
        </View>

        {/* Wearable Data Section */}
        <View style={styles.wearableSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⌚ Wearable Data</Text>
            <TouchableOpacity onPress={() => setShowWearableModal(true)}>
              <Text style={styles.editButton}>Update</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wearableRow}>
            <View style={styles.wearableCard}>
              <Text style={styles.wearableLabel}>HRV (RMSSD)</Text>
              <Text style={styles.wearableValue}>
                {hrv || '--'} <Text style={styles.wearableUnit}>ms</Text>
              </Text>
              <Text style={styles.wearableTarget}>Optimal: >70 ms</Text>
            </View>

            <View style={styles.wearableCard}>
              <Text style={styles.wearableLabel}>Sleep Efficiency</Text>
              <Text style={styles.wearableValue}>
                {sleepEfficiency || '--'}<Text style={styles.wearableUnit}>%</Text>
              </Text>
              <Text style={styles.wearableTarget}>Optimal: >85%</Text>
            </View>

            <View style={styles.wearableCard}>
              <Text style={styles.wearableLabel}>Daily Steps</Text>
              <Text style={styles.wearableValue}>
                {dailySteps || '--'}
              </Text>
              <Text style={styles.wearableTarget}>Optimal: >8000</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.syncButton}
            onPress={() => navigation.navigate('Watch')}
          >
            <Text style={styles.syncButtonText}>📱 Push to Watch</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowBiomarkerModal(true)}
          >
            <Text style={styles.buttonText}>🔬 Input Biomarkers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowDNAModal(true)}
          >
            <Text style={styles.buttonText}>🧬 DNA Methylation Test</Text>
          </TouchableOpacity>
        </View>

        {/* DOB Modal */}
        <Modal visible={showDOBModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Date of Birth</Text>
              <Text style={styles.modalHint}>Format: YYYY-MM-DD</Text>
              
              <TextInput
                style={styles.input}
                placeholder="1990-01-15"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDOBModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveDOB}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Biomarker Input Modal */}
        <Modal visible={showBiomarkerModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView style={styles.fullScreenModal} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalTitle}>Tier 1 Biomarker Input</Text>
              <Text style={styles.modalHint}>Enter your latest test results</Text>

              <Text style={styles.sectionTitle}>Oral Health Biomarkers</Text>
              
              <Text style={styles.inputLabel}>Salivary pH (Optimal: 6.5-7.2)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 6.8"
                value={salivaryPH}
                onChangeText={setSalivaryPH}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Active MMP-8 (Optimal: <60 ng/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 45"
                value={mmp8}
                onChangeText={setMmp8}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Salivary Flow Rate (Optimal: >1.5 mL/min)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1.8"
                value={flowRate}
                onChangeText={setFlowRate}
                keyboardType="decimal-pad"
              />

              <Text style={styles.sectionTitle}>Systemic Health Biomarkers</Text>

              <Text style={styles.inputLabel}>hs-CRP (Optimal: <1.0 mg/L)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 0.8"
                value={hsCRP}
                onChangeText={setHsCRP}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Omega-3 Index (Optimal: >8.0%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 8.5"
                value={omega3}
                onChangeText={setOmega3}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>HbA1c (Optimal: <5.7%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 5.4"
                value={hba1c}
                onChangeText={setHba1c}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>GDF-15 (Optimal: <1200 pg/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 950"
                value={gdf15}
                onChangeText={setGdf15}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Vitamin D (25-OH) (Optimal: >30 ng/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 35"
                value={vitaminD}
                onChangeText={setVitaminD}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={styles.calculateButton}
                onPress={calculateBioAge}
              >
                <Text style={styles.buttonText}>Calculate Praxiom Age</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowBiomarkerModal(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Wearable Data Modal */}
        <Modal visible={showWearableModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Update Wearable Data</Text>
              <Text style={styles.modalHint}>Enter your latest metrics</Text>

              <Text style={styles.inputLabel}>HRV (RMSSD) in ms (Optimal: >70)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 75"
                value={hrv}
                onChangeText={setHrv}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Sleep Efficiency % (Optimal: >85)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 88"
                value={sleepEfficiency}
                onChangeText={setSleepEfficiency}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Daily Steps (Optimal: >8000)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 9500"
                value={dailySteps}
                onChangeText={setDailySteps}
                keyboardType="number-pad"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowWearableModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={saveWearableData}
                >
                  <Text style={styles.buttonText}>Save & Recalculate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* DNA Modal Placeholder */}
        <Modal visible={showDNAModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>DNA Methylation Test</Text>
              <Text style={styles.modalHint}>Tier 3 - Coming Soon</Text>
              <Text style={styles.infoText}>
                This feature will allow you to input DunedinPACE, ELOVL2, and other epigenetic age markers.
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDNAModal(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ageOverviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  ageComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  ageColumn: {
    alignItems: 'center',
    flex: 1,
  },
  ageLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  ageValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  praxiomAgeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  ageUnit: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 5,
  },
  ageDivider: {
    width: 2,
    height: 60,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  deviationCard: {
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  deviationValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scoresSection: {
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  fitnessCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 0,
  },
  scoreName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreTarget: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  wearableSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  editButton: {
    fontSize: 14,
    color: '#00CFC1',
    fontWeight: '600',
  },
  wearableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  wearableCard: {
    flex: 1,
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  wearableLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 8,
    textAlign: 'center',
  },
  wearableValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  wearableUnit: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  wearableTarget: {
    fontSize: 9,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#00CFC1',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsSection: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#9B59B6',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxHeight: '80%',
  },
  fullScreenModal: {
    flex: 1,
  },
  modalScroll: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalHint: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#2C3E50',
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#00CFC1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  saveButton: {
    backgroundColor: '#00CFC1',
  },
  calculateButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButton: {
    backgroundColor: '#95A5A6',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
});
