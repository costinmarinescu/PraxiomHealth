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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DashboardScreen({ navigation, wearableService }) {
  // State for dashboard data
  const [praxiomAge, setPraxiomAge] = useState(null);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  const [oralHealthScore, setOralHealthScore] = useState(null);
  const [systemicHealthScore, setSystemicHealthScore] = useState(null);
  const [fitnessScore, setFitnessScore] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  
  // State for dates of last updates
  const [lastBiomarkerUpdate, setLastBiomarkerUpdate] = useState(null);
  const [lastDNAUpdate, setLastDNAUpdate] = useState(null);
  
  // State for wearable data
  const [heartRate, setHeartRate] = useState(null);
  const [hrvScore, setHrvScore] = useState(null);
  const [dailySteps, setDailySteps] = useState(null);
  const [sleepEfficiency, setSleepEfficiency] = useState(null);
  
  // State for watch connection
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pushingToWatch, setPushingToWatch] = useState(false);
  
  // Modal states
  const [biomarkerModalVisible, setBiomarkerModalVisible] = useState(false);
  const [dnaModalVisible, setDnaModalVisible] = useState(false);
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [showTier2, setShowTier2] = useState(false);
  
  // Biomarker inputs - Tier 1
  const [salivaryPH, setSalivaryPH] = useState('');
  const [mmp8, setMmp8] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [hsCRP, setHsCRP] = useState('');
  const [omega3, setOmega3] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [gdf15, setGdf15] = useState('');
  const [vitaminD, setVitaminD] = useState('');
  
  // Biomarker inputs - Tier 2
  const [ldlCholesterol, setLdlCholesterol] = useState('');
  const [hdlCholesterol, setHdlCholesterol] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [homocysteine, setHomocysteine] = useState('');
  const [interleukin6, setInterleukin6] = useState('');
  
  // DNA Methylation inputs
  const [dunedinPACE, setDunedinPACE] = useState('');
  const [elovl2Age, setElovl2Age] = useState('');
  
  useEffect(() => {
    loadStoredData();
    
    // Set up wearable data listener
    if (wearableService) {
      const unsubscribe = wearableService.onDataUpdate((data) => {
        if (data.heartRate) setHeartRate(data.heartRate);
        if (data.hrv) setHrvScore(data.hrv);
        if (data.steps) setDailySteps(data.steps);
        if (data.sleepEfficiency) setSleepEfficiency(data.sleepEfficiency);
      });
      
      // Check connection status
      wearableService.isConnected().then(setIsWatchConnected);
      
      return unsubscribe;
    }
  }, [wearableService]);
  
  const loadStoredData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('praxiomHealthData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setPraxiomAge(data.praxiomAge);
        setChronologicalAge(data.chronologicalAge);
        setOralHealthScore(data.oralHealthScore);
        setSystemicHealthScore(data.systemicHealthScore);
        setFitnessScore(data.fitnessScore);
        setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth) : null);
        setLastBiomarkerUpdate(data.lastBiomarkerUpdate);
        setLastDNAUpdate(data.lastDNAUpdate);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };
  
  const calculateChronologicalAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const decimal = (today - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 
                   (365.25 * 24 * 60 * 60 * 1000);
    return age + decimal;
  };
  
  const calculateOralHealthScore = (ph, mmp8Level, flow, chronAge) => {
    // Age-dependent coefficients
    const ageGroup = chronAge < 40 ? 'young' : chronAge < 60 ? 'middle' : 'senior';
    const weights = {
      young: { ph: 0.45, mmp8: 0.35, flow: 0.20 },
      middle: { ph: 0.40, mmp8: 0.40, flow: 0.20 },
      senior: { ph: 0.35, mmp8: 0.45, flow: 0.20 }
    };
    
    const w = weights[ageGroup];
    
    // Normalize pH (optimal 7.0-7.5)
    const phScore = ph >= 7.0 && ph <= 7.5 ? 100 : 
                   ph < 7.0 ? Math.max(0, 100 - (7.0 - ph) * 40) :
                   Math.max(0, 100 - (ph - 7.5) * 40);
    
    // Normalize MMP-8 (lower is better, >250 ng/mL is high risk)
    const mmp8Score = mmp8Level <= 100 ? 100 :
                     mmp8Level <= 250 ? 100 - ((mmp8Level - 100) / 150) * 40 :
                     Math.max(0, 60 - ((mmp8Level - 250) / 250) * 60);
    
    // Normalize flow rate (optimal 1.0-2.0 mL/min)
    const flowScore = flow >= 1.0 && flow <= 2.0 ? 100 :
                     flow < 1.0 ? Math.max(0, flow * 100) :
                     Math.max(0, 100 - (flow - 2.0) * 25);
    
    return (phScore * w.ph + mmp8Score * w.mmp8 + flowScore * w.flow);
  };
  
  const calculateSystemicHealthScore = (crp, omega, a1c, gdf, vd, chronAge, tier2Data = {}) => {
    // Age-dependent coefficients
    const ageGroup = chronAge < 40 ? 'young' : chronAge < 60 ? 'middle' : 'senior';
    
    // Base weights for Tier 1
    const baseWeights = {
      young: { crp: 0.25, omega: 0.20, a1c: 0.25, gdf: 0.15, vd: 0.15 },
      middle: { crp: 0.25, omega: 0.15, a1c: 0.30, gdf: 0.15, vd: 0.15 },
      senior: { crp: 0.20, omega: 0.15, a1c: 0.30, gdf: 0.20, vd: 0.15 }
    };
    
    let w = baseWeights[ageGroup];
    
    // Adjust weights if Tier 2 data available
    if (tier2Data.ldl || tier2Data.hdl || tier2Data.trig || tier2Data.hcy || tier2Data.il6) {
      w = {
        crp: 0.15, omega: 0.12, a1c: 0.18, gdf: 0.10, vd: 0.10,
        ldl: 0.10, hdl: 0.08, trig: 0.07, hcy: 0.05, il6: 0.05
      };
    }
    
    // Normalize hs-CRP (lower is better, >3 mg/L is high risk)
    const crpScore = crp <= 1 ? 100 :
                    crp <= 3 ? 100 - ((crp - 1) / 2) * 30 :
                    Math.max(0, 70 - ((crp - 3) / 7) * 70);
    
    // Normalize Omega-3 Index (higher is better, >8% is optimal)
    const omegaScore = omega >= 8 ? 100 :
                      omega >= 4 ? 50 + ((omega - 4) / 4) * 50 :
                      Math.max(0, (omega / 4) * 50);
    
    // Normalize HbA1c (lower is better, <5.7% is optimal)
    const a1cScore = a1c <= 5.7 ? 100 :
                    a1c <= 6.4 ? 100 - ((a1c - 5.7) / 0.7) * 40 :
                    Math.max(0, 60 - ((a1c - 6.4) / 2.6) * 60);
    
    // Normalize GDF-15 (lower is better, >1800 pg/mL is high risk)
    const gdfScore = gdf <= 800 ? 100 :
                    gdf <= 1800 ? 100 - ((gdf - 800) / 1000) * 30 :
                    Math.max(0, 70 - ((gdf - 1800) / 1200) * 70);
    
    // Normalize Vitamin D (optimal 40-60 ng/mL)
    const vdScore = vd >= 40 && vd <= 60 ? 100 :
                   vd < 40 ? Math.max(0, (vd / 40) * 100) :
                   Math.max(0, 100 - ((vd - 60) / 40) * 50);
    
    let totalScore = crpScore * w.crp + omegaScore * w.omega + a1cScore * w.a1c + 
                    gdfScore * w.gdf + vdScore * w.vd;
    
    // Add Tier 2 scores if available
    if (tier2Data.ldl) {
      const ldlScore = tier2Data.ldl <= 100 ? 100 :
                      tier2Data.ldl <= 130 ? 100 - ((tier2Data.ldl - 100) / 30) * 30 :
                      Math.max(0, 70 - ((tier2Data.ldl - 130) / 90) * 70);
      totalScore += ldlScore * w.ldl;
    }
    
    if (tier2Data.hdl) {
      const hdlScore = tier2Data.hdl >= 60 ? 100 :
                      tier2Data.hdl >= 40 ? 50 + ((tier2Data.hdl - 40) / 20) * 50 :
                      Math.max(0, (tier2Data.hdl / 40) * 50);
      totalScore += hdlScore * w.hdl;
    }
    
    if (tier2Data.trig) {
      const trigScore = tier2Data.trig <= 100 ? 100 :
                       tier2Data.trig <= 150 ? 100 - ((tier2Data.trig - 100) / 50) * 30 :
                       Math.max(0, 70 - ((tier2Data.trig - 150) / 350) * 70);
      totalScore += trigScore * w.trig;
    }
    
    if (tier2Data.hcy) {
      const hcyScore = tier2Data.hcy <= 10 ? 100 :
                      tier2Data.hcy <= 15 ? 100 - ((tier2Data.hcy - 10) / 5) * 40 :
                      Math.max(0, 60 - ((tier2Data.hcy - 15) / 15) * 60);
      totalScore += hcyScore * w.hcy;
    }
    
    if (tier2Data.il6) {
      const il6Score = tier2Data.il6 <= 2 ? 100 :
                      tier2Data.il6 <= 5 ? 100 - ((tier2Data.il6 - 2) / 3) * 40 :
                      Math.max(0, 60 - ((tier2Data.il6 - 5) / 10) * 60);
      totalScore += il6Score * w.il6;
    }
    
    return totalScore;
  };
  
  const calculateBioAge = (oralScore, systemicScore, fitnessScoreVal, chronAge, dnaData = {}) => {
    // Base calculation from scores
    const avgScore = (oralScore + systemicScore + (fitnessScoreVal || 75)) / 3;
    const scoreDeviation = (avgScore - 75) / 75; // Normalized deviation from baseline
    
    // Age-dependent acceleration factors
    const ageGroup = chronAge < 40 ? 0.15 : chronAge < 60 ? 0.25 : 0.35;
    
    let bioAge = chronAge - (scoreDeviation * chronAge * ageGroup);
    
    // Apply DNA methylation adjustments if available
    if (dnaData.dunedinPACE) {
      // DunedinPACE represents pace of aging (1.0 = normal)
      const paceAdjustment = (dnaData.dunedinPACE - 1.0) * chronAge * 0.3;
      bioAge += paceAdjustment;
    }
    
    if (dnaData.elovl2Age) {
      // ELOVL2 gives predicted age directly
      const elovlDiff = dnaData.elovl2Age - chronAge;
      bioAge += elovlDiff * 0.2; // Weight the ELOVL2 age difference
    }
    
    return Math.max(18, Math.min(bioAge, chronAge + 20)); // Cap at +20 years max
  };
  
  const handleCalculateBiomarkers = () => {
    if (!dateOfBirth) {
      Alert.alert('Missing Data', 'Please set your date of birth first.');
      return;
    }
    
    const chronAge = calculateChronologicalAge(dateOfBirth);
    setChronologicalAge(chronAge);
    
    // Validate Tier 1 inputs
    if (!salivaryPH || !mmp8 || !flowRate || !hsCRP || !omega3 || !hba1c || !gdf15 || !vitaminD) {
      Alert.alert('Missing Data', 'Please fill in all Tier 1 biomarkers.');
      return;
    }
    
    // Calculate scores
    const oralScore = calculateOralHealthScore(
      parseFloat(salivaryPH),
      parseFloat(mmp8),
      parseFloat(flowRate),
      chronAge
    );
    
    const tier2Data = showTier2 && ldlCholesterol && hdlCholesterol && triglycerides && homocysteine && interleukin6 ? {
      ldl: parseFloat(ldlCholesterol),
      hdl: parseFloat(hdlCholesterol),
      trig: parseFloat(triglycerides),
      hcy: parseFloat(homocysteine),
      il6: parseFloat(interleukin6)
    } : {};
    
    const systemicScore = calculateSystemicHealthScore(
      parseFloat(hsCRP),
      parseFloat(omega3),
      parseFloat(hba1c),
      parseFloat(gdf15),
      parseFloat(vitaminD),
      chronAge,
      tier2Data
    );
    
    // Use wearable data for fitness score if available, otherwise use default
    const fitness = fitnessScore || 75;
    
    const dnaData = dunedinPACE && elovl2Age ? {
      dunedinPACE: parseFloat(dunedinPACE),
      elovl2Age: parseFloat(elovl2Age)
    } : {};
    
    const bioAge = calculateBioAge(oralScore, systemicScore, fitness, chronAge, dnaData);
    
    // Update state
    setOralHealthScore(oralScore);
    setSystemicHealthScore(systemicScore);
    setPraxiomAge(bioAge);
    
    const now = new Date().toISOString();
    setLastBiomarkerUpdate(now);
    
    // Save to storage
    const dataToSave = {
      praxiomAge: bioAge,
      chronologicalAge: chronAge,
      oralHealthScore: oralScore,
      systemicHealthScore: systemicScore,
      fitnessScore: fitness,
      dateOfBirth: dateOfBirth.toISOString(),
      lastBiomarkerUpdate: now,
      lastDNAUpdate: lastDNAUpdate
    };
    
    AsyncStorage.setItem('praxiomHealthData', JSON.stringify(dataToSave));
    
    setBiomarkerModalVisible(false);
    
    // Check if Tier 2 should be triggered
    if (!showTier2 && (oralScore < 75 || systemicScore < 75)) {
      Alert.alert(
        'Tier 2 Recommended',
        'Your health scores indicate that advanced biomarker testing (Tier 2) may provide more accurate results. Would you like to add Tier 2 biomarkers?',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Add Tier 2', onPress: () => { setShowTier2(true); setBiomarkerModalVisible(true); } }
        ]
      );
    }
    
    // Auto-push to watch after calculation
    if (isWatchConnected && wearableService) {
      setTimeout(() => {
        handlePushToWatch();
      }, 500);
    }
  };
  
  const handlePushToWatch = async () => {
    if (!isWatchConnected || !wearableService) {
      Alert.alert('Not Connected', 'Please connect to your Praxiom watch first.');
      return;
    }
    
    if (!praxiomAge) {
      Alert.alert('No Data', 'Please calculate your Praxiom Age first.');
      return;
    }
    
    Alert.alert(
      'Push to Watch',
      `Send your Praxiom Age (${praxiomAge.toFixed(1)}) to your watch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setPushingToWatch(true);
              await wearableService.sendBioAge(praxiomAge);
              setLastSyncTime(new Date());
              Alert.alert('Success', 'Data sent to your watch!');
            } catch (error) {
              Alert.alert('Error', 'Failed to send data to watch: ' + error.message);
            } finally {
              setPushingToWatch(false);
            }
          }
        }
      ]
    );
  };
  
  const handleDNASubmit = () => {
    if (!dunedinPACE || !elovl2Age) {
      Alert.alert('Missing Data', 'Please fill in all DNA methylation data.');
      return;
    }
    
    // Recalculate with DNA data
    if (praxiomAge && chronologicalAge) {
      const dnaData = {
        dunedinPACE: parseFloat(dunedinPACE),
        elovl2Age: parseFloat(elovl2Age)
      };
      
      const updatedBioAge = calculateBioAge(
        oralHealthScore,
        systemicHealthScore,
        fitnessScore || 75,
        chronologicalAge,
        dnaData
      );
      
      setPraxiomAge(updatedBioAge);
      
      const now = new Date().toISOString();
      setLastDNAUpdate(now);
      
      // Save to storage
      const dataToSave = {
        praxiomAge: updatedBioAge,
        chronologicalAge,
        oralHealthScore,
        systemicHealthScore,
        fitnessScore: fitnessScore || 75,
        dateOfBirth: dateOfBirth.toISOString(),
        lastBiomarkerUpdate,
        lastDNAUpdate: now
      };
      
      AsyncStorage.setItem('praxiomHealthData', JSON.stringify(dataToSave));
    }
    
    setDnaModalVisible(false);
    
    // Auto-push to watch after DNA update
    if (isWatchConnected && wearableService) {
      setTimeout(() => {
        handlePushToWatch();
      }, 500);
    }
  };
  
  const handleDOBChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setDobPickerVisible(false);
    }
    
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      const chronAge = calculateChronologicalAge(selectedDate);
      setChronologicalAge(chronAge);
      
      // Save DOB
      AsyncStorage.getItem('praxiomHealthData').then(data => {
        const existing = data ? JSON.parse(data) : {};
        existing.dateOfBirth = selectedDate.toISOString();
        existing.chronologicalAge = chronAge;
        AsyncStorage.setItem('praxiomHealthData', JSON.stringify(existing));
      });
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>PRAXIOM HEALTH</Text>
        </View>
        
        {/* Bio-Age Overview Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bio-Age Overview</Text>
          <View style={styles.ageRow}>
            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Praxiom Age</Text>
              <Text style={styles.ageNumber}>
                {praxiomAge ? praxiomAge.toFixed(1) : '--'}
              </Text>
            </View>
            <View style={styles.ageDivider} />
            <View style={styles.ageColumn}>
              <Text style={styles.ageLabel}>Chronological Age</Text>
              <Text style={styles.ageNumber}>
                {chronologicalAge ? chronologicalAge.toFixed(1) : '--'}
              </Text>
            </View>
          </View>
          
          {lastBiomarkerUpdate && (
            <Text style={styles.updateText}>
              Biomarkers: {formatDate(lastBiomarkerUpdate)}
            </Text>
          )}
          {lastDNAUpdate && (
            <Text style={styles.updateText}>
              DNA: {formatDate(lastDNAUpdate)}
            </Text>
          )}
          
          {isWatchConnected && lastSyncTime && (
            <View style={styles.syncIndicator}>
              <Text style={styles.syncText}>
                ✓ Synced {lastSyncTime.toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Push to Watch Button */}
        {isWatchConnected && praxiomAge && (
          <TouchableOpacity
            style={styles.pushButton}
            onPress={handlePushToWatch}
            disabled={pushingToWatch}
          >
            {pushingToWatch ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.pushButtonText}>📡 Push to Watch</Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Health Score Summary */}
        <Text style={styles.sectionTitle}>Health Score Summary</Text>
        <View style={styles.scoreRow}>
          <View style={[styles.scoreCard, { backgroundColor: 'rgba(255, 140, 0, 0.15)' }]}>
            <Text style={styles.scoreLabel}>Oral Health</Text>
            <Text style={styles.scoreNumber}>
              {oralHealthScore ? `${oralHealthScore.toFixed(0)}%` : '--'}
            </Text>
          </View>
          
          <View style={[styles.scoreCard, { backgroundColor: 'rgba(0, 207, 193, 0.15)' }]}>
            <Text style={styles.scoreLabel}>Systemic Health</Text>
            <Text style={styles.scoreNumber}>
              {systemicHealthScore ? `${systemicHealthScore.toFixed(0)}%` : '--'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.scoreCard, styles.fitnessCard, { backgroundColor: 'rgba(155, 89, 182, 0.15)' }]}>
          <Text style={styles.scoreLabel}>Fitness Score</Text>
          <Text style={styles.scoreNumber}>
            {fitnessScore ? `${fitnessScore.toFixed(0)}%` : '75%'}
          </Text>
        </View>
        
        {/* Wearable Data (if connected) */}
        {isWatchConnected && (
          <>
            <Text style={styles.sectionTitle}>Live Wearable Data</Text>
            <View style={styles.wearableGrid}>
              <View style={styles.wearableItem}>
                <Text style={styles.wearableLabel}>Heart Rate</Text>
                <Text style={styles.wearableValue}>
                  {heartRate ? `${heartRate} bpm` : '--'}
                </Text>
              </View>
              
              <View style={styles.wearableItem}>
                <Text style={styles.wearableLabel}>HRV</Text>
                <Text style={styles.wearableValue}>
                  {hrvScore ? hrvScore : '--'}
                </Text>
              </View>
              
              <View style={styles.wearableItem}>
                <Text style={styles.wearableLabel}>Daily Steps</Text>
                <Text style={styles.wearableValue}>
                  {dailySteps ? dailySteps.toLocaleString() : '--'}
                </Text>
              </View>
              
              <View style={styles.wearableItem}>
                <Text style={styles.wearableLabel}>Sleep</Text>
                <Text style={styles.wearableValue}>
                  {sleepEfficiency ? `${sleepEfficiency}%` : '--'}
                </Text>
              </View>
            </View>
          </>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.biomarkerButton]}
            onPress={() => setBiomarkerModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>🧬 Input Biomarkers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dnaButton]}
            onPress={() => setDnaModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>🔬 DNA Methylation Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dobButton]}
            onPress={() => setDobPickerVisible(true)}
          >
            <Text style={styles.actionButtonText}>
              📅 {dateOfBirth ? 'Update' : 'Set'} Date of Birth
            </Text>
          </TouchableOpacity>
          
          {dateOfBirth && (
            <Text style={styles.dobDisplay}>
              DOB: {dateOfBirth.toLocaleDateString()}
            </Text>
          )}
        </View>
      </ScrollView>
      
      {/* Biomarker Input Modal */}
      <Modal
        visible={biomarkerModalVisible}
        animationType="slide"
        onRequestClose={() => setBiomarkerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Biomarker Input</Text>
              <TouchableOpacity onPress={() => setBiomarkerModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Tier 1: Foundation Assessment</Text>
              
              {/* Oral Health Biomarkers */}
              <Text style={styles.subsectionTitle}>Oral Health</Text>
              
              <Text style={styles.inputLabel}>Salivary pH</Text>
              <Text style={styles.inputHint}>Normal: 7.0-7.5</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={salivaryPH}
                onChangeText={setSalivaryPH}
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>MMP-8 Level (ng/mL)</Text>
              <Text style={styles.inputHint}>Normal: &lt;100</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={mmp8}
                onChangeText={setMmp8}
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Salivary Flow Rate (mL/min)</Text>
              <Text style={styles.inputHint}>Normal: 1.0-2.0</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={flowRate}
                onChangeText={setFlowRate}
                keyboardType="decimal-pad"
              />
              
              {/* Systemic Health Biomarkers */}
              <Text style={styles.subsectionTitle}>Systemic Health</Text>
              
              <Text style={styles.inputLabel}>hs-CRP (mg/L)</Text>
              <Text style={styles.inputHint}>Normal: &lt;1.0</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={hsCRP}
                onChangeText={setHsCRP}
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Omega-3 Index (%)</Text>
              <Text style={styles.inputHint}>Optimal: &gt;8%</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={omega3}
                onChangeText={setOmega3}
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>HbA1c (%)</Text>
              <Text style={styles.inputHint}>Normal: &lt;5.7%</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={hba1c}
                onChangeText={setHba1c}
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>GDF-15 (pg/mL)</Text>
              <Text style={styles.inputHint}>Normal: &lt;800</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={gdf15}
                onChangeText={setGdf15}
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Vitamin D (ng/mL)</Text>
              <Text style={styles.inputHint}>Optimal: 40-60</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value"
                value={vitaminD}
                onChangeText={setVitaminD}
                keyboardType="decimal-pad"
              />
              
              {/* Tier 2 Section */}
              {!showTier2 && (
                <TouchableOpacity
                  style={styles.tier2UpgradeButton}
                  onPress={() => setShowTier2(true)}
                >
                  <Text style={styles.tier2ButtonText}>+ Add Tier 2 Biomarkers</Text>
                </TouchableOpacity>
              )}
              
              {showTier2 && (
                <>
                  <Text style={styles.sectionTitle}>Tier 2: Advanced Assessment</Text>
                  
                  <Text style={styles.inputLabel}>LDL Cholesterol (mg/dL)</Text>
                  <Text style={styles.inputHint}>Optimal: &lt;100</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter value"
                    value={ldlCholesterol}
                    onChangeText={setLdlCholesterol}
                    keyboardType="decimal-pad"
                  />
                  
                  <Text style={styles.inputLabel}>HDL Cholesterol (mg/dL)</Text>
                  <Text style={styles.inputHint}>Optimal: &gt;60</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter value"
                    value={hdlCholesterol}
                    onChangeText={setHdlCholesterol}
                    keyboardType="decimal-pad"
                  />
                  
                  <Text style={styles.inputLabel}>Triglycerides (mg/dL)</Text>
                  <Text style={styles.inputHint}>Normal: &lt;150</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter value"
                    value={triglycerides}
                    onChangeText={setTriglycerides}
                    keyboardType="decimal-pad"
                  />
                  
                  <Text style={styles.inputLabel}>Homocysteine (μmol/L)</Text>
                  <Text style={styles.inputHint}>Normal: &lt;10</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter value"
                    value={homocysteine}
                    onChangeText={setHomocysteine}
                    keyboardType="decimal-pad"
                  />
                  
                  <Text style={styles.inputLabel}>Interleukin-6 (pg/mL)</Text>
                  <Text style={styles.inputHint}>Normal: &lt;2</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter value"
                    value={interleukin6}
                    onChangeText={setInterleukin6}
                    keyboardType="decimal-pad"
                  />
                </>
              )}
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCalculateBiomarkers}
              >
                <Text style={styles.submitButtonText}>Calculate Praxiom Age</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      {/* DNA Methylation Modal */}
      <Modal
        visible={dnaModalVisible}
        animationType="slide"
        onRequestClose={() => setDnaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>DNA Methylation Test</Text>
              <TouchableOpacity onPress={() => setDnaModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Epigenetic Age Markers</Text>
              
              <Text style={styles.inputLabel}>DunedinPACE</Text>
              <Text style={styles.inputHint}>Pace of aging (1.0 = normal, &gt;1.0 = faster)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter value (e.g., 0.95)"
                value={dunedinPACE}
                onChangeText={setDunedinPACE}
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>ELOVL2 Predicted Age</Text>
              <Text style={styles.inputHint}>Biological age from ELOVL2 marker</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age (e.g., 42.5)"
                value={elovl2Age}
                onChangeText={setElovl2Age}
                keyboardType="decimal-pad"
              />
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleDNASubmit}
              >
                <Text style={styles.submitButtonText}>Update Bio-Age with DNA Data</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Date Picker */}
      {dobPickerVisible && (
        <DateTimePicker
          value={dateOfBirth || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDOBChange}
          maximumDate={new Date()}
        />
      )}
      
      {Platform.OS === 'ios' && dobPickerVisible && (
        <View style={styles.iosPickerContainer}>
          <TouchableOpacity
            style={styles.iosPickerButton}
            onPress={() => setDobPickerVisible(false)}
          >
            <Text style={styles.iosPickerButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  ageLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    textAlign: 'center',
  },
  ageNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  updateText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  syncIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 8,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  pushButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pushButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 15,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fitnessCard: {
    marginHorizontal: 0,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  wearableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  wearableItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  wearableLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 6,
  },
  wearableValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtons: {
    marginTop: 10,
  },
  actionButton: {
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  biomarkerButton: {
    backgroundColor: '#00CFC1',
  },
  dnaButton: {
    backgroundColor: '#FF8C00',
  },
  dobButton: {
    backgroundColor: '#9B59B6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dobDisplay: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalScroll: {
    flex: 1,
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
  modalSection: {
    padding: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
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
  tier2UpgradeButton: {
    backgroundColor: '#9B59B6',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
  },
  tier2ButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#00CFC1',
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00CFC1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 10,
  },
  iosPickerButton: {
    alignItems: 'center',
    padding: 12,
  },
  iosPickerButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
});
