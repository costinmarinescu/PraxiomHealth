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
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  // User profile
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Bio-Age data
  const [praxiomAge, setPraxiomAge] = useState(null);
  const [dnaMethylationAge, setDnaMethylationAge] = useState(null);
  
  // Health scores
  const [oralHealthScore, setOralHealthScore] = useState(null);
  const [systemicHealthScore, setSystemicHealthScore] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  
  // Modals
  const [dnaModalVisible, setDnaModalVisible] = useState(false);
  const [biomarkerModalVisible, setBiomarkerModalVisible] = useState(false);
  const [personInfoModalVisible, setPersonInfoModalVisible] = useState(false);
  const [showTier2, setShowTier2] = useState(false);
  
  // DNA Methylation Test data
  const [dunedinPACE, setDunedinPACE] = useState('');
  const [elovl2Age, setElovl2Age] = useState('');
  const [intrinsicCapacity, setIntrinsicCapacity] = useState('');
  
  // Biomarkers - Tier 1
  const [salivarPH, setSalivarPH] = useState('');
  const [mmp8, setMmp8] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [hsCRP, setHsCRP] = useState('');
  const [omega3, setOmega3] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');
  
  // Biomarkers - Tier 2
  const [il6, setIL6] = useState('');
  const [tnfAlpha, setTnfAlpha] = useState('');
  const [ldlParticles, setLdlParticles] = useState('');
  const [apoB, setApoB] = useState('');
  const [homocysteine, setHomocysteine] = useState('');
  const [ferritin, setFerritin] = useState('');
  
  // Wearable data - HRV, Heart Rate, Steps  
  const [wearableData, setWearableData] = useState({
    hrv: '--',
    heartRate: '--',
    dailySteps: '--',
  });

  // Tier status
  const [currentTier, setCurrentTier] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('healthData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setChronologicalAge(data.chronologicalAge);
        setDnaMethylationAge(data.dnaMethylationAge);
        setPraxiomAge(data.praxiomAge);
        setOralHealthScore(data.oralHealthScore);
        setSystemicHealthScore(data.systemicHealthScore);
        setFitnessScore(data.fitnessScore);
      }

      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setUserName(profile.name || '');
        setUserEmail(profile.email || '');
        if (profile.dateOfBirth) {
          setDateOfBirth(new Date(profile.dateOfBirth));
          calculateChronologicalAge(new Date(profile.dateOfBirth));
        }
      }

      const savedTier = await AsyncStorage.getItem('currentTier');
      if (savedTier) {
        setCurrentTier(parseInt(savedTier));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      const data = {
        chronologicalAge,
        dnaMethylationAge,
        praxiomAge,
        oralHealthScore,
        systemicHealthScore,
        fitnessScore,
      };
      await AsyncStorage.setItem('healthData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
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

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      calculateChronologicalAge(selectedDate);
    }
  };

  const handleDNATest = () => {
    if (!dunedinPACE || !elovl2Age || !intrinsicCapacity) {
      Alert.alert('Error', 'Please enter all DNA methylation values');
      return;
    }

    // Calculate DNA methylation age
    const dunedin = parseFloat(dunedinPACE);
    const elovl2 = parseFloat(elovl2Age);
    const intrinsic = parseFloat(intrinsicCapacity);

    // DunedinPACE formula: Predicted age = chronological age + (DunedinPACE - 1) × 10
    const dunedinAge = chronologicalAge + (dunedin - 1) * 10;
    
    // Average with ELOVL2 age
    const avgAge = (dunedinAge + elovl2) / 2;
    
    // Adjust for intrinsic capacity (lower capacity = older biological age)
    const capacityAdjustment = (100 - intrinsic) / 10;
    const calculatedDnaMethylationAge = avgAge + capacityAdjustment;

    setDnaMethylationAge(calculatedDnaMethylationAge);
    setDnaModalVisible(false);
    
    Alert.alert(
      'DNA Methylation Age Calculated',
      `Your DNA methylation age is ${calculatedDnaMethylationAge.toFixed(1)} years`,
      [{ text: 'OK' }]
    );
  };

  const calculateBiomarkers = () => {
    // Validate inputs
    if (!salivarPH || !mmp8 || !flowRate || !hsCRP || !omega3 || !hba1c || !gdf15) {
      Alert.alert('Error', 'Please enter all Tier 1 biomarker values');
      return;
    }

    // Parse values
    const pH = parseFloat(salivarPH);
    const mmp8Val = parseFloat(mmp8);
    const flow = parseFloat(flowRate);
    const crp = parseFloat(hsCRP);
    const omega3Val = parseFloat(omega3);
    const hba1cVal = parseFloat(hba1c);
    const gdf15Val = parseFloat(gdf15);

    // Calculate Oral Health Score (0-100%)
    let oralScore = 100;
    if (pH < 6.5 || pH > 7.2) oralScore -= 15;
    if (mmp8Val > 60) oralScore -= 20;
    if (flow < 1.5) oralScore -= 15;
    oralScore = Math.max(0, oralScore);

    // Calculate Systemic Health Score (0-100%)
    let systemicScore = 100;
    if (crp > 1.0) systemicScore -= 15;
    if (omega3Val < 8.0) systemicScore -= 15;
    if (hba1cVal > 5.7) systemicScore -= 20;
    if (gdf15Val > 1200) systemicScore -= 20;
    systemicScore = Math.max(0, systemicScore);

    // Calculate Fitness Score (based on health scores)
    const avgHealth = (oralScore + systemicScore) / 2;
    let fitness;
    if (avgHealth >= 85) fitness = 90;
    else if (avgHealth >= 70) fitness = 75;
    else fitness = 60;

    // Calculate Praxiom Age
    let bioAge = dnaMethylationAge || chronologicalAge || 40;
    
    // Age adjustments based on biomarkers
    if (crp > 1.0) bioAge += 2;
    if (omega3Val < 8.0) bioAge += 1;
    if (hba1cVal > 5.7) bioAge += 1.5;
    if (gdf15Val > 1200) bioAge += 3;
    if (pH < 6.5 || pH > 7.2) bioAge += 1;
    if (mmp8Val > 60) bioAge += 2;
    if (flow < 1.5) bioAge += 0.5;

    // Tier 2 adjustments if entered
    if (showTier2 && il6 && tnfAlpha && apoB && homocysteine) {
      const il6Val = parseFloat(il6);
      const tnfVal = parseFloat(tnfAlpha);
      const apoBVal = parseFloat(apoB);
      const homocyVal = parseFloat(homocysteine);

      if (il6Val > 3) bioAge += 2;
      if (tnfVal > 5) bioAge += 1.5;
      if (apoBVal > 100) bioAge += 2;
      if (homocyVal > 12) bioAge += 1.5;
      
      // Better tier 2 compliance means lower age
      if (il6Val <= 3 && tnfVal <= 5 && apoBVal <= 100 && homocyVal <= 12) {
        bioAge -= 2; // Reward for good tier 2 biomarkers
      }
    }

    setOralHealthScore(Math.round(oralScore));
    setSystemicHealthScore(Math.round(systemicScore));
    setFitnessScore(Math.round(fitness));
    setPraxiomAge(parseFloat(bioAge.toFixed(1)));

    setBiomarkerModalVisible(false);
    saveData();

    Alert.alert(
      'Biomarkers Calculated',
      `Oral Health: ${Math.round(oralScore)}%\n` +
      `Systemic Health: ${Math.round(systemicScore)}%\n` +
      `Fitness Score: ${Math.round(fitness)}%\n` +
      `Praxiom Age: ${bioAge.toFixed(1)} years`,
      [{ text: 'OK' }]
    );
  };

  const savePersonInfo = async () => {
    try {
      const profile = {
        name: userName,
        email: userEmail,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
      };
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
      setPersonInfoModalVisible(false);
      Alert.alert('Success', 'Profile information saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile information');
    }
  };

  const handleTierUpgrade = () => {
    if (currentTier === 1) {
      // Check if Tier 1 biomarkers are entered
      if (!salivarPH || !mmp8 || !flowRate || !hsCRP || !omega3 || !hba1c || !gdf15) {
        Alert.alert(
          'Complete Tier 1 First',
          'Please complete all Tier 1 biomarker inputs before upgrading to Tier 2.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setShowTier2(true);
      setCurrentTier(2);
      AsyncStorage.setItem('currentTier', '2');
      
      Alert.alert(
        'Tier 2 Unlocked! 🎉',
        'You can now input advanced biomarkers:\n\n' +
        '• IL-6 (Inflammatory marker)\n' +
        '• TNF-α (Tumor necrosis factor)\n' +
        '• LDL Particles\n' +
        '• ApoB (Cardiovascular)\n' +
        '• Homocysteine\n' +
        '• Ferritin',
        [{ text: 'Got it!' }]
      );
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#4CAF50'; // Green
    if (score >= 70) return '#FFC107'; // Yellow/Orange
    return '#F44336'; // Red
  };

  return (
    <LinearGradient
      colors={['rgba(255, 140, 0, 0.15)', 'rgba(0, 207, 193, 0.15)']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo and Person Info */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>PH</Text>
            </View>
            <Text style={styles.headerTitle}>PRAXIOM{'\n'}HEALTH</Text>
          </View>
          <TouchableOpacity
            style={styles.personInfoButton}
            onPress={() => setPersonInfoModalVisible(true)}
          >
            <Text style={styles.personInfoIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Background Logo */}
        <View style={styles.backgroundLogoContainer}>
          <Text style={styles.backgroundLogo}>PH</Text>
        </View>

        {/* Date of Birth / Chronological Age */}
        <View style={styles.dobSection}>
          <TouchableOpacity
            style={styles.dobButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dobButtonText}>
              📅 {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Set Date of Birth'}
            </Text>
          </TouchableOpacity>
          {chronologicalAge !== null && (
            <Text style={styles.chronoAgeText}>Chronological Age: {chronologicalAge} years</Text>
          )}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Bio-Age Card */}
        <View style={styles.bioAgeCard}>
          <Text style={styles.cardLabel}>Praxiom Age</Text>
          <Text style={styles.bioAgeValue}>
            {praxiomAge !== null ? praxiomAge.toFixed(1) : '--'}
          </Text>
          <Text style={styles.cardUnit}>years</Text>
          {praxiomAge !== null && chronologicalAge !== null && (
            <Text style={styles.deviationText}>
              {praxiomAge < chronologicalAge ? '✅ ' : '⚠️ '}
              {Math.abs(praxiomAge - chronologicalAge).toFixed(1)} years{' '}
              {praxiomAge < chronologicalAge ? 'younger' : 'older'}
            </Text>
          )}
        </View>

        {/* Health Scores Row 1 */}
        <View style={styles.scoresRow}>
          <View style={[styles.scoreCard, { borderColor: '#FF8C00' }]}>
            <Text style={styles.cardLabel}>Oral Health</Text>
            <Text style={[styles.scoreValue, { color: oralHealthScore !== null ? getScoreColor(oralHealthScore) : '#999' }]}>
              {oralHealthScore !== null ? oralHealthScore : '--'}
            </Text>
            <Text style={styles.scoreUnit}>%</Text>
          </View>

          <View style={[styles.scoreCard, { borderColor: '#FF8C00' }]}>
            <Text style={styles.cardLabel}>Systemic Health</Text>
            <Text style={[styles.scoreValue, { color: systemicHealthScore !== null ? getScoreColor(systemicHealthScore) : '#999' }]}>
              {systemicHealthScore !== null ? systemicHealthScore : '--'}
            </Text>
            <Text style={styles.scoreUnit}>%</Text>
          </View>
        </View>

        {/* Health Scores Row 2 */}
        <View style={styles.scoresRow}>
          <View style={[styles.scoreCard, { borderColor: '#00CFC1' }]}>
            <Text style={styles.cardLabel}>Fitness Score</Text>
            <Text style={[styles.scoreValue, { color: fitnessScore !== null ? getScoreColor(fitnessScore) : '#999' }]}>
              {fitnessScore !== null ? fitnessScore : '--'}
            </Text>
            <Text style={styles.scoreUnit}>%</Text>
          </View>

          <View style={[styles.scoreCard, { borderColor: '#00CFC1' }]}>
            <Text style={styles.cardLabel}>Live Watch Data</Text>
            <View style={styles.wearableDataContainer}>
              <Text style={styles.wearableDataText}>💓 {wearableData.heartRate} bpm</Text>
              <Text style={styles.wearableDataText}>🚶 {wearableData.dailySteps} steps</Text>
              <Text style={styles.wearableDataText}>📊 HRV: {wearableData.hrv} ms</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
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

          <TouchableOpacity
            style={[styles.actionButton, styles.calculateButton]}
            onPress={calculateBiomarkers}
          >
            <Text style={styles.actionButtonText}>🔬 Calculate Tier 1 Biomarkers</Text>
          </TouchableOpacity>
        </View>

        {/* Tier Status */}
        <View style={styles.tierStatusContainer}>
          <Text style={styles.tierStatusText}>Current Tier: {currentTier}</Text>
          {currentTier === 1 && (
            <Text style={styles.tierStatusHint}>Complete Tier 1 to unlock Tier 2</Text>
          )}
        </View>
      </ScrollView>

      {/* DNA Methylation Modal */}
      <Modal
        visible={dnaModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>DNA Methylation Test</Text>
            <TouchableOpacity onPress={() => setDnaModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Enter Test Results</Text>
              
              <Text style={styles.inputLabel}>DunedinPACE</Text>
              <Text style={styles.inputHint}>Typical range: 0.6-1.4</Text>
              <TextInput
                style={styles.input}
                value={dunedinPACE}
                onChangeText={setDunedinPACE}
                keyboardType="numeric"
                placeholder="e.g., 1.0"
              />

              <Text style={styles.inputLabel}>ELOVL2 Methylation Age</Text>
              <Text style={styles.inputHint}>Predicted biological age (years)</Text>
              <TextInput
                style={styles.input}
                value={elovl2Age}
                onChangeText={setElovl2Age}
                keyboardType="numeric"
                placeholder="e.g., 45"
              />

              <Text style={styles.inputLabel}>Intrinsic Capacity Score</Text>
              <Text style={styles.inputHint}>Overall functional capacity (0-100%)</Text>
              <TextInput
                style={styles.input}
                value={intrinsicCapacity}
                onChangeText={setIntrinsicCapacity}
                keyboardType="numeric"
                placeholder="e.g., 85"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleDNATest}
              >
                <Text style={styles.submitButtonText}>Calculate DNA Age</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Biomarker Input Modal */}
      <Modal
        visible={biomarkerModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Biomarker Input</Text>
            <TouchableOpacity onPress={() => setBiomarkerModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Tier 1 - Oral Health */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Tier 1: Oral Health</Text>
              
              <Text style={styles.inputLabel}>Salivary pH</Text>
              <Text style={styles.inputHint}>Target: 6.5-7.2</Text>
              <TextInput
                style={styles.input}
                value={salivarPH}
                onChangeText={setSalivarPH}
                keyboardType="numeric"
                placeholder="e.g., 6.8"
              />

              <Text style={styles.inputLabel}>MMP-8 (ng/mL)</Text>
              <Text style={styles.inputHint}>Target: &lt;60</Text>
              <TextInput
                style={styles.input}
                value={mmp8}
                onChangeText={setMmp8}
                keyboardType="numeric"
                placeholder="e.g., 45"
              />

              <Text style={styles.inputLabel}>Flow Rate (mL/min)</Text>
              <Text style={styles.inputHint}>Target: &gt;1.5</Text>
              <TextInput
                style={styles.input}
                value={flowRate}
                onChangeText={setFlowRate}
                keyboardType="numeric"
                placeholder="e.g., 1.8"
              />
            </View>

            {/* Tier 1 - Systemic Health */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Tier 1: Systemic Health</Text>
              
              <Text style={styles.inputLabel}>hs-CRP (mg/L)</Text>
              <Text style={styles.inputHint}>Target: &lt;1.0</Text>
              <TextInput
                style={styles.input}
                value={hsCRP}
                onChangeText={setHsCRP}
                keyboardType="numeric"
                placeholder="e.g., 0.8"
              />

              <Text style={styles.inputLabel}>Omega-3 Index (%)</Text>
              <Text style={styles.inputHint}>Target: &gt;8.0</Text>
              <TextInput
                style={styles.input}
                value={omega3}
                onChangeText={setOmega3}
                keyboardType="numeric"
                placeholder="e.g., 8.5"
              />

              <Text style={styles.inputLabel}>HbA1c (%)</Text>
              <Text style={styles.inputHint}>Target: &lt;5.7</Text>
              <TextInput
                style={styles.input}
                value={hba1c}
                onChangeText={setHba1c}
                keyboardType="numeric"
                placeholder="e.g., 5.4"
              />

              <Text style={styles.inputLabel}>GDF-15 (pg/mL)</Text>
              <Text style={styles.inputHint}>Target: &lt;1200</Text>
              <TextInput
                style={styles.input}
                value={gdf15}
                onChangeText={setGdf15}
                keyboardType="numeric"
                placeholder="e.g., 1000"
              />

              <Text style={styles.inputLabel}>Vitamin D (ng/mL)</Text>
              <Text style={styles.inputHint}>Target: &gt;30</Text>
              <TextInput
                style={styles.input}
                value={vitaminD}
                onChangeText={setVitaminD}
                keyboardType="numeric"
                placeholder="e.g., 40"
              />
            </View>

            {/* Tier 2 Upgrade Button */}
            {!showTier2 && (
              <TouchableOpacity
                style={styles.tier2UpgradeButton}
                onPress={handleTierUpgrade}
              >
                <Text style={styles.tier2ButtonText}>⬆️ Upgrade to Tier 2</Text>
              </TouchableOpacity>
            )}

            {/* Tier 2 - Advanced Biomarkers */}
            {showTier2 && (
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Tier 2: Advanced Biomarkers</Text>
                
                <Text style={styles.inputLabel}>IL-6 (pg/mL)</Text>
                <Text style={styles.inputHint}>Target: &lt;3</Text>
                <TextInput
                  style={styles.input}
                  value={il6}
                  onChangeText={setIL6}
                  keyboardType="numeric"
                  placeholder="e.g., 2.5"
                />

                <Text style={styles.inputLabel}>TNF-α (pg/mL)</Text>
                <Text style={styles.inputHint}>Target: &lt;5</Text>
                <TextInput
                  style={styles.input}
                  value={tnfAlpha}
                  onChangeText={setTnfAlpha}
                  keyboardType="numeric"
                  placeholder="e.g., 4.2"
                />

                <Text style={styles.inputLabel}>LDL Particles (nmol/L)</Text>
                <Text style={styles.inputHint}>Target: &lt;1000</Text>
                <TextInput
                  style={styles.input}
                  value={ldlParticles}
                  onChangeText={setLdlParticles}
                  keyboardType="numeric"
                  placeholder="e.g., 850"
                />

                <Text style={styles.inputLabel}>ApoB (mg/dL)</Text>
                <Text style={styles.inputHint}>Target: &lt;100</Text>
                <TextInput
                  style={styles.input}
                  value={apoB}
                  onChangeText={setApoB}
                  keyboardType="numeric"
                  placeholder="e.g., 90"
                />

                <Text style={styles.inputLabel}>Homocysteine (μmol/L)</Text>
                <Text style={styles.inputHint}>Target: &lt;12</Text>
                <TextInput
                  style={styles.input}
                  value={homocysteine}
                  onChangeText={setHomocysteine}
                  keyboardType="numeric"
                  placeholder="e.g., 10"
                />

                <Text style={styles.inputLabel}>Ferritin (ng/mL)</Text>
                <Text style={styles.inputHint}>Target: 30-200</Text>
                <TextInput
                  style={styles.input}
                  value={ferritin}
                  onChangeText={setFerritin}
                  keyboardType="numeric"
                  placeholder="e.g., 80"
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={calculateBiomarkers}
            >
              <Text style={styles.submitButtonText}>
                Calculate {showTier2 ? 'Tier 1 + 2' : 'Tier 1'} Biomarkers
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Person Info Modal */}
      <Modal
        visible={personInfoModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setPersonInfoModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalSection}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={userEmail}
                onChangeText={setUserEmail}
                keyboardType="email-address"
                placeholder="Enter your email"
              />

              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dobPickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dobPickerText}>
                  {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select Date of Birth'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={savePersonInfo}
              >
                <Text style={styles.submitButtonText}>Save Information</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 140, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 20,
  },
  personInfoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 207, 193, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInfoIcon: {
    fontSize: 24,
  },
  backgroundLogoContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    opacity: 0.12,
    zIndex: -1,
  },
  backgroundLogo: {
    fontSize: 200,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  dobSection: {
    marginBottom: 20,
  },
  dobButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  dobButtonText: {
    fontSize: 14,
    color: '#9B59B6',
    fontWeight: '600',
  },
  chronoAgeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  bioAgeCard: {
    backgroundColor: 'rgba(0, 207, 193, 0.15)',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#00CFC1',
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bioAgeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00CFC1',
    marginVertical: 5,
  },
  deviationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 30,
    borderWidth: 3,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  cardUnit: {
    fontSize: 16,
    color: '#666',
  },
  scoreUnit: {
    fontSize: 16,
    color: '#666',
  },
  wearableDataContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  wearableDataText: {
    fontSize: 11,
    color: '#666',
    marginVertical: 2,
  },
  actionsContainer: {
    marginTop: 20,
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
    backgroundColor: '#9B59B6',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierStatusContainer: {
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  tierStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9B59B6',
  },
  tierStatusHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 32,
    color: '#999',
    fontWeight: '300',
  },
  modalScroll: {
    flex: 1,
  },
  modalSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00CFC1',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
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
  submitButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tier2UpgradeButton: {
    backgroundColor: '#9B59B6',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    margin: 20,
  },
  tier2ButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dobPickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  dobPickerText: {
    fontSize: 16,
    color: '#333',
  },
});
