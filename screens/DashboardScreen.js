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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DashboardScreen() {
  // State management
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [praxiomAge, setPraxiomAge] = useState(null);
  
  // Health scores
  const [oralHealthScore, setOralHealthScore] = useState(null);
  const [systemicHealthScore, setSystemicHealthScore] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  
  // Modals
  const [dnaModalVisible, setDnaModalVisible] = useState(false);
  const [biomarkerModalVisible, setBiomarkerModalVisible] = useState(false);
  const [showTier2, setShowTier2] = useState(false);
  
  // DNA Methylation data
  const [dnaData, setDnaData] = useState({
    dunedinPACE: '',
    elovl2Age: '',
    intrinsicCapacity: '',
  });
  
  // Biomarker states - Tier 1
  const [biomarkers, setBiomarkers] = useState({
    salivaryPH: '',
    mmp8: '',
    flowRate: '',
    hsCRP: '',
    omega3: '',
    hba1c: '',
    gdf15: '',
    vitaminD: '',
  });
  
  // Biomarker states - Tier 2
  const [tier2Biomarkers, setTier2Biomarkers] = useState({
    il6: '',
    tnfAlpha: '',
    homaIR: '',
    apoB: '',
    nadPlus: '',
  });
  
  // Wearable data states
  const [wearableData, setWearableData] = useState({
    hrv: 65,
    sleepEfficiency: 85,
    dailySteps: 8500,
    heartRate: 72,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedDOB = await AsyncStorage.getItem('dateOfBirth');
      const savedBiomarkers = await AsyncStorage.getItem('biomarkers');
      const savedTier2 = await AsyncStorage.getItem('tier2Biomarkers');
      const savedDNA = await AsyncStorage.getItem('dnaData');
      const savedPraxiomAge = await AsyncStorage.getItem('praxiomAge');
      const savedOralScore = await AsyncStorage.getItem('oralHealthScore');
      const savedSystemicScore = await AsyncStorage.getItem('systemicHealthScore');
      const savedFitnessScore = await AsyncStorage.getItem('fitnessScore');
      const savedWearableData = await AsyncStorage.getItem('wearableData');

      if (savedDOB) {
        const dob = new Date(savedDOB);
        setDateOfBirth(dob);
        calculateChronologicalAge(dob);
      }
      if (savedBiomarkers) setBiomarkers(JSON.parse(savedBiomarkers));
      if (savedTier2) setTier2Biomarkers(JSON.parse(savedTier2));
      if (savedDNA) setDnaData(JSON.parse(savedDNA));
      if (savedPraxiomAge) setPraxiomAge(parseFloat(savedPraxiomAge));
      if (savedOralScore) setOralHealthScore(parseFloat(savedOralScore));
      if (savedSystemicScore) setSystemicHealthScore(parseFloat(savedSystemicScore));
      if (savedFitnessScore) setFitnessScore(parseFloat(savedFitnessScore));
      if (savedWearableData) setWearableData(JSON.parse(savedWearableData));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculateChronologicalAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setChronologicalAge(age);
  };

  const onDateChange = async (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      calculateChronologicalAge(selectedDate);
      await AsyncStorage.setItem('dateOfBirth', selectedDate.toISOString());
    }
  };

  const saveDNAData = async () => {
    try {
      await AsyncStorage.setItem('dnaData', JSON.stringify(dnaData));
      setDnaModalVisible(false);
      Alert.alert('Success', 'DNA methylation data saved!');
      // Recalculate if biomarkers exist
      if (praxiomAge) {
        calculatePraxiomAge();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save DNA data');
    }
  };

  const calculatePraxiomAge = async () => {
    // Validate required fields
    const requiredTier1 = Object.values(biomarkers);
    const allTier1Filled = requiredTier1.every(field => field !== '');
    
    if (!allTier1Filled) {
      Alert.alert('Missing Data', 'Please fill in all Tier 1 biomarker values');
      return;
    }

    if (!chronologicalAge) {
      Alert.alert('Missing Date of Birth', 'Please set your date of birth first');
      return;
    }

    // Calculate Oral Health Score (0-100)
    const salivaryPH = parseFloat(biomarkers.salivaryPH);
    const mmp8 = parseFloat(biomarkers.mmp8);
    const flowRate = parseFloat(biomarkers.flowRate);

    // pH score (ideal: 6.5-7.2)
    let phScore = 100;
    if (salivaryPH < 6.5) phScore = 100 * (salivaryPH / 6.5);
    else if (salivaryPH > 7.2) phScore = Math.max(0, 100 - ((salivaryPH - 7.2) * 25));

    // MMP-8 score (ideal: <60 ng/mL)
    const mmp8Score = mmp8 < 60 ? 100 : Math.max(0, 100 - ((mmp8 - 60) * 1.5));

    // Flow rate score (ideal: >1.5 mL/min)
    const flowScore = flowRate >= 1.5 ? 100 : (flowRate / 1.5) * 100;

    const oralScore = (phScore * 0.3 + mmp8Score * 0.4 + flowScore * 0.3);
    setOralHealthScore(oralScore);

    // Calculate Systemic Health Score (0-100)
    const hsCRP = parseFloat(biomarkers.hsCRP);
    const omega3 = parseFloat(biomarkers.omega3);
    const hba1c = parseFloat(biomarkers.hba1c);
    const gdf15 = parseFloat(biomarkers.gdf15);
    const vitaminD = parseFloat(biomarkers.vitaminD);

    // hs-CRP score (ideal: <1.0 mg/L)
    const crpScore = hsCRP < 1.0 ? 100 : Math.max(0, 100 - ((hsCRP - 1.0) * 20));

    // Omega-3 score (ideal: >8.0%)
    const omega3Score = omega3 >= 8.0 ? 100 : (omega3 / 8.0) * 100;

    // HbA1c score (ideal: <5.7%)
    const hba1cScore = hba1c < 5.7 ? 100 : Math.max(0, 100 - ((hba1c - 5.7) * 50));

    // GDF-15 score (ideal: <1200 pg/mL)
    const gdf15Score = gdf15 < 1200 ? 100 : Math.max(0, 100 - ((gdf15 - 1200) / 20));

    // Vitamin D score (ideal: 40-60 ng/mL)
    let vitDScore = 100;
    if (vitaminD < 40) vitDScore = (vitaminD / 40) * 100;
    else if (vitaminD > 60) vitDScore = Math.max(0, 100 - ((vitaminD - 60) * 2));

    let systemicScore = (
      crpScore * 0.25 +
      omega3Score * 0.2 +
      hba1cScore * 0.25 +
      gdf15Score * 0.15 +
      vitDScore * 0.15
    );

    // Apply Tier 2 adjustments if available
    if (showTier2 && tier2Biomarkers.il6 !== '') {
      const il6 = parseFloat(tier2Biomarkers.il6);
      const tnfAlpha = parseFloat(tier2Biomarkers.tnfAlpha);
      const homaIR = parseFloat(tier2Biomarkers.homaIR);
      const apoB = parseFloat(tier2Biomarkers.apoB);
      const nadPlus = parseFloat(tier2Biomarkers.nadPlus);

      let tier2Adjustment = 0;
      if (il6 > 2.0) tier2Adjustment += (il6 - 2.0) * 5;
      if (tnfAlpha > 8.0) tier2Adjustment += (tnfAlpha - 8.0) * 3;
      if (homaIR > 2.5) tier2Adjustment += (homaIR - 2.5) * 6;
      if (apoB > 90) tier2Adjustment += (apoB - 90) * 0.5;
      if (nadPlus < 40) tier2Adjustment += (40 - nadPlus) * 2;

      systemicScore = Math.max(0, systemicScore - tier2Adjustment);
    }

    setSystemicHealthScore(systemicScore);

    // Calculate Fitness Score from wearable data
    let hrvScore = 100;
    if (wearableData.hrv < 50) hrvScore = (wearableData.hrv / 50) * 100;

    const sleepScore = (wearableData.sleepEfficiency / 85) * 100;
    const stepsScore = Math.min(100, (wearableData.dailySteps / 10000) * 100);

    const calcFitnessScore = (hrvScore * 0.4 + sleepScore * 0.3 + stepsScore * 0.3);
    setFitnessScore(calcFitnessScore);

    // Calculate Bio-Age with age-stratified coefficients
    const avgScore = (oralScore + systemicScore + calcFitnessScore) / 3;
    let bioAgeDeviation;

    if (chronologicalAge < 40) {
      bioAgeDeviation = (100 - avgScore) * 0.15;
    } else if (chronologicalAge < 60) {
      bioAgeDeviation = (100 - avgScore) * 0.20;
    } else {
      bioAgeDeviation = (100 - avgScore) * 0.25;
    }

    let calculatedBioAge = chronologicalAge + bioAgeDeviation;

    // Apply DNA methylation adjustment if available
    if (dnaData.dunedinPACE !== '') {
      const dunedinPACE = parseFloat(dnaData.dunedinPACE);
      if (dunedinPACE > 1.0) {
        calculatedBioAge += (dunedinPACE - 1.0) * 5;
      }
    }

    setPraxiomAge(calculatedBioAge);

    // Save all data
    await AsyncStorage.setItem('biomarkers', JSON.stringify(biomarkers));
    await AsyncStorage.setItem('tier2Biomarkers', JSON.stringify(tier2Biomarkers));
    await AsyncStorage.setItem('praxiomAge', calculatedBioAge.toString());
    await AsyncStorage.setItem('oralHealthScore', oralScore.toString());
    await AsyncStorage.setItem('systemicHealthScore', systemicScore.toString());
    await AsyncStorage.setItem('fitnessScore', calcFitnessScore.toString());

    setBiomarkerModalVisible(false);
    Alert.alert('Success', `Your Praxiom Age is ${calculatedBioAge.toFixed(1)} years`);
  };

  const pushToWatch = () => {
    if (!praxiomAge) {
      Alert.alert('No Data', 'Please calculate your Praxiom Age first');
      return;
    }
    // TODO: Implement BLE push to watch
    Alert.alert('Push to Watch', `Sending age ${praxiomAge.toFixed(1)} to your PineTime watch...`);
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer}>
        <Text style={styles.backgroundLogo}>PRAXIOM</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>PRAXIOM{'\n'}HEALTH</Text>

        {/* Date of Birth Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Date of Birth</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Set Date of Birth'}
            </Text>
          </TouchableOpacity>
          {chronologicalAge !== null && (
            <Text style={styles.ageText}>Chronological Age: {chronologicalAge} years</Text>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth || new Date()}
            mode="date"
            display="calendar"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Bio-Age Display with Push to Watch */}
        <TouchableOpacity style={styles.bioAgeCard} onPress={pushToWatch} activeOpacity={0.7}>
          <Text style={styles.bioAgeLabel}>Praxiom Age</Text>
          <Text style={styles.bioAgeValue}>
            {praxiomAge ? praxiomAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.bioAgeUnit}>years</Text>
          {praxiomAge && (
            <Text style={styles.pushToWatchText}>⌚ Tap to Push to Watch</Text>
          )}
        </TouchableOpacity>

        {/* Health Score Cards Row */}
        <View style={styles.healthCardsRow}>
          {/* Oral Health Card */}
          <View style={[styles.healthCard, styles.oralCard]}>
            <Text style={styles.healthCardTitle}>Oral Health</Text>
            <Text style={styles.healthCardScore}>
              {oralHealthScore ? `${oralHealthScore.toFixed(0)}%` : '--'}
            </Text>
          </View>

          {/* Systemic Health Card */}
          <View style={[styles.healthCard, styles.systemicCard]}>
            <Text style={styles.healthCardTitle}>Systemic Health</Text>
            <Text style={styles.healthCardScore}>
              {systemicHealthScore ? `${systemicHealthScore.toFixed(0)}%` : '--'}
            </Text>
          </View>
        </View>

        {/* Fitness Score Card (Centered) */}
        <View style={[styles.healthCard, styles.fitnessCard]}>
          <Text style={styles.healthCardTitle}>Fitness Score</Text>
          <Text style={styles.healthCardScore}>
            {fitnessScore ? `${fitnessScore.toFixed(0)}%` : '--'}
          </Text>
        </View>

        {/* Wearable Data Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wearable Data</Text>
          
          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>Heart Rate:</Text>
            <Text style={styles.wearableValue}>{wearableData.heartRate} bpm</Text>
            <Text style={styles.wearableRange}>(Normal: 60-100)</Text>
          </View>

          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>HRV:</Text>
            <Text style={styles.wearableValue}>{wearableData.hrv} ms</Text>
            <Text style={styles.wearableRange}>(Optimal: {'>'} 50 ms)</Text>
          </View>

          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>Sleep Efficiency:</Text>
            <Text style={styles.wearableValue}>{wearableData.sleepEfficiency}%</Text>
            <Text style={styles.wearableRange}>(Optimal: {'>'} 85%)</Text>
          </View>

          <View style={styles.wearableRow}>
            <Text style={styles.wearableLabel}>Daily Steps:</Text>
            <Text style={styles.wearableValue}>{wearableData.dailySteps.toLocaleString()}</Text>
            <Text style={styles.wearableRange}>(Optimal: {'>'} 7,000)</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.dnaButton]}
          onPress={() => setDnaModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>🧬 DNA Methylation Test</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.biomarkerButton]}
          onPress={() => setBiomarkerModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>📊 Input Biomarkers</Text>
        </TouchableOpacity>

        {/* DNA Methylation Modal */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={dnaModalVisible}
          onRequestClose={() => setDnaModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>DNA Methylation Test</Text>

              <Text style={styles.inputLabel}>DunedinPACE (Pace of Aging)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: ~1.0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={dnaData.dunedinPACE}
                onChangeText={(text) => setDnaData({...dnaData, dunedinPACE: text})}
              />

              <Text style={styles.inputLabel}>ELOVL2 Predicted Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Your DNA age in years"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={dnaData.elovl2Age}
                onChangeText={(text) => setDnaData({...dnaData, elovl2Age: text})}
              />

              <Text style={styles.inputLabel}>Intrinsic Capacity Score</Text>
              <TextInput
                style={styles.input}
                placeholder="0-100 scale"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={dnaData.intrinsicCapacity}
                onChangeText={(text) => setDnaData({...dnaData, intrinsicCapacity: text})}
              />

              <TouchableOpacity style={styles.calculateButton} onPress={saveDNAData}>
                <Text style={styles.calculateButtonText}>Save DNA Data</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setDnaModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Biomarker Input Modal */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={biomarkerModalVisible}
          onRequestClose={() => setBiomarkerModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Biomarker Input</Text>

              <Text style={styles.sectionTitle}>Tier 1 - Foundation</Text>

              <Text style={styles.subsectionTitle}>Oral Health</Text>
              
              <Text style={styles.inputLabel}>Salivary pH</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: 6.5-7.2"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.salivaryPH}
                onChangeText={(text) => setBiomarkers({...biomarkers, salivaryPH: text})}
              />

              <Text style={styles.inputLabel}>MMP-8 (ng/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 60"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.mmp8}
                onChangeText={(text) => setBiomarkers({...biomarkers, mmp8: text})}
              />

              <Text style={styles.inputLabel}>Flow Rate (mL/min)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: > 1.5"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.flowRate}
                onChangeText={(text) => setBiomarkers({...biomarkers, flowRate: text})}
              />

              <Text style={styles.subsectionTitle}>Systemic Health</Text>

              <Text style={styles.inputLabel}>hs-CRP (mg/L)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 1.0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.hsCRP}
                onChangeText={(text) => setBiomarkers({...biomarkers, hsCRP: text})}
              />

              <Text style={styles.inputLabel}>Omega-3 Index (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: > 8.0"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.omega3}
                onChangeText={(text) => setBiomarkers({...biomarkers, omega3: text})}
              />

              <Text style={styles.inputLabel}>HbA1c (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 5.7"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.hba1c}
                onChangeText={(text) => setBiomarkers({...biomarkers, hba1c: text})}
              />

              <Text style={styles.inputLabel}>GDF-15 (pg/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: < 1200"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.gdf15}
                onChangeText={(text) => setBiomarkers({...biomarkers, gdf15: text})}
              />

              <Text style={styles.inputLabel}>Vitamin D (ng/mL)</Text>
              <TextInput
                style={styles.input}
                placeholder="Normal: 40-60"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={biomarkers.vitaminD}
                onChangeText={(text) => setBiomarkers({...biomarkers, vitaminD: text})}
              />

              {/* Tier 2 Toggle */}
              <TouchableOpacity 
                style={styles.tier2Button}
                onPress={() => setShowTier2(!showTier2)}
              >
                <Text style={styles.tier2ButtonText}>
                  {showTier2 ? '▼ Hide Tier 2 Advanced' : '⬆️ Upgrade to Tier 2'}
                </Text>
              </TouchableOpacity>

              {/* Tier 2 Fields */}
              {showTier2 && (
                <>
                  <Text style={styles.sectionTitle}>Tier 2 - Advanced</Text>

                  <Text style={styles.inputLabel}>IL-6 (pg/mL)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Normal: < 2.0"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.il6}
                    onChangeText={(text) => setTier2Biomarkers({...tier2Biomarkers, il6: text})}
                  />

                  <Text style={styles.inputLabel}>TNF-α (pg/mL)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Normal: < 8.0"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.tnfAlpha}
                    onChangeText={(text) => setTier2Biomarkers({...tier2Biomarkers, tnfAlpha: text})}
                  />

                  <Text style={styles.inputLabel}>HOMA-IR</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Normal: < 2.5"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.homaIR}
                    onChangeText={(text) => setTier2Biomarkers({...tier2Biomarkers, homaIR: text})}
                  />

                  <Text style={styles.inputLabel}>ApoB (mg/dL)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Normal: < 90"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.apoB}
                    onChangeText={(text) => setTier2Biomarkers({...tier2Biomarkers, apoB: text})}
                  />

                  <Text style={styles.inputLabel}>NAD+ (μmol/L)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Normal: > 40"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={tier2Biomarkers.nadPlus}
                    onChangeText={(text) => setTier2Biomarkers({...tier2Biomarkers, nadPlus: text})}
                  />
                </>
              )}

              <TouchableOpacity style={styles.calculateButton} onPress={calculatePraxiomAge}>
                <Text style={styles.calculateButtonText}>🧮 Calculate Praxiom Age</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setBiomarkerModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
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
  backgroundLogoContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 0,
    opacity: 0.05,
  },
  backgroundLogo: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#FF8C00',
    letterSpacing: 10,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    zIndex: 1,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  dateButton: {
    backgroundColor: '#00CFC1',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ageText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  bioAgeCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  bioAgeLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  bioAgeValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#00CFC1',
  },
  bioAgeUnit: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  pushToWatchText: {
    fontSize: 14,
    color: '#9B59B6',
    marginTop: 15,
    fontWeight: '600',
  },
  healthCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  healthCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
  },
  oralCard: {
    flex: 0.48,
    borderColor: '#FF8C00',
  },
  systemicCard: {
    flex: 0.48,
    borderColor: '#FF8C00',
  },
  fitnessCard: {
    width: '67%',
    alignSelf: 'center',
    marginBottom: 20,
    borderColor: '#00CFC1',
  },
  healthCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  healthCardScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  wearableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  wearableLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  wearableValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00CFC1',
    flex: 1,
    textAlign: 'center',
  },
  wearableRange: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  dnaButton: {
    backgroundColor: '#FF8C00',
  },
  biomarkerButton: {
    backgroundColor: '#00CFC1',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#00CFC1',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#666',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  tier2Button: {
    backgroundColor: '#9B59B6',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  tier2ButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
