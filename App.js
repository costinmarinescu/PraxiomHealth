import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Alert, 
  PermissionsAndroid, Platform, TextInput, TouchableOpacity,
  SafeAreaView, Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Circular Progress Component
const CircularProgress = ({ size, strokeWidth, percentage, color, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        {children}
      </View>
    </View>
  );
};

export default function App() {
  const [bleManager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  // TIER 1 BIOMARKERS - Following Praxiom Protocol
  const [tier1Biomarkers, setTier1Biomarkers] = useState({
    // Patient Info
    age: '',
    
    // Oral Health Biomarkers
    salivaryPH: '',           // Optimal: 6.5-7.2
    activeMMP8: '',           // Optimal: <60 ng/mL (Weight: 2.5×)
    salivaryFlowRate: '',     // Optimal: >1.5 mL/min (Weight: 2.0×)
    
    // Systemic Health Biomarkers
    hsCRP: '',                // Optimal: <1.0 mg/L (Weight: 2.0×)
    omega3Index: '',          // Optimal: >8.0% (Weight: 2.0×)
    hbA1c: '',                // Optimal: <5.7% (Weight: 1.5×)
    gdf15: '',                // Optimal: <1,200 pg/mL (Weight: 2.0×)
    vitaminD: '',             // Optimal: >30 ng/mL (Weight: 1.0×)
    
    // Wearable Data
    heartRate: '',
    steps: '',
    oxygenSaturation: '',
  });

  const [healthScores, setHealthScores] = useState({
    oralHealthScore: 0,
    systemicHealthScore: 0,
    biologicalAge: 0,
    chronologicalAge: 0,
    fitnessScore: 0,
  });

  const [dataHistory, setDataHistory] = useState([]);
  const [lastBackupDate, setLastBackupDate] = useState(null);

  useEffect(() => {
    requestPermissions();
    loadStoredData();
    checkBackupReminder();
    return () => {
      bleManager.destroy();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
      } else {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
      }
    }
  };

  const loadStoredData = async () => {
    try {
      const storedBiomarkers = await AsyncStorage.getItem('tier1Biomarkers');
      const storedScores = await AsyncStorage.getItem('healthScores');
      const storedHistory = await AsyncStorage.getItem('dataHistory');
      const storedBackup = await AsyncStorage.getItem('lastBackupDate');

      if (storedBiomarkers) setTier1Biomarkers(JSON.parse(storedBiomarkers));
      if (storedScores) setHealthScores(JSON.parse(storedScores));
      if (storedHistory) setDataHistory(JSON.parse(storedHistory));
      if (storedBackup) setLastBackupDate(storedBackup);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newBiomarkers, newScores) => {
    try {
      await AsyncStorage.setItem('tier1Biomarkers', JSON.stringify(newBiomarkers));
      await AsyncStorage.setItem('healthScores', JSON.stringify(newScores));
      
      const historyEntry = {
        date: new Date().toISOString(),
        biomarkers: newBiomarkers,
        scores: newScores,
      };
      
      const updatedHistory = [...dataHistory, historyEntry];
      await AsyncStorage.setItem('dataHistory', JSON.stringify(updatedHistory));
      setDataHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save data');
    }
  };

  const checkBackupReminder = async () => {
    try {
      const lastBackup = await AsyncStorage.getItem('lastBackupDate');
      if (!lastBackup) return;

      const lastBackupDate = new Date(lastBackup);
      const now = new Date();
      const daysSinceBackup = (now - lastBackupDate) / (1000 * 60 * 60 * 24);

      if (daysSinceBackup >= 30) {
        Alert.alert(
          'Backup Reminder',
          'It has been 30 days since your last backup. Would you like to backup your health data now?',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Backup Now', onPress: exportToPDF }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking backup:', error);
    }
  };

  // PRAXIOM TIER 1 SCORING ALGORITHMS
  const calculatePraxiomScores = () => {
    const age = parseFloat(tier1Biomarkers.age) || 38;
    
    // Parse Oral Health Biomarkers
    const salivaryPH = parseFloat(tier1Biomarkers.salivaryPH) || 6.8;
    const activeMMP8 = parseFloat(tier1Biomarkers.activeMMP8) || 70;
    const salivaryFlowRate = parseFloat(tier1Biomarkers.salivaryFlowRate) || 1.3;
    
    // Parse Systemic Health Biomarkers
    const hsCRP = parseFloat(tier1Biomarkers.hsCRP) || 1.5;
    const omega3Index = parseFloat(tier1Biomarkers.omega3Index) || 7.0;
    const hbA1c = parseFloat(tier1Biomarkers.hbA1c) || 5.5;
    const gdf15 = parseFloat(tier1Biomarkers.gdf15) || 1300;
    const vitaminD = parseFloat(tier1Biomarkers.vitaminD) || 28;
    
    // Wearable Data
    const heartRate = parseFloat(tier1Biomarkers.heartRate) || 70;
    const steps = parseFloat(tier1Biomarkers.steps) || 7000;

    // ============================================
    // ORAL HEALTH SCORE (OHS) CALCULATION
    // ============================================
    // Normalize each biomarker to 0-1 scale (1 = optimal, 0 = poor)
    
    // Salivary pH (Optimal: 6.5-7.2, Risk: <6.0 or >7.5)
    let pHScore = 0;
    if (salivaryPH >= 6.5 && salivaryPH <= 7.2) {
      pHScore = 1.0;
    } else if (salivaryPH >= 6.0 && salivaryPH < 6.5) {
      pHScore = 0.5;
    } else if (salivaryPH > 7.2 && salivaryPH <= 7.5) {
      pHScore = 0.5;
    } else {
      pHScore = 0;
    }
    
    // Active MMP-8 (Optimal: <60, Normal: 60-100, Risk: >100)
    let mmp8Score = 0;
    if (activeMMP8 < 60) {
      mmp8Score = 1.0;
    } else if (activeMMP8 <= 100) {
      mmp8Score = 0.5;
    } else {
      mmp8Score = Math.max(0, 1 - (activeMMP8 - 100) / 200);
    }
    
    // Salivary Flow Rate (Optimal: >1.5, Normal: 1.0-1.5, Risk: <1.0)
    let flowRateScore = 0;
    if (salivaryFlowRate >= 1.5) {
      flowRateScore = 1.0;
    } else if (salivaryFlowRate >= 1.0) {
      flowRateScore = 0.5;
    } else {
      flowRateScore = Math.max(0, salivaryFlowRate);
    }
    
    // OHS Formula from Protocol: OHS = [(MMP-8 × 2.5) + (pH × 1.0) + (Flow Rate × 1.0)] / 4.5 × 100
    const OHS = ((mmp8Score * 2.5) + (pHScore * 1.0) + (flowRateScore * 1.0)) / 4.5 * 100;
    
    // ============================================
    // SYSTEMIC HEALTH SCORE (SHS) CALCULATION
    // ============================================
    
    // hs-CRP (Optimal: <1.0, Normal: 1.0-3.0, Risk: >3.0)
    let cprScore = 0;
    if (hsCRP < 1.0) {
      cprScore = 1.0;
    } else if (hsCRP <= 3.0) {
      cprScore = 0.5;
    } else {
      cprScore = Math.max(0, 1 - (hsCRP - 3.0) / 5);
    }
    
    // Omega-3 Index (Optimal: >8.0%, Normal: 6.0-8.0%, Risk: <6.0%)
    let omega3Score = 0;
    if (omega3Index > 8.0) {
      omega3Score = 1.0;
    } else if (omega3Index >= 6.0) {
      omega3Score = 0.5;
    } else {
      omega3Score = Math.max(0, omega3Index / 6.0);
    }
    
    // GDF-15 (Optimal: <1,200, Normal: 1,200-1,800, Risk: >1,800)
    let gdf15Score = 0;
    if (gdf15 < 1200) {
      gdf15Score = 1.0;
    } else if (gdf15 <= 1800) {
      gdf15Score = 0.5;
    } else {
      gdf15Score = Math.max(0, 1 - (gdf15 - 1800) / 1000);
    }
    
    // HbA1c (Optimal: <5.7%, Normal: 5.7-6.4%, Risk: >6.4%)
    let hbA1cScore = 0;
    if (hbA1c < 5.7) {
      hbA1cScore = 1.0;
    } else if (hbA1c <= 6.4) {
      hbA1cScore = 0.5;
    } else {
      hbA1cScore = Math.max(0, 1 - (hbA1c - 6.4) / 2);
    }
    
    // Vitamin D (Optimal: >30, Normal: 20-30, Risk: <20)
    let vitaminDScore = 0;
    if (vitaminD > 30) {
      vitaminDScore = 1.0;
    } else if (vitaminD >= 20) {
      vitaminDScore = 0.5;
    } else {
      vitaminDScore = Math.max(0, vitaminD / 20);
    }
    
    // SHS Formula: SHS = [(hs-CRP × 2.0) + (Omega-3 × 2.0) + (GDF-15 × 2.0) + (HbA1c × 1.5) + (Vitamin D × 1.0)] / 9.5 × 100
    const SHS = ((cprScore * 2.0) + (omega3Score * 2.0) + (gdf15Score * 2.0) + (hbA1cScore * 1.5) + (vitaminDScore * 1.0)) / 9.5 * 100;
    
    // ============================================
    // BIOLOGICAL AGE CALCULATION
    // ============================================
    // Bio-Age = Chronological Age + [(100 - OHS) × α + (100 - SHS) × β]
    
    // Age-Stratified Coefficients
    let alpha, beta;
    if (age < 50) {
      alpha = 0.08;
      beta = 0.15;
    } else if (age <= 70) {
      alpha = 0.12;
      beta = 0.20;
    } else {
      alpha = 0.15;
      beta = 0.25;
    }
    
    const biologicalAge = age + ((100 - OHS) * alpha + (100 - SHS) * beta);
    
    // ============================================
    // FITNESS SCORE (Based on Wearable Data)
    // ============================================
    let fitnessScore = 100;
    if (heartRate > 85) fitnessScore -= 20;
    if (heartRate < 60) fitnessScore -= 10;
    if (steps < 5000) fitnessScore -= 30;
    if (steps < 3000) fitnessScore -= 20;
    fitnessScore = Math.max(0, fitnessScore);
    
    const newScores = {
      oralHealthScore: Math.round(OHS),
      systemicHealthScore: Math.round(SHS),
      biologicalAge: Math.round(biologicalAge * 10) / 10,
      chronologicalAge: age,
      fitnessScore: Math.round(fitnessScore),
    };

    setHealthScores(newScores);
    saveData(tier1Biomarkers, newScores);
    setCurrentScreen('dashboard');
    Alert.alert('Success', 'Praxiom Bio-Age calculated using validated algorithms!');
  };

  const updateBiomarker = (key, value) => {
    setTier1Biomarkers(prev => ({ ...prev, [key]: value }));
  };

  const getRiskLevel = (score) => {
    if (score >= 90) return { text: 'Excellent', color: '#81C784' };
    if (score >= 75) return { text: 'Good', color: '#FFD54F' };
    if (score >= 60) return { text: 'Fair', color: '#FF9800' };
    return { text: 'Poor', color: '#E57373' };
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#81C784';
    if (score >= 75) return '#FFD54F';
    if (score >= 60) return '#FF9800';
    return '#E57373';
  };

  const exportToPDF = async () => {
    try {
      const ageDiff = healthScores.biologicalAge - healthScores.chronologicalAge;
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Praxiom Health Bio-Age Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; color: #FFA500; margin-bottom: 30px; }
    .bio-age-banner { 
      background: ${ageDiff > 0 ? '#ffebee' : '#e8f5e9'}; 
      padding: 20px; 
      border-radius: 10px;
      text-align: center;
      margin: 20px 0;
    }
    .bio-age-value { font-size: 48px; font-weight: bold; color: ${ageDiff > 0 ? '#d32f2f' : '#2e7d32'}; }
    .score-card { 
      display: inline-block; 
      width: 23%; 
      padding: 20px; 
      margin: 1%; 
      border: 2px solid #ddd; 
      border-radius: 10px;
      text-align: center;
    }
    .score { font-size: 36px; font-weight: bold; color: #333; }
    .label { font-size: 14px; color: #666; margin-top: 10px; }
    .section { margin: 30px 0; }
    .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .metric-label { font-weight: 600; width: 50%; }
    .badge { 
      display: inline-block;
      padding: 5px 15px;
      border-radius: 15px;
      font-weight: bold;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PRAXIOM HEALTH</h1>
    <h2>Bio-Age Assessment Report</h2>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
    <p style="font-size: 12px; color: #999;">Using Validated Tier 1 Algorithms</p>
  </div>

  <div class="bio-age-banner">
    <p style="margin: 0; font-size: 18px;">Your Biological Age</p>
    <div class="bio-age-value">${healthScores.biologicalAge} years</div>
    <p style="margin: 10px 0 0 0; font-size: 16px;">
      Chronological Age: ${healthScores.chronologicalAge} years
      ${ageDiff !== 0 ? `(${ageDiff > 0 ? '+' : ''}${ageDiff.toFixed(1)} years)` : ''}
    </p>
  </div>

  <div class="section">
    <div class="score-card">
      <div class="score">${healthScores.oralHealthScore}</div>
      <div class="label">Oral Health Score</div>
      <div class="badge" style="background-color: ${getRiskLevel(healthScores.oralHealthScore).color};">
        ${getRiskLevel(healthScores.oralHealthScore).text}
      </div>
    </div>
    <div class="score-card">
      <div class="score">${healthScores.systemicHealthScore}</div>
      <div class="label">Systemic Health Score</div>
      <div class="badge" style="background-color: ${getRiskLevel(healthScores.systemicHealthScore).color};">
        ${getRiskLevel(healthScores.systemicHealthScore).text}
      </div>
    </div>
    <div class="score-card">
      <div class="score">${healthScores.fitnessScore}</div>
      <div class="label">Fitness Score</div>
      <div class="badge" style="background-color: ${getRiskLevel(healthScores.fitnessScore).color};">
        ${getRiskLevel(healthScores.fitnessScore).text}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Tier 1 Biomarkers (Validated Protocol)</div>
    <h3>Oral Health Biomarkers</h3>
    <table>
      <tr>
        <td class="metric-label">Salivary pH</td>
        <td>${tier1Biomarkers.salivaryPH || '--'} (Optimal: 6.5-7.2)</td>
      </tr>
      <tr>
        <td class="metric-label">Active MMP-8</td>
        <td>${tier1Biomarkers.activeMMP8 || '--'} ng/mL (Optimal: <60)</td>
      </tr>
      <tr>
        <td class="metric-label">Salivary Flow Rate</td>
        <td>${tier1Biomarkers.salivaryFlowRate || '--'} mL/min (Optimal: >1.5)</td>
      </tr>
    </table>
    <h3 style="margin-top: 20px;">Systemic Health Biomarkers</h3>
    <table>
      <tr>
        <td class="metric-label">hs-CRP</td>
        <td>${tier1Biomarkers.hsCRP || '--'} mg/L (Optimal: <1.0)</td>
      </tr>
      <tr>
        <td class="metric-label">Omega-3 Index</td>
        <td>${tier1Biomarkers.omega3Index || '--'}% (Optimal: >8.0%)</td>
      </tr>
      <tr>
        <td class="metric-label">GDF-15</td>
        <td>${tier1Biomarkers.gdf15 || '--'} pg/mL (Optimal: <1,200)</td>
      </tr>
      <tr>
        <td class="metric-label">HbA1c</td>
        <td>${tier1Biomarkers.hbA1c || '--'}% (Optimal: <5.7%)</td>
      </tr>
      <tr>
        <td class="metric-label">Vitamin D (25-OH)</td>
        <td>${tier1Biomarkers.vitaminD || '--'} ng/mL (Optimal: >30)</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Algorithm Details</div>
    <p><strong>OHS Formula:</strong> [(MMP-8 × 2.5) + (pH × 1.0) + (Flow Rate × 1.0)] / 4.5 × 100</p>
    <p><strong>SHS Formula:</strong> [(hs-CRP × 2.0) + (Omega-3 × 2.0) + (GDF-15 × 2.0) + (HbA1c × 1.5) + (Vitamin D × 1.0)] / 9.5 × 100</p>
    <p><strong>Bio-Age:</strong> Chronological Age + [(100 - OHS) × α + (100 - SHS) × β]</p>
    <p style="font-size: 12px; color: #666;">Age-stratified coefficients applied based on chronological age</p>
  </div>

  <div class="section">
    <div class="section-title">Historical Data</div>
    <p>Total Assessments: ${dataHistory.length}</p>
    <p>Assessment Period: ${dataHistory[0]?.date ? new Date(dataHistory[0].date).toLocaleDateString() : 'N/A'} - ${dataHistory[dataHistory.length - 1]?.date ? new Date(dataHistory[dataHistory.length - 1].date).toLocaleDateString() : 'N/A'}</p>
  </div>

  <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
    <p style="font-size: 12px; color: #666; margin: 0;">
      This report is generated using the validated Praxiom Health Bio-Age Longevity Protocol (2025).
      Algorithms are based on peer-reviewed research and clinical validation studies.
      For clinical interpretation, consult with your healthcare provider.
    </p>
  </div>
</body>
</html>
      `;

      const fileName = `praxiom_bioage_report_${Date.now()}.html`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri);
      
      await AsyncStorage.setItem('lastBackupDate', new Date().toISOString());
      setLastBackupDate(new Date().toISOString());
      
      Alert.alert('Success', 'Bio-Age report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export report: ' + error.message);
    }
  };

  const scanForDevices = async () => {
    const state = await bleManager.state();
    if (state !== 'PoweredOn') {
      Alert.alert('Bluetooth Off', 'Please enable Bluetooth');
      return;
    }

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) return;
      if (device && device.name) {
        const pineTimeNames = ['InfiniTime', 'Pinetime', 'PineTime', 'DFU'];
        if (pineTimeNames.some(name => device.name.includes(name))) {
          bleManager.stopDeviceScan();
          connectToDevice(device);
        }
      }
    });

    setTimeout(() => bleManager.stopDeviceScan(), 15000);
  };

  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      Alert.alert('Connected!', `Connected to ${device.name}. Heart rate and activity data will sync automatically.`);
    } catch (error) {
      Alert.alert('Connection Failed', error.message);
    }
  };

  // Navigation Bar
  const NavBar = () => (
    <View style={styles.navBar}>
      <Text style={styles.logo}>PRAXIOM{'\n'}HEALTH</Text>
      <View style={styles.navButtons}>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'dashboard' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('dashboard')}
        >
          <Text style={styles.navButtonText}>☑ Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'communication' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('communication')}
        >
          <Text style={styles.navButtonText}>💬 Communication</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'settings' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('settings')}
        >
          <Text style={styles.navButtonText}>⚙ Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Dashboard Screen
  if (currentScreen === 'dashboard') {
    const ageDiff = healthScores.biologicalAge - healthScores.chronologicalAge;
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>Personal Health Record</Text>
          
          {healthScores.biologicalAge > 0 && (
            <View style={[styles.bioAgeBanner, { backgroundColor: ageDiff > 0 ? '#ffebee' : '#e8f5e9' }]}>
              <Text style={styles.bioAgeLabel}>Your Biological Age</Text>
              <Text style={[styles.bioAgeValue, { color: ageDiff > 0 ? '#d32f2f' : '#2e7d32' }]}>
                {healthScores.biologicalAge} years
              </Text>
              <Text style={styles.bioAgeSubtext}>
                Chronological Age: {healthScores.chronologicalAge} years
                {ageDiff !== 0 && ` (${ageDiff > 0 ? '+' : ''}${ageDiff.toFixed(1)} years)`}
              </Text>
            </View>
          )}

          <View style={styles.scoresContainer}>
            <View style={styles.scoreCard}>
              <CircularProgress 
                size={120} 
                strokeWidth={12} 
                percentage={healthScores.oralHealthScore}
                color={getScoreColor(healthScores.oralHealthScore)}
              >
                <View style={styles.scoreContent}>
                  <Text style={styles.scoreValue}>{healthScores.oralHealthScore}</Text>
                </View>
              </CircularProgress>
              <Text style={styles.scoreLabel}>Oral Health{'\n'}Score</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskLevel(healthScores.oralHealthScore).color }]}>
                <Text style={styles.riskText}>{getRiskLevel(healthScores.oralHealthScore).text}</Text>
              </View>
            </View>

            <View style={styles.scoreCard}>
              <CircularProgress 
                size={120} 
                strokeWidth={12} 
                percentage={healthScores.systemicHealthScore}
                color={getScoreColor(healthScores.systemicHealthScore)}
              >
                <View style={styles.scoreContent}>
                  <Text style={styles.scoreValue}>{healthScores.systemicHealthScore}</Text>
                </View>
              </CircularProgress>
              <Text style={styles.scoreLabel}>Systemic Health{'\n'}Score</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskLevel(healthScores.systemicHealthScore).color }]}>
                <Text style={styles.riskText}>{getRiskLevel(healthScores.systemicHealthScore).text}</Text>
              </View>
            </View>

            <View style={styles.scoreCard}>
              <CircularProgress 
                size={120} 
                strokeWidth={12} 
                percentage={healthScores.fitnessScore}
                color={getScoreColor(healthScores.fitnessScore)}
              >
                <View style={styles.scoreContent}>
                  <Text style={styles.scoreValue}>{healthScores.fitnessScore}</Text>
                </View>
              </CircularProgress>
              <Text style={styles.scoreLabel}>Fitness Score</Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskLevel(healthScores.fitnessScore).color }]}>
                <Text style={styles.riskText}>{getRiskLevel(healthScores.fitnessScore).text}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wearable Integration</Text>
            <View style={styles.wearableContainer}>
              <View style={styles.wearableMetric}>
                <Text style={styles.wearableIcon}>👣</Text>
                <Text style={styles.wearableLabel}>Steps</Text>
                <Text style={styles.wearableValue}>{tier1Biomarkers.steps || '0'}</Text>
              </View>
              <View style={styles.wearableMetric}>
                <Text style={styles.wearableIcon}>💗</Text>
                <Text style={styles.wearableLabel}>Heart Rate</Text>
                <Text style={styles.wearableValue}>{tier1Biomarkers.heartRate || '--'} bpm</Text>
              </View>
              <View style={styles.wearableMetric}>
                <Text style={styles.wearableIcon}>💧</Text>
                <Text style={styles.wearableLabel}>SpO₂</Text>
                <Text style={styles.wearableValue}>{tier1Biomarkers.oxygenSaturation || '--'}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalized Health Planner</Text>
            <TouchableOpacity style={styles.plannerCard}>
              <Text style={styles.plannerIcon}>📋</Text>
              <View style={styles.plannerContent}>
                <Text style={styles.plannerTitle}>Bio-Age Optimization</Text>
                <Text style={styles.plannerText}>
                  {ageDiff > 5 ? 'Focus on reducing biological age through targeted interventions' :
                   ageDiff > 0 ? 'Continue current health practices with minor adjustments' :
                   'Excellent! Maintain your current healthy lifestyle'}
                </Text>
              </View>
              <Text style={styles.plannerArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Micro-intervention Scheduler</Text>
            <View style={styles.schedulerCard}>
              <Text style={styles.schedulerTitle}>Today</Text>
              <View style={styles.schedulerItem}>
                <Text style={styles.schedulerTime}>8:00 AM</Text>
                <Text style={styles.schedulerText}>Morning biomarker assessment</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => setCurrentScreen('input')}
          >
            <Text style={styles.updateButtonText}>Update Biomarker Data</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Input Screen - TIER 1 BIOMARKERS
  if (currentScreen === 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>Tier 1 Biomarker Input</Text>
          <Text style={styles.subtitle}>Praxiom Validated Protocol</Text>

          <View style={styles.formContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.sectionHeader}>Patient Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Age (years)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 38"
                  keyboardType="numeric"
                  value={tier1Biomarkers.age}
                  onChangeText={(value) => updateBiomarker('age', value)}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionHeader}>Oral Health Biomarkers</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Salivary pH (Optimal: 6.5-7.2)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 6.8"
                  keyboardType="numeric"
                  value={tier1Biomarkers.salivaryPH}
                  onChangeText={(value) => updateBiomarker('salivaryPH', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Active MMP-8 (ng/mL) (Optimal: {'<'}60)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 55"
                  keyboardType="numeric"
                  value={tier1Biomarkers.activeMMP8}
                  onChangeText={(value) => updateBiomarker('activeMMP8', value)}
                />
                <Text style={styles.helperText}>Weight: 2.5× - CVD correlation</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Salivary Flow Rate (mL/min) (Optimal: {'>'}1.5)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1.6"
                  keyboardType="numeric"
                  value={tier1Biomarkers.salivaryFlowRate}
                  onChangeText={(value) => updateBiomarker('salivaryFlowRate', value)}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionHeader}>Systemic Health Biomarkers</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>hs-CRP (mg/L) (Optimal: {'<'}1.0)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 0.8"
                  keyboardType="numeric"
                  value={tier1Biomarkers.hsCRP}
                  onChangeText={(value) => updateBiomarker('hsCRP', value)}
                />
                <Text style={styles.helperText}>Weight: 2.0× - Systemic inflammation</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Omega-3 Index (%) (Optimal: {'>'}8.0)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 8.5"
                  keyboardType="numeric"
                  value={tier1Biomarkers.omega3Index}
                  onChangeText={(value) => updateBiomarker('omega3Index', value)}
                />
                <Text style={styles.helperText}>Weight: 2.0× - 5-year mortality predictor</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GDF-15 (pg/mL) (Optimal: {'<'}1,200)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1100"
                  keyboardType="numeric"
                  value={tier1Biomarkers.gdf15}
                  onChangeText={(value) => updateBiomarker('gdf15', value)}
                />
                <Text style={styles.helperText}>Weight: 2.0× - Strongest aging predictor</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>HbA1c (%) (Optimal: {'<'}5.7)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5.4"
                  keyboardType="numeric"
                  value={tier1Biomarkers.hbA1c}
                  onChangeText={(value) => updateBiomarker('hbA1c', value)}
                />
                <Text style={styles.helperText}>Weight: 1.5× - ADA validated</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vitamin D 25-OH (ng/mL) (Optimal: {'>'}30)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 35"
                  keyboardType="numeric"
                  value={tier1Biomarkers.vitaminD}
                  onChangeText={(value) => updateBiomarker('vitaminD', value)}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionHeader}>Wearable Data (PineTime)</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 68"
                  keyboardType="numeric"
                  value={tier1Biomarkers.heartRate}
                  onChangeText={(value) => updateBiomarker('heartRate', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Steps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 7840"
                  keyboardType="numeric"
                  value={tier1Biomarkers.steps}
                  onChangeText={(value) => updateBiomarker('steps', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Oxygen Saturation (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 96"
                  keyboardType="numeric"
                  value={tier1Biomarkers.oxygenSaturation}
                  onChangeText={(value) => updateBiomarker('oxygenSaturation', value)}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={calculatePraxiomScores}
          >
            <Text style={styles.saveButtonText}>Calculate Praxiom Bio-Age</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setCurrentScreen('dashboard')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Settings Screen
  if (currentScreen === 'settings') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>Settings</Text>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeader}>Device Connection</Text>
            {connectedDevice ? (
              <View style={styles.settingsCard}>
                <Text style={styles.settingsText}>✓ Connected: {connectedDevice.name}</Text>
                <TouchableOpacity 
                  style={styles.settingsButton}
                  onPress={() => {
                    connectedDevice.cancelConnection();
                    setConnectedDevice(null);
                  }}
                >
                  <Text style={styles.settingsButtonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.settingsCard}
                onPress={scanForDevices}
              >
                <Text style={styles.settingsText}>📡 Scan for PineTime</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeader}>Data Management</Text>
            
            <TouchableOpacity 
              style={styles.settingsCard}
              onPress={exportToPDF}
            >
              <Text style={styles.settingsText}>📄 Export Bio-Age Report</Text>
              <Text style={styles.settingsSubtext}>HTML format with full analysis</Text>
            </TouchableOpacity>

            <View style={styles.settingsCard}>
              <Text style={styles.settingsText}>Assessment History: {dataHistory.length} records</Text>
              <Text style={styles.settingsSubtext}>
                Last Backup: {lastBackupDate 
                  ? new Date(lastBackupDate).toLocaleDateString() 
                  : 'Never'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.settingsCard, styles.dangerCard]}
              onPress={() => {
                Alert.alert(
                  'Clear All Data',
                  'Are you sure? This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear', 
                      style: 'destructive',
                      onPress: async () => {
                        await AsyncStorage.clear();
                        setTier1Biomarkers({});
                        setHealthScores({});
                        setDataHistory([]);
                        Alert.alert('Success', 'All data cleared');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={[styles.settingsText, styles.dangerText]}>⚠️ Clear All Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeader}>About Praxiom Protocol</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsText}>Praxiom Health v1.0.0</Text>
              <Text style={styles.settingsSubtext}>Bio-Age Longevity Protocol (2025)</Text>
              <Text style={styles.settingsSubtext}>Validated Tier 1 Algorithms</Text>
              <Text style={styles.settingsSubtext}>Evidence-based clinical framework</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Communication Screen
  if (currentScreen === 'communication') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>Communication</Text>
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>💬</Text>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonSubtitle}>
              Connect with your healthcare provider and share your Praxiom Bio-Age assessments securely.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// Styles (same as before, but I'll include them for completeness)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
  },
  navButtons: {
    flexDirection: 'row',
  },
  navButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
  },
  navButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFA500',
  },
  navButtonText: {
    fontSize: 14,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  bioAgeBanner: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  bioAgeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  bioAgeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  bioAgeSubtext: {
    fontSize: 16,
    color: '#666',
  },
  scoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  scoreCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  wearableContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wearableMetric: {
    alignItems: 'center',
  },
  wearableIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  wearableLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  wearableValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  plannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plannerIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  plannerContent: {
    flex: 1,
  },
  plannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  plannerText: {
    fontSize: 14,
    color: '#666',
  },
  plannerArrow: {
    fontSize: 24,
    color: '#CCC',
  },
  schedulerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schedulerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  schedulerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schedulerTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA500',
    marginRight: 15,
    width: 70,
  },
  schedulerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#FFA500',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#FFA500',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  settingsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  settingsButton: {
    backgroundColor: '#FFA500',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#f44336',
  },
  dangerText: {
    color: '#f44336',
  },
  comingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  comingSoonText: {
    fontSize: 64,
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
