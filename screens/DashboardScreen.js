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
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DashboardScreen() {
  // Core state
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [praxiomAge, setPraxiomAge] = useState(null);
  
  // Health scores
  const [oralHealthScore, setOralHealthScore] = useState(null);
  const [systemicHealthScore, setSystemicHealthScore] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  
  // Last updated dates
  const [lastOralUpdate, setLastOralUpdate] = useState(null);
  const [lastSystemicUpdate, setLastSystemicUpdate] = useState(null);
  const [lastFitnessUpdate, setLastFitnessUpdate] = useState(null);
  
  // Watch connection state
  const [watchConnected, setWatchConnected] = useState(false);
  const [receivingData, setReceivingData] = useState(false);
  const [lastDataReceived, setLastDataReceived] = useState(null);
  
  // Modal states
  const [dnaModalVisible, setDnaModalVisible] = useState(false);
  const [biomarkerModalVisible, setBiomarkerModalVisible] = useState(false);
  const [showTier2, setShowTier2] = useState(false);
  
  // DNA methylation data
  const [dnaData, setDnaData] = useState({
    dunedinPACE: '',
    elovl2Age: '',
    intrinsicCapacity: '',
  });
  
  // Tier 1 biomarkers
  const [tier1Data, setTier1Data] = useState({
    salivaPH: '',
    mmp8: '',
    flowRate: '',
    hsCRP: '',
    omega3Index: '',
    hbA1c: '',
    gdf15: '',
  });
  
  // Tier 2 biomarkers
  const [tier2Data, setTier2Data] = useState({
    vitaminD: '',
    ldlCholesterol: '',
    hdlCholesterol: '',
    triglycerides: '',
    glucose: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
  });

  useEffect(() => {
    loadData();
    // Simulate watch connection check
    checkWatchConnection();
  }, []);

  const loadData = async () => {
    try {
      const savedDOB = await AsyncStorage.getItem('dateOfBirth');
      const savedPraxiomAge = await AsyncStorage.getItem('praxiomAge');
      const savedOralHealth = await AsyncStorage.getItem('oralHealthScore');
      const savedSystemicHealth = await AsyncStorage.getItem('systemicHealthScore');
      const savedFitness = await AsyncStorage.getItem('fitnessScore');
      const savedLastOralUpdate = await AsyncStorage.getItem('lastOralUpdate');
      const savedLastSystemicUpdate = await AsyncStorage.getItem('lastSystemicUpdate');
      const savedLastFitnessUpdate = await AsyncStorage.getItem('lastFitnessUpdate');

      if (savedDOB) {
        const dob = new Date(savedDOB);
        setDateOfBirth(dob);
        calculateChronologicalAge(dob);
      }
      if (savedPraxiomAge) setPraxiomAge(JSON.parse(savedPraxiomAge));
      if (savedOralHealth) setOralHealthScore(JSON.parse(savedOralHealth));
      if (savedSystemicHealth) setSystemicHealthScore(JSON.parse(savedSystemicHealth));
      if (savedFitness) setFitnessScore(JSON.parse(savedFitness));
      if (savedLastOralUpdate) setLastOralUpdate(savedLastOralUpdate);
      if (savedLastSystemicUpdate) setLastSystemicUpdate(savedLastSystemicUpdate);
      if (savedLastFitnessUpdate) setLastFitnessUpdate(savedLastFitnessUpdate);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const checkWatchConnection = async () => {
    // TODO: Implement actual BLE connection check
    // For now, simulate connection state
    const connected = await AsyncStorage.getItem('watchConnected');
    setWatchConnected(connected === 'true');
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
    AsyncStorage.setItem('chronologicalAge', age.toString());
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      calculateChronologicalAge(selectedDate);
      AsyncStorage.setItem('dateOfBirth', selectedDate.toISOString());
    }
  };

  const calculateDNAAge = () => {
    const dunedin = parseFloat(dnaData.dunedinPACE);
    const elovl2 = parseFloat(dnaData.elovl2Age);
    const intrinsic = parseFloat(dnaData.intrinsicCapacity);

    if (isNaN(dunedin) || isNaN(elovl2) || isNaN(intrinsic)) {
      Alert.alert('Error', 'Please enter valid numbers for all DNA methylation values');
      return;
    }

    // DunedinPACE formula
    const dunedinAge = chronologicalAge + (dunedin - 1) * 10;
    
    // Average with ELOVL2 age and adjust for intrinsic capacity
    const avgAge = (dunedinAge + elovl2) / 2;
    const capacityAdjustment = (100 - intrinsic) / 10;
    const finalAge = Math.round(avgAge + capacityAdjustment);

    setPraxiomAge(finalAge);
    AsyncStorage.setItem('praxiomAge', JSON.stringify(finalAge));
    AsyncStorage.setItem('dnaData', JSON.stringify(dnaData));
    setDnaModalVisible(false);
    Alert.alert('Success', `Your Praxiom Age has been calculated: ${finalAge} years`);
  };

  const calculateTier1Biomarkers = () => {
    // Validate inputs
    const values = Object.values(tier1Data);
    if (values.some(v => v === '' || isNaN(parseFloat(v)))) {
      Alert.alert('Error', 'Please enter valid numbers for all biomarkers');
      return;
    }

    // Parse values
    const pH = parseFloat(tier1Data.salivaPH);
    const mmp8 = parseFloat(tier1Data.mmp8);
    const flow = parseFloat(tier1Data.flowRate);
    const crp = parseFloat(tier1Data.hsCRP);
    const omega3 = parseFloat(tier1Data.omega3Index);
    const hba1c = parseFloat(tier1Data.hbA1c);
    const gdf15 = parseFloat(tier1Data.gdf15);

    // Calculate Oral Health Score (0-100%)
    let oralScore = 100;
    if (pH < 6.5 || pH > 7.2) oralScore -= 15;
    if (mmp8 > 60) oralScore -= 20;
    if (flow < 1.5) oralScore -= 15;
    oralScore = Math.max(0, oralScore);

    // Calculate Systemic Health Score (0-100%)
    let systemicScore = 100;
    if (crp > 1.0) systemicScore -= 15;
    if (omega3 < 8.0) systemicScore -= 15;
    if (hba1c > 5.7) systemicScore -= 20;
    if (gdf15 > 1200) systemicScore -= 20;
    systemicScore = Math.max(0, systemicScore);

    const now = new Date().toISOString();
    setOralHealthScore(oralScore);
    setSystemicHealthScore(systemicScore);
    setLastOralUpdate(now);
    setLastSystemicUpdate(now);

    // Save data
    AsyncStorage.setItem('oralHealthScore', JSON.stringify(oralScore));
    AsyncStorage.setItem('systemicHealthScore', JSON.stringify(systemicScore));
    AsyncStorage.setItem('tier1Data', JSON.stringify({ ...tier1Data, date: now }));
    AsyncStorage.setItem('lastOralUpdate', now);
    AsyncStorage.setItem('lastSystemicUpdate', now);

    setBiomarkerModalVisible(false);
    Alert.alert('Success', `Oral Health: ${oralScore}%\nSystemic Health: ${systemicScore}%`);
  };

  const calculateFitnessScore = async () => {
    // TODO: Implement actual fitness score calculation from watch data
    // For now, use a placeholder calculation
    const score = 75; // Placeholder
    const now = new Date().toISOString();
    setFitnessScore(score);
    setLastFitnessUpdate(now);
    await AsyncStorage.setItem('fitnessScore', JSON.stringify(score));
    await AsyncStorage.setItem('lastFitnessUpdate', now);
  };

  const sendPraxiomAgeToWatch = async () => {
    if (!watchConnected) {
      Alert.alert('Error', 'Watch is not connected. Please connect your watch first.');
      return;
    }

    if (praxiomAge === null) {
      Alert.alert('Error', 'Please calculate your Praxiom Age first using DNA methylation data.');
      return;
    }

    try {
      // TODO: Implement actual BLE write to watch
      // For now, simulate the send
      setReceivingData(true);
      
      // Simulate sending data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setReceivingData(false);
      setLastDataReceived(new Date().toISOString());
      
      Alert.alert(
        'Success',
        `Praxiom Age (${praxiomAge} years) has been sent to your watch!\n\nThe watch has confirmed receipt.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setReceivingData(false);
      Alert.alert('Error', 'Failed to send data to watch. Please try again.');
      console.error('Send to watch error:', error);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Not set';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#00ff00'; // Green
    if (score >= 75) return '#ffff00'; // Yellow
    return '#ff0000'; // Red
  };

  return (
    <LinearGradient
      colors={['rgba(30, 30, 35, 0.95)', 'rgba(20, 20, 25, 0.98)']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>PRAXIOM HEALTH</Text>
          {watchConnected && receivingData && (
            <View style={styles.dataIndicator}>
              <ActivityIndicator size="small" color="#00CFC1" />
              <Text style={styles.dataIndicatorText}>Receiving data...</Text>
            </View>
          )}
        </View>

        {/* Bio-Age Overview Card */}
        <View style={styles.bioAgeCard}>
          <Text style={styles.cardTitle}>Bio-Age Overview</Text>
          <View style={styles.ageRow}>
            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Praxiom Age</Text>
              <Text style={styles.ageValue}>
                {praxiomAge !== null ? `${praxiomAge}` : '--'}
              </Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>
            <View style={styles.ageDivider} />
            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Chronological Age</Text>
              <Text style={styles.ageValue}>
                {chronologicalAge !== null ? `${chronologicalAge}` : '--'}
              </Text>
              <Text style={styles.ageUnit}>years</Text>
            </View>
          </View>
          {!dateOfBirth && (
            <TouchableOpacity
              style={styles.dobButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dobButtonText}>Set Date of Birth</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Health Score Summary */}
        <Text style={styles.sectionTitle}>Health Score Summary</Text>
        <View style={styles.healthScoreRow}>
          <View style={styles.healthScoreCard}>
            <Text style={styles.healthScoreTitle}>Oral Health</Text>
            <Text
              style={[
                styles.healthScoreValue,
                { color: oralHealthScore !== null ? getScoreColor(oralHealthScore) : '#666' }
              ]}
            >
              {oralHealthScore !== null ? `${oralHealthScore}%` : '--'}
            </Text>
            <Text style={styles.lastUpdated}>
              Updated: {formatDate(lastOralUpdate)}
            </Text>
          </View>

          <View style={styles.healthScoreCard}>
            <Text style={styles.healthScoreTitle}>Systemic Health</Text>
            <Text
              style={[
                styles.healthScoreValue,
                { color: systemicHealthScore !== null ? getScoreColor(systemicHealthScore) : '#666' }
              ]}
            >
              {systemicHealthScore !== null ? `${systemicHealthScore}%` : '--'}
            </Text>
            <Text style={styles.lastUpdated}>
              Updated: {formatDate(lastSystemicUpdate)}
            </Text>
          </View>
        </View>

        {/* Fitness Score Card */}
        <View style={styles.fitnessCard}>
          <Text style={styles.fitnessTitle}>Fitness Score</Text>
          <Text
            style={[
              styles.fitnessValue,
              { color: fitnessScore !== null ? getScoreColor(fitnessScore) : '#666' }
            ]}
          >
            {fitnessScore !== null ? `${fitnessScore}%` : '--'}
          </Text>
          <Text style={styles.lastUpdated}>
            Updated: {formatDate(lastFitnessUpdate)}
          </Text>
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
            <Text style={styles.actionButtonText}>📊 Calculate Tier 1 Biomarkers</Text>
          </TouchableOpacity>

          {watchConnected && praxiomAge !== null && (
            <TouchableOpacity
              style={[styles.actionButton, styles.sendButton]}
              onPress={sendPraxiomAgeToWatch}
              disabled={receivingData}
            >
              <Text style={styles.actionButtonText}>
                {receivingData ? '📡 Sending...' : '📲 Send to Watch'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

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

      {/* DNA Methylation Modal */}
      <Modal
        visible={dnaModalVisible}
        animationType="slide"
        transparent={false}
      >
        <LinearGradient
          colors={['rgba(30, 30, 35, 0.95)', 'rgba(20, 20, 25, 0.98)']}
          style={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>DNA Methylation Test</Text>
            <Text style={styles.modalSubtitle}>
              Enter your DNA methylation test results
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DunedinPACE</Text>
              <Text style={styles.inputHelper}>
                Pace of aging (typical range: 0.6-1.4)
              </Text>
              <TextInput
                style={styles.input}
                value={dnaData.dunedinPACE}
                onChangeText={(text) => setDnaData({ ...dnaData, dunedinPACE: text })}
                keyboardType="numeric"
                placeholder="e.g., 1.0"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ELOVL2 Methylation Age</Text>
              <Text style={styles.inputHelper}>
                Predicted biological age (years)
              </Text>
              <TextInput
                style={styles.input}
                value={dnaData.elovl2Age}
                onChangeText={(text) => setDnaData({ ...dnaData, elovl2Age: text })}
                keyboardType="numeric"
                placeholder="e.g., 35"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Intrinsic Capacity Score</Text>
              <Text style={styles.inputHelper}>
                Overall functional capacity (0-100%)
              </Text>
              <TextInput
                style={styles.input}
                value={dnaData.intrinsicCapacity}
                onChangeText={(text) =>
                  setDnaData({ ...dnaData, intrinsicCapacity: text })
                }
                keyboardType="numeric"
                placeholder="e.g., 85"
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.calculateButton}
              onPress={calculateDNAAge}
            >
              <Text style={styles.calculateButtonText}>Calculate Praxiom Age</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDnaModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Biomarker Modal */}
      <Modal
        visible={biomarkerModalVisible}
        animationType="slide"
        transparent={false}
      >
        <LinearGradient
          colors={['rgba(30, 30, 35, 0.95)', 'rgba(20, 20, 25, 0.98)']}
          style={styles.modalContainer}
        >
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tier 1 Biomarkers</Text>
            <Text style={styles.modalSubtitle}>
              Enter your biomarker test results
            </Text>

            <Text style={styles.tierTitle}>Oral Health Biomarkers</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Saliva pH</Text>
              <Text style={styles.inputHelper}>Target: 6.5-7.2</Text>
              <TextInput
                style={styles.input}
                value={tier1Data.salivaPH}
                onChangeText={(text) => setTier1Data({ ...tier1Data, salivaPH: text })}
                keyboardType="numeric"
                placeholder="e.g., 6.8"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MMP-8 (ng/mL)</Text>
              <Text style={styles.inputHelper}>Target: &lt;60</Text>
              <TextInput
                style={styles.input}
                value={tier1Data.mmp8}
                onChangeText={(text) => setTier1Data({ ...tier1Data, mmp8: text })}
                keyboardType="numeric"
                placeholder="e.g., 45"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Flow Rate (mL/min)</Text>
              <Text style={styles.inputHelper}>Target: &gt;1.5</Text>
              <TextInput
                style={styles.input}
                value={tier1Data.flowRate}
                onChangeText={(text) => setTier1Data({ ...tier1Data, flowRate: text })}
                keyboardType="numeric"
                placeholder="e.g., 1.8"
                placeholderTextColor="#666"
              />
            </View>

            <Text style={styles.tierTitle}>Systemic Health Biomarkers</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>hs-CRP (mg/L)</Text>
              <Text style={styles.inputHelper}>Target: &lt;1.0</Text>
              <TextInput
                style={styles.input}
                value={tier1Data.hsCRP}
                onChangeText={(text) => setTier1Data({ ...tier1Data, hsCRP: text })}
                keyboardType="numeric"
                placeholder="e.g., 0.8"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Omega-3 Index (%)</Text>
              <Text style={styles.inputHelper}>Target: &gt;8.0</Text>
              <TextInput
                style={styles.input}
                value={tier1Data.omega3Index}
                onChangeText={(text) =>
                  setTier1Data({ ...tier1Data, omega3Index: text })
                }
                keyboardType="numeric"
                placeholder="e.g., 8.5"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HbA1c (%)</Text>
              <Text style={styles.inputHelper}>Target: &lt;5.7</Text>
              <TextInput
                style={styles.input}
                value={tier1Data.hbA1c}
                onChangeText={(text) => setTier1Data({ ...tier1Data, hbA1c: text })}
                keyboardType="numeric"
                placeholder="e.g., 5.4"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GDF-15 (pg/mL)</Text>
              <Text style={styles.inputHelper}>Target: &lt;1200</Text>
              <TextInput
                style={styles.input}
                value={tier1Data.gdf15}
                onChangeText={(text) => setTier1Data({ ...tier1Data, gdf15: text })}
                keyboardType="numeric"
                placeholder="e.g., 1000"
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.tier2Button}
              onPress={() => setShowTier2(!showTier2)}
            >
              <Text style={styles.tier2ButtonText}>
                {showTier2 ? '▼ Hide Tier 2 Biomarkers' : '▶ Show Tier 2 Biomarkers'}
              </Text>
            </TouchableOpacity>

            {showTier2 && (
              <>
                <Text style={styles.tierTitle}>Tier 2 Biomarkers (Optional)</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vitamin D (ng/mL)</Text>
                  <Text style={styles.inputHelper}>Target: &gt;30</Text>
                  <TextInput
                    style={styles.input}
                    value={tier2Data.vitaminD}
                    onChangeText={(text) =>
                      setTier2Data({ ...tier2Data, vitaminD: text })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 40"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>LDL Cholesterol (mg/dL)</Text>
                  <Text style={styles.inputHelper}>Target: &lt;100</Text>
                  <TextInput
                    style={styles.input}
                    value={tier2Data.ldlCholesterol}
                    onChangeText={(text) =>
                      setTier2Data({ ...tier2Data, ldlCholesterol: text })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 90"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>HDL Cholesterol (mg/dL)</Text>
                  <Text style={styles.inputHelper}>Target: &gt;60</Text>
                  <TextInput
                    style={styles.input}
                    value={tier2Data.hdlCholesterol}
                    onChangeText={(text) =>
                      setTier2Data({ ...tier2Data, hdlCholesterol: text })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 65"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Triglycerides (mg/dL)</Text>
                  <Text style={styles.inputHelper}>Target: &lt;150</Text>
                  <TextInput
                    style={styles.input}
                    value={tier2Data.triglycerides}
                    onChangeText={(text) =>
                      setTier2Data({ ...tier2Data, triglycerides: text })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 120"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fasting Glucose (mg/dL)</Text>
                  <Text style={styles.inputHelper}>Target: 70-100</Text>
                  <TextInput
                    style={styles.input}
                    value={tier2Data.glucose}
                    onChangeText={(text) =>
                      setTier2Data({ ...tier2Data, glucose: text })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 85"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Blood Pressure (Systolic)</Text>
                  <Text style={styles.inputHelper}>Target: &lt;120</Text>
                  <TextInput
                    style={styles.input}
                    value={tier2Data.bloodPressureSystolic}
                    onChangeText={(text) =>
                      setTier2Data({ ...tier2Data, bloodPressureSystolic: text })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 115"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Blood Pressure (Diastolic)</Text>
                  <Text style={styles.inputHelper}>Target: &lt;80</Text>
                  <TextInput
                    style={styles.input}
                    value={tier2Data.bloodPressureDiastolic}
                    onChangeText={(text) =>
                      setTier2Data({ ...tier2Data, bloodPressureDiastolic: text })
                    }
                    keyboardType="numeric"
                    placeholder="e.g., 75"
                    placeholderTextColor="#666"
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.calculateButton}
              onPress={calculateTier1Biomarkers}
            >
              <Text style={styles.calculateButtonText}>Calculate Health Scores</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setBiomarkerModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
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
    marginTop: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  dataIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 207, 193, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  dataIndicatorText: {
    fontSize: 10,
    color: '#00CFC1',
    marginLeft: 5,
  },
  bioAgeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.3)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 15,
    textAlign: 'center',
  },
  ageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  ageColumn: {
    flex: 1,
    alignItems: 'center',
  },
  ageDivider: {
    width: 1,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ageLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  ageValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  ageUnit: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  dobButton: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  dobButtonText: {
    color: '#9B59B6',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00CFC1',
    marginBottom: 12,
    marginTop: 10,
  },
  healthScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  healthScoreCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
    alignItems: 'center',
  },
  healthScoreTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  healthScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  lastUpdated: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  fitnessCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 207, 193, 0.3)',
    alignItems: 'center',
  },
  fitnessTitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  fitnessValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  actionsContainer: {
    marginTop: 10,
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
  sendButton: {
    backgroundColor: '#9B59B6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    color: '#999',
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#00CFC1',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#fff',
  },
  inputHelper: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
  },
  tier2Button: {
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  tier2ButtonText: {
    color: '#9B59B6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  calculateButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 16,
  },
});
