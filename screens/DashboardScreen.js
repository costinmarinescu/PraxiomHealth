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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import BLEService from '../services/BLEService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  // User profile
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chronologicalAge, setChronologicalAge] = useState(53);

  // Bio-Age data
  const [praxiomAge, setPraxiomAge] = useState(53.0);
  const [bioAgeDeviation, setBioAgeDeviation] = useState(0.0);

  // Health scores
  const [oralHealthScore, setOralHealthScore] = useState(100);
  const [systemicHealthScore, setSystemicHealthScore] = useState(100);
  const [fitnessScore, setFitnessScore] = useState(85);

  // Modals
  const [dnaModalVisible, setDnaModalVisible] = useState(false);
  const [biomarkerModalVisible, setBiomarkerModalVisible] = useState(false);
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
  const [homaIR, setHomaIR] = useState('');
  const [apoB, setApoB] = useState('');
  const [nadPlus, setNadPlus] = useState('');

  // Wearable data - initialized from BLEService
  const [wearableData, setWearableData] = useState({
    hrv: 45,
    heartRate: 68,
    sleepEfficiency: 87,
    dailySteps: 8432,
    connected: BLEService.isConnected(),
  });

  // Load saved data on mount and listen to BLE events
  useEffect(() => {
    loadData();

    // Define the listener for BLE events
    const onBleEvent = (event) => {
      console.log('DashboardScreen received BLE event:', event);
      if (event.type === 'connected') {
        setWearableData(prev => ({ ...prev, connected: true }));
      } else if (event.type === 'disconnected') {
        setWearableData(prev => ({ ...prev, connected: false }));
      } else if (event.type === 'heartRate') {
        setWearableData(prev => ({ ...prev, heartRate: event.data.heartRate }));
      } else if (event.type === 'steps') {
        setWearableData(prev => ({ ...prev, dailySteps: event.data }));
      }
    };

    // Add the listener
    BLEService.addListener(onBleEvent);

    // Check initial connection status
    const isConnected = BLEService.isConnected();
    if (isConnected) {
      setWearableData(prev => ({ ...prev, connected: true }));
    }

    // Cleanup: remove the listener when the component is unmounted
    return () => {
      BLEService.removeListener(onBleEvent);
    };
  }, []);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('healthData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setChronologicalAge(data.chronologicalAge || 53);
        setPraxiomAge(data.praxiomAge || 53.0);
        setBioAgeDeviation(data.bioAgeDeviation || 0.0);
        setOralHealthScore(data.oralHealthScore || 100);
        setSystemicHealthScore(data.systemicHealthScore || 100);
        setFitnessScore(data.fitnessScore || 85);
        setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth) : null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem('healthData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      const age = calculateAge(selectedDate);
      setChronologicalAge(age);
      saveData({
        chronologicalAge: age,
        praxiomAge,
        bioAgeDeviation,
        oralHealthScore,
        systemicHealthScore,
        fitnessScore,
        dateOfBirth: selectedDate.toISOString()
      });
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Bio-Age Calculation Algorithm
  const calculateBioAge = () => {
    if (!salivarPH || !mmp8 || !flowRate || !hsCRP || !omega3 || !hba1c || !gdf15 || !vitaminD) {
      Alert.alert('Missing Data', 'Please enter all Tier 1 biomarkers to calculate Bio-Age.');
      return;
    }

    const ph = parseFloat(salivarPH);
    const mmp = parseFloat(mmp8);
    const flow = parseFloat(flowRate);
    const crp = parseFloat(hsCRP);
    const o3 = parseFloat(omega3);
    const hb = parseFloat(hba1c);
    const gdf = parseFloat(gdf15);
    const vitD = parseFloat(vitaminD);

    // Calculate scores
    const phScore = (ph >= 6.5 && ph <= 7.2) ? 100 : (ph < 6.5 ? 50 : 75);
    const mmpScore = mmp < 60 ? 100 : (mmp < 100 ? 75 : 50);
    const flowScore = flow > 1.5 ? 100 : (flow > 1.0 ? 75 : 50);
    const ohs = ((mmpScore * 2.5) + (phScore * 1.0) + (flowScore * 1.0)) / 4.5;

    const crpScore = crp < 1.0 ? 100 : (crp < 3.0 ? 75 : 50);
    const o3Score = o3 > 8.0 ? 100 : (o3 > 6.0 ? 75 : 50);
    const gdfScore = gdf < 1200 ? 100 : (gdf < 1800 ? 75 : 50);
    const hbScore = hb < 5.7 ? 100 : (hb < 6.5 ? 75 : 50);
    const vitDScore = vitD > 30 ? 100 : (vitD > 20 ? 75 : 50);
    const shs = ((crpScore * 2.0) + (o3Score * 2.0) + (gdfScore * 2.0) + (hbScore * 1.5) + (vitDScore * 1.0)) / 9.5;

    const fitness = (ohs + shs) / 2;

    // Age coefficients
    let alpha, beta;
    if (chronologicalAge < 50) {
      alpha = 0.08; beta = 0.15;
    } else if (chronologicalAge <= 70) {
      alpha = 0.12; beta = 0.20;
    } else {
      alpha = 0.15; beta = 0.25;
    }

    const calculatedBioAge = chronologicalAge + ((100 - ohs) * alpha + (100 - shs) * beta);
    const deviation = calculatedBioAge - chronologicalAge;

    setOralHealthScore(Math.round(ohs));
    setSystemicHealthScore(Math.round(shs));
    setFitnessScore(Math.round(fitness));
    setPraxiomAge(calculatedBioAge.toFixed(1));
    setBioAgeDeviation(deviation.toFixed(1));

    saveData({
      chronologicalAge,
      praxiomAge: calculatedBioAge.toFixed(1),
      bioAgeDeviation: deviation.toFixed(1),
      oralHealthScore: Math.round(ohs),
      systemicHealthScore: Math.round(shs),
      fitnessScore: Math.round(fitness),
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
    });

    setBiomarkerModalVisible(false);
    Alert.alert('Success', `Bio-Age calculated: ${calculatedBioAge.toFixed(1)} years`);
  };

  const handlePushToWatch = async () => {
    try {
      if (!BLEService.isConnected()) {
        Alert.alert(
          'Watch Not Connected',
          'Please go to the Watch tab and connect to your PineTime watch first.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Push to Watch',
        `Send Bio-Age ${praxiomAge} years to PineTime watch?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async () => {
              try {
                console.log('📤 Dashboard: Attempting to send Bio-Age to watch...');
                await BLEService.sendPraxiomAge(parseFloat(praxiomAge));
                await AsyncStorage.setItem('bioAgeForWatch', praxiomAge.toString());
                console.log('✅ Dashboard: Bio-Age sent successfully!');
                Alert.alert(
                  'Success!',
                  `Bio-Age ${praxiomAge} years sent to watch successfully.\n\nCheck your watch - the age should update within 1-2 seconds!`
                );
              } catch (error) {
                console.error('❌ Dashboard: Send error:', error);
                Alert.alert(
                  'Error',
                  `Failed to send Bio-Age: ${error.message}\n\nMake sure your watch is still connected.`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handlePushToWatch:', error);
      Alert.alert('Error', 'Failed to send data to watch.');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#4CAF50';
    if (score >= 75) return '#FFC107';
    return '#FF5252';
  };

  const getScoreStatus = (score) => {
    if (score >= 85) return '🟢';
    if (score >= 75) return '🟡';
    return '🔴';
  };

  return (
    <LinearGradient colors={['#FF8C00', '#00CFC1']} style={styles.container}>
      <View style={styles.backgroundLogoContainer}>
        <Text style={styles.backgroundLogo}>PRAXIOM</Text>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>PRAXIOM{'\n'}HEALTH</Text>

        {/* Bio-Age Overview Card */}
        <View style={styles.bioAgeCard}>
          <View style={styles.bioAgeHeader}>
            <Text style={styles.bioAgeIcon}>🧬</Text>
            <Text style={styles.cardTitle}>Bio-Age Overview</Text>
          </View>
          <View style={styles.agesContainer}>
            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Chronological Age</Text>
              <Text style={styles.ageValue}>{chronologicalAge}</Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Praxiom Age</Text>
              <Text style={[styles.ageValue, styles.praxiomAgeValue]}>{praxiomAge}</Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>
          </View>
          <View style={styles.deviationContainer}>
            <Text style={styles.deviationLabel}>Bio-Age Deviation:</Text>
            <Text style={[styles.deviationValue, { color: bioAgeDeviation < 0 ? '#4CAF50' : '#FF5252' }]}>
              {bioAgeDeviation} years
            </Text>
          </View>
          <Text style={styles.goalText}>
            Goal: Reduce biological age by 3-10 years through tiered longevity protocol
          </Text>
        </View>

        {/* Health Score Summary */}
        <View style={styles.bioAgeCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.sectionTitle}>Health Score Summary</Text>
          </View>
          <View style={styles.scoresContainer}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Oral Health</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(oralHealthScore) }]}>
                {oralHealthScore}%
              </Text>
              <Text style={styles.targetText}>Target: &gt;85%</Text>
              <Text style={styles.statusIndicator}>{getScoreStatus(oralHealthScore)}</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Systemic Health</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(systemicHealthScore) }]}>
                {systemicHealthScore}%
              </Text>
              <Text style={styles.targetText}>Target: &gt;85%</Text>
              <Text style={styles.statusIndicator}>{getScoreStatus(systemicHealthScore)}</Text>
            </View>
          </View>
          <View style={styles.scoresContainer}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Fitness Score</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(fitnessScore) }]}>
                {fitnessScore}%
              </Text>
              <Text style={styles.targetText}>Target: &gt;85%</Text>
              <Text style={styles.statusIndicator}>{getScoreStatus(fitnessScore)}</Text>
            </View>
            <View style={[styles.scoreCard, wearableData.connected && styles.wearableConnectedCard]}>
              <Text style={styles.scoreLabel}>Wearable Data</Text>
              {wearableData.connected ? (
                <>
                  <Text style={[styles.scoreValue, { color: '#00CFC1' }]}>{wearableData.hrv}ms</Text>
                  <Text style={styles.targetText}>HRV (RMSSD)</Text>
                  <View style={styles.wearableSubData}>
                    <Text style={styles.wearableSubText}>{wearableData.heartRate} BPM</Text>
                    <Text style={styles.wearableSubText}>{wearableData.dailySteps} steps</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.scoreValue, { color: '#999' }]}>--</Text>
                  <Text style={styles.targetText}>No watch data</Text>
                </>
              )}
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
            style={[styles.actionButton, styles.dobButton]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.actionButtonText}>📅 Set Date of Birth</Text>
          </TouchableOpacity>
          {wearableData.connected && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={handlePushToWatch}
            >
              <Text style={styles.actionButtonText}>⌚ Push Bio-Age to Watch</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* DNA Methylation Test Modal */}
        <Modal visible={dnaModalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>DNA Methylation Test</Text>
              <Text style={styles.modalSubtitle}>Tier 3: Optimization/Mastery</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DunedinPACE (Pace of Aging)</Text>
                <Text style={styles.inputHelper}>Optimal: &lt;1.0 (1.0 = normal aging rate)</Text>
                <TextInput
                  style={styles.input}
                  value={dunedinPACE}
                  onChangeText={setDunedinPACE}
                  placeholder="e.g., 0.95"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ELOVL2 Methylation Age</Text>
                <Text style={styles.inputHelper}>Should be close to chronological age</Text>
                <TextInput
                  style={styles.input}
                  value={elovl2Age}
                  onChangeText={setElovl2Age}
                  placeholder="e.g., 52"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Intrinsic Capacity Score</Text>
                <Text style={styles.inputHelper}>Optimal: &gt;85% of ideal function</Text>
                <TextInput
                  style={styles.input}
                  value={intrinsicCapacity}
                  onChangeText={setIntrinsicCapacity}
                  placeholder="e.g., 88"
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.calculateButton}
                onPress={() => {
                  setDnaModalVisible(false);
                  Alert.alert('DNA Test Saved', 'Epigenetic data has been recorded.');
                }}
              >
                <Text style={styles.calculateButtonText}>Save DNA Test Results</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={() => setDnaModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Biomarker Input Modal */}
        <Modal visible={biomarkerModalVisible} animationType="slide">
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Input Biomarkers</Text>
              <Text style={styles.tierTitle}>Tier 1: Foundation</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Salivary pH</Text>
                <Text style={styles.inputHelper}>Optimal: 6.5-7.2</Text>
                <TextInput
                  style={styles.input}
                  value={salivarPH}
                  onChangeText={setSalivarPH}
                  placeholder="e.g., 6.8"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MMP-8 (ng/mL)</Text>
                <Text style={styles.inputHelper}>Optimal: &lt;60 ng/mL</Text>
                <TextInput
                  style={styles.input}
                  value={mmp8}
                  onChangeText={setMmp8}
                  placeholder="e.g., 45"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Saliva Flow Rate (mL/min)</Text>
                <Text style={styles.inputHelper}>Optimal: &gt;1.5 mL/min</Text>
                <TextInput
                  style={styles.input}
                  value={flowRate}
                  onChangeText={setFlowRate}
                  placeholder="e.g., 1.6"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>hs-CRP (mg/L)</Text>
                <Text style={styles.inputHelper}>Optimal: &lt;1.0 mg/L</Text>
                <TextInput
                  style={styles.input}
                  value={hsCRP}
                  onChangeText={setHsCRP}
                  placeholder="e.g., 0.8"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Omega-3 Index (%)</Text>
                <Text style={styles.inputHelper}>Optimal: &gt;8.0%</Text>
                <TextInput
                  style={styles.input}
                  value={omega3}
                  onChangeText={setOmega3}
                  placeholder="e.g., 8.5"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HbA1c (%)</Text>
                <Text style={styles.inputHelper}>Optimal: &lt;5.7%</Text>
                <TextInput
                  style={styles.input}
                  value={hba1c}
                  onChangeText={setHba1c}
                  placeholder="e.g., 5.4"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GDF-15 (pg/mL)</Text>
                <Text style={styles.inputHelper}>Optimal: &lt;1200 pg/mL</Text>
                <TextInput
                  style={styles.input}
                  value={gdf15}
                  onChangeText={setGdf15}
                  placeholder="e.g., 1100"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vitamin D (ng/mL)</Text>
                <Text style={styles.inputHelper}>Optimal: &gt;30 ng/mL</Text>
                <TextInput
                  style={styles.input}
                  value={vitaminD}
                  onChangeText={setVitaminD}
                  placeholder="e.g., 45"
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.tier2Button}
                onPress={() => setShowTier2(!showTier2)}
              >
                <Text style={styles.tier2ButtonText}>
                  {showTier2 ? '▼ Hide Tier 2 Biomarkers' : '▶ Show Tier 2 Biomarkers (Advanced)'}
                </Text>
              </TouchableOpacity>

              {showTier2 && (
                <>
                  <Text style={styles.tierTitle}>Tier 2: Personalization</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>IL-6 (pg/mL)</Text>
                    <Text style={styles.inputHelper}>Optimal: &lt;3.0 pg/mL</Text>
                    <TextInput
                      style={styles.input}
                      value={il6}
                      onChangeText={setIL6}
                      placeholder="e.g., 2.5"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>TNF-α (pg/mL)</Text>
                    <Text style={styles.inputHelper}>Optimal: &lt;10 pg/mL</Text>
                    <TextInput
                      style={styles.input}
                      value={tnfAlpha}
                      onChangeText={setTnfAlpha}
                      placeholder="e.g., 8"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>HOMA-IR</Text>
                    <Text style={styles.inputHelper}>Optimal: &lt;2.0</Text>
                    <TextInput
                      style={styles.input}
                      value={homaIR}
                      onChangeText={setHomaIR}
                      placeholder="e.g., 1.5"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ApoB (mg/dL)</Text>
                    <Text style={styles.inputHelper}>Optimal: &lt;80 mg/dL</Text>
                    <TextInput
                      style={styles.input}
                      value={apoB}
                      onChangeText={setApoB}
                      placeholder="e.g., 75"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>NAD+ (µM)</Text>
                    <Text style={styles.inputHelper}>Age-adjusted optimal range</Text>
                    <TextInput
                      style={styles.input}
                      value={nadPlus}
                      onChangeText={setNadPlus}
                      placeholder="e.g., 40"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.calculateButton} onPress={calculateBioAge}>
                <Text style={styles.calculateButtonText}>Calculate Bio-Age</Text>
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
  container: { flex: 1 },
  backgroundLogoContainer: { position: 'absolute', top: '35%', left: 0, right: 0, alignItems: 'center', zIndex: -1 },
  backgroundLogo: { fontSize: 120, fontWeight: '900', color: 'rgba(0, 207, 193, 0.05)', letterSpacing: 10 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 20, lineHeight: 22 },
  bioAgeCard: { backgroundColor: '#fff', borderRadius: 30, padding: 25, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  bioAgeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  bioAgeIcon: { fontSize: 24, marginRight: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  agesContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20 },
  ageColumn: { alignItems: 'center', flex: 1 },
  ageLabel: { fontSize: 14, color: '#666', marginBottom: 8, textAlign: 'center' },
  ageValue: { fontSize: 42, fontWeight: 'bold', color: '#333' },
  praxiomAgeValue: { color: '#FF8C00' },
  ageUnit: { fontSize: 14, color: '#999', marginTop: 4 },
  divider: { width: 1, height: 60, backgroundColor: '#E0E0E0', marginHorizontal: 15 },
  deviationContainer: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deviationLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  deviationValue: { fontSize: 18, fontWeight: 'bold' },
  goalText: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  summaryIcon: { fontSize: 24, marginRight: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  scoresContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  scoreCard: { backgroundColor: '#fff', borderRadius: 30, padding: 20, width: (SCREEN_WIDTH - 60) / 2, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  wearableConnectedCard: { borderWidth: 2, borderColor: '#00CFC1' },
  scoreLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 10, textAlign: 'center' },
  scoreValue: { fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  targetText: { fontSize: 12, color: '#999', marginBottom: 8 },
  statusIndicator: { fontSize: 20 },
  wearableSubData: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 5 },
  wearableSubText: { fontSize: 10, color: '#666', flex: 1, textAlign: 'center' },
  actionsContainer: { marginTop: 10 },
  actionButton: { padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  dnaButton: { backgroundColor: '#FF8C00' },
  biomarkerButton: { backgroundColor: '#00CFC1' },
  dobButton: { backgroundColor: '#9B59B6' },
  actionButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalContent: { padding: 20, paddingTop: 50 },
  modalTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#333' },
  modalSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 25, color: '#666' },
  tierTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 15, color: '#00CFC1' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#333' },
  inputHelper: { fontSize: 12, color: '#999', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 15, padding: 15, fontSize: 16, backgroundColor: '#f9f9f9' },
  tier2Button: { backgroundColor: '#9B59B6', padding: 18, borderRadius: 30, alignItems: 'center', marginVertical: 20 },
  tier2ButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  calculateButton: { backgroundColor: '#00CFC1', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 30, marginBottom: 15 },
  calculateButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeButton: { padding: 15, alignItems: 'center' },
  closeButtonText: { color: '#666', fontSize: 16 },
});
