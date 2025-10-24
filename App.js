import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Alert, 
  PermissionsAndroid, Platform, TextInput, TouchableOpacity,
  SafeAreaView, Dimensions, Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BleManager } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Svg, { Circle, G } from 'react-native-svg';
import { Buffer } from 'buffer';

const { width } = Dimensions.get('window');

// BLE Service UUIDs for PineTime
const BLE_SERVICES = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  CURRENT_TIME: '00001805-0000-1000-8000-00805f9b34fb',
  CURRENT_TIME_CHAR: '00002a2b-0000-1000-8000-00805f9b34fb',
  // Custom Praxiom Service (needs to be added to firmware)
  PRAXIOM_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  PRAXIOM_BIO_AGE: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  PRAXIOM_HEALTH_DATA: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
};

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
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('watch-connection'); // Start with connection screen
  const [currentTier, setCurrentTier] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReasons, setUpgradeReasons] = useState([]);
  
  // BLE Monitoring States
  const [heartRateMonitoring, setHeartRateMonitoring] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // TIER 1 BIOMARKERS
  const [tier1Biomarkers, setTier1Biomarkers] = useState({
    age: '',
    salivaryPH: '',
    activeMMP8: '',
    salivaryFlowRate: '',
    hsCRP: '',
    omega3Index: '',
    hbA1c: '',
    gdf15: '',
    vitaminD: '',
    heartRate: '',
    steps: '',
    oxygenSaturation: '',
  });

  // TIER 2 BIOMARKERS
  const [tier2Biomarkers, setTier2Biomarkers] = useState({
    // Advanced Inflammatory Panel
    il6: '',              // Optimal: <3.0 pg/mL
    il1b: '',             // Optimal: <100 pg/mL
    ohd8: '',             // 8-OHdG: Optimal: <4.0 ng/mL
    proteinCarbonyls: '', // Optimal: <2.0 nmol/mg
    
    // NAD+ Metabolome
    nadPlus: '',
    nadhRatio: '',
    nMethylNicotinamide: '',
    
    // Wearable Data (Advanced)
    hrvRMSSD: '',         // Optimal: >70 ms
    sleepEfficiency: '',  // Optimal: >85%
  });

  // DNA METHYLATION TEST RESULTS
  const [epigeneticData, setEpigeneticData] = useState({
    dunedinPACE: '',      // Pace of aging (1.0 = normal)
    elovl2Methylation: '',
    intrinsicCapacity: '',
    testDate: '',
    testProvider: '',
  });

  const [healthScores, setHealthScores] = useState({
    oralHealthScore: 0,
    systemicHealthScore: 0,
    biologicalAge: 0,
    chronologicalAge: 0,
    fitnessScore: 0,
    tier2SystemicScore: 0,
  });

  const [dataHistory, setDataHistory] = useState([]);
  const [lastBackupDate, setLastBackupDate] = useState(null);

  useEffect(() => {
    requestPermissions();
    loadStoredData();
    checkBackupReminder();
    return () => {
      if (heartRateMonitoring) {
        heartRateMonitoring.remove();
      }
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
      const storedTier1 = await AsyncStorage.getItem('tier1Biomarkers');
      const storedTier2 = await AsyncStorage.getItem('tier2Biomarkers');
      const storedEpigenetic = await AsyncStorage.getItem('epigeneticData');
      const storedScores = await AsyncStorage.getItem('healthScores');
      const storedHistory = await AsyncStorage.getItem('dataHistory');
      const storedBackup = await AsyncStorage.getItem('lastBackupDate');
      const storedTier = await AsyncStorage.getItem('currentTier');

      if (storedTier1) setTier1Biomarkers(JSON.parse(storedTier1));
      if (storedTier2) setTier2Biomarkers(JSON.parse(storedTier2));
      if (storedEpigenetic) setEpigeneticData(JSON.parse(storedEpigenetic));
      if (storedScores) setHealthScores(JSON.parse(storedScores));
      if (storedHistory) setDataHistory(JSON.parse(storedHistory));
      if (storedBackup) setLastBackupDate(storedBackup);
      if (storedTier) setCurrentTier(parseInt(storedTier));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newTier1, newTier2, newEpigenetic, newScores, tier) => {
    try {
      await AsyncStorage.setItem('tier1Biomarkers', JSON.stringify(newTier1));
      await AsyncStorage.setItem('tier2Biomarkers', JSON.stringify(newTier2));
      await AsyncStorage.setItem('epigeneticData', JSON.stringify(newEpigenetic));
      await AsyncStorage.setItem('healthScores', JSON.stringify(newScores));
      await AsyncStorage.setItem('currentTier', tier.toString());
      
      const historyEntry = {
        date: new Date().toISOString(),
        tier: tier,
        tier1Biomarkers: newTier1,
        tier2Biomarkers: newTier2,
        epigeneticData: newEpigenetic,
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

  // TIER 1 → TIER 2 UPGRADE EVALUATION
  const evaluateTierUpgrade = (OHS, SHS, biomarkers) => {
    const reasons = [];
    let shouldUpgrade = false;

    // Parse values
    const hsCRP = parseFloat(biomarkers.hsCRP) || 0;
    const mmp8 = parseFloat(biomarkers.activeMMP8) || 0;
    const gdf15 = parseFloat(biomarkers.gdf15) || 0;
    const hbA1c = parseFloat(biomarkers.hbA1c) || 0;

    // Mandatory Upgrade Criteria (Any condition met)
    if (OHS < 60 || SHS < 60) {
      shouldUpgrade = true;
      reasons.push({
        title: 'Low Health Scores',
        description: `Your ${OHS < 60 ? 'Oral' : 'Systemic'} Health Score is below 60%, indicating need for advanced assessment.`,
        severity: 'high'
      });
    }

    if (hsCRP > 3.0) {
      shouldUpgrade = true;
      reasons.push({
        title: 'Elevated Inflammation',
        description: 'hs-CRP >3.0 mg/L requires detailed inflammatory profiling.',
        severity: 'high'
      });
    }

    if (mmp8 > 100) {
      shouldUpgrade = true;
      reasons.push({
        title: 'High Oral Inflammation',
        description: 'MMP-8 >100 ng/mL suggests need for microbiome analysis.',
        severity: 'high'
      });
    }

    if (gdf15 > 1800) {
      shouldUpgrade = true;
      reasons.push({
        title: 'Accelerated Aging Marker',
        description: 'GDF-15 >1,800 pg/mL indicates advanced aging assessment needed.',
        severity: 'high'
      });
    }

    // Recommended Upgrade (Multiple conditions)
    let recommendCount = 0;
    
    if (OHS >= 60 && OHS < 75) {
      recommendCount++;
      reasons.push({
        title: 'Oral Health Optimization',
        description: 'OHS 60-75% would benefit from personalized interventions.',
        severity: 'medium'
      });
    }

    if (SHS >= 60 && SHS < 75) {
      recommendCount++;
      reasons.push({
        title: 'Systemic Health Improvement',
        description: 'SHS 60-75% suggests room for targeted optimization.',
        severity: 'medium'
      });
    }

    if (hbA1c >= 5.7 && hbA1c < 6.4) {
      recommendCount++;
      reasons.push({
        title: 'Prediabetic Range',
        description: 'HbA1c 5.7-6.4% warrants metabolic profiling.',
        severity: 'medium'
      });
    }

    if (recommendCount >= 2) {
      shouldUpgrade = true;
    }

    return { shouldUpgrade, reasons };
  };

  // PARSE HEART RATE VALUE FROM BLE
  const parseHeartRateValue = (base64Value) => {
    try {
      const buffer = Buffer.from(base64Value, 'base64');
      const flags = buffer[0];
      const is16Bit = (flags & 0x01) !== 0;
      const heartRate = is16Bit 
        ? buffer.readUInt16LE(1)
        : buffer.readUInt8(1);
      return heartRate;
    } catch (error) {
      console.error('Error parsing heart rate:', error);
      return 0;
    }
  };

  // START MONITORING HEART RATE FROM WATCH
  const startHeartRateMonitoring = (device) => {
    try {
      const subscription = device.monitorCharacteristicForService(
        BLE_SERVICES.HEART_RATE,
        BLE_SERVICES.HEART_RATE_MEASUREMENT,
        (error, characteristic) => {
          if (error) {
            console.error('Heart rate monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            const heartRate = parseHeartRateValue(characteristic.value);
            console.log('Heart rate received:', heartRate);
            
            setTier1Biomarkers(prev => ({
              ...prev,
              heartRate: heartRate.toString()
            }));
            
            setLastSyncTime(new Date().toISOString());
          }
        }
      );
      
      setHeartRateMonitoring(subscription);
      console.log('Heart rate monitoring started');
    } catch (error) {
      console.error('Failed to start heart rate monitoring:', error);
    }
  };

  // SEND BIOLOGICAL AGE TO WATCH
  const sendBioAgeToWatch = async (device, bioAge) => {
    try {
      const services = await device.services();
      const hasPraxiomService = services.some(s => 
        s.uuid.toLowerCase() === BLE_SERVICES.PRAXIOM_SERVICE.toLowerCase()
      );
      
      if (!hasPraxiomService) {
        console.log('Praxiom service not found on watch. Using fallback notification.');
        Alert.alert(
          'Firmware Update Needed',
          `Your watch needs the custom Praxiom firmware to display Bio-Age.\n\nYour calculated Bio-Age: ${bioAge} years\n\nThis value will sync automatically once you install the custom firmware.`,
          [{ text: 'OK' }]
        );
        return;
      }

      const ageValue = Math.round(bioAge * 10);
      const buffer = Buffer.alloc(2);
      buffer.writeUInt16LE(ageValue, 0);
      const base64Data = buffer.toString('base64');
      
      await device.writeCharacteristicWithResponseForService(
        BLE_SERVICES.PRAXIOM_SERVICE,
        BLE_SERVICES.PRAXIOM_BIO_AGE,
        base64Data
      );
      
      console.log('Bio-Age sent to watch:', bioAge);
      Alert.alert('Success', `Bio-Age (${bioAge} years) synced to watch!`);
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Error sending bio-age to watch:', error);
      
      if (error.message.includes('service') || error.message.includes('characteristic')) {
        Alert.alert(
          'Custom Firmware Required',
          `Install the Praxiom firmware on your watch to enable Bio-Age display.\n\nYour calculated Bio-Age: ${bioAge} years`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Sync Error', 'Failed to send data to watch: ' + error.message);
      }
    }
  };

  // SEND HEALTH DATA PACKAGE TO WATCH
  const sendHealthDataToWatch = async (device, healthData) => {
    try {
      const services = await device.services();
      const hasPraxiomService = services.some(s => 
        s.uuid.toLowerCase() === BLE_SERVICES.PRAXIOM_SERVICE.toLowerCase()
      );
      
      if (!hasPraxiomService) {
        console.log('Praxiom service not found. Skipping health data sync.');
        return;
      }

      const buffer = Buffer.alloc(5);
      buffer.writeUInt16LE(Math.round(healthData.biologicalAge * 10), 0);
      buffer.writeUInt8(healthData.oralHealthScore, 2);
      buffer.writeUInt8(healthData.systemicHealthScore, 3);
      buffer.writeUInt8(healthData.fitnessScore, 4);
      
      const base64Data = buffer.toString('base64');
      
      await device.writeCharacteristicWithResponseForService(
        BLE_SERVICES.PRAXIOM_SERVICE,
        BLE_SERVICES.PRAXIOM_HEALTH_DATA,
        base64Data
      );
      
      console.log('Health data package sent to watch');
    } catch (error) {
      console.error('Error sending health data to watch:', error);
    }
  };

  // MANUAL SYNC TO WATCH
  const manualSyncToWatch = async () => {
    if (!connectedDevice) {
      Alert.alert('Not Connected', 'Please connect to your watch first');
      return;
    }
    
    if (healthScores.biologicalAge === 0) {
      Alert.alert('No Data', 'Please calculate your Bio-Age first');
      return;
    }
    
    try {
      await sendBioAgeToWatch(connectedDevice, healthScores.biologicalAge);
      await sendHealthDataToWatch(connectedDevice, healthScores);
    } catch (error) {
      Alert.alert('Sync Failed', error.message);
    }
  };

  // PRAXIOM TIER 1 ALGORITHMS
  const calculateTier1Scores = () => {
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

    // ORAL HEALTH SCORE (OHS)
    let pHScore = 0;
    if (salivaryPH >= 6.5 && salivaryPH <= 7.2) pHScore = 1.0;
    else if ((salivaryPH >= 6.0 && salivaryPH < 6.5) || (salivaryPH > 7.2 && salivaryPH <= 7.5)) pHScore = 0.5;
    
    let mmp8Score = 0;
    if (activeMMP8 < 60) mmp8Score = 1.0;
    else if (activeMMP8 <= 100) mmp8Score = 0.5;
    else mmp8Score = Math.max(0, 1 - (activeMMP8 - 100) / 200);
    
    let flowRateScore = 0;
    if (salivaryFlowRate >= 1.5) flowRateScore = 1.0;
    else if (salivaryFlowRate >= 1.0) flowRateScore = 0.5;
    else flowRateScore = Math.max(0, salivaryFlowRate);
    
    const OHS = ((mmp8Score * 2.5) + (pHScore * 1.0) + (flowRateScore * 1.0)) / 4.5 * 100;
    
    // SYSTEMIC HEALTH SCORE (SHS)
    let cprScore = 0;
    if (hsCRP < 1.0) cprScore = 1.0;
    else if (hsCRP <= 3.0) cprScore = 0.5;
    else cprScore = Math.max(0, 1 - (hsCRP - 3.0) / 5);
    
    let omega3Score = 0;
    if (omega3Index > 8.0) omega3Score = 1.0;
    else if (omega3Index >= 6.0) omega3Score = 0.5;
    else omega3Score = Math.max(0, omega3Index / 6.0);
    
    let gdf15Score = 0;
    if (gdf15 < 1200) gdf15Score = 1.0;
    else if (gdf15 <= 1800) gdf15Score = 0.5;
    else gdf15Score = Math.max(0, 1 - (gdf15 - 1800) / 1000);
    
    let hbA1cScore = 0;
    if (hbA1c < 5.7) hbA1cScore = 1.0;
    else if (hbA1c <= 6.4) hbA1cScore = 0.5;
    else hbA1cScore = Math.max(0, 1 - (hbA1c - 6.4) / 2);
    
    let vitaminDScore = 0;
    if (vitaminD > 30) vitaminDScore = 1.0;
    else if (vitaminD >= 20) vitaminDScore = 0.5;
    else vitaminDScore = Math.max(0, vitaminD / 20);
    
    const SHS = ((cprScore * 2.0) + (omega3Score * 2.0) + (gdf15Score * 2.0) + (hbA1cScore * 1.5) + (vitaminDScore * 1.0)) / 9.5 * 100;
    
    // BIOLOGICAL AGE
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
    
    let biologicalAge = age + ((100 - OHS) * alpha + (100 - SHS) * beta);
    
    // Apply DNA methylation adjustment if available
    const dunedinPACE = parseFloat(epigeneticData.dunedinPACE);
    if (dunedinPACE > 0) {
      const epigeneticDeviation = (dunedinPACE - 1.0) * age * 0.3;
      biologicalAge += epigeneticDeviation;
    }
    
    // FITNESS SCORE
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
      tier2SystemicScore: 0,
    };

    // Check for Tier 2 upgrade
    const upgradeEval = evaluateTierUpgrade(OHS, SHS, tier1Biomarkers);
    if (upgradeEval.shouldUpgrade && currentTier === 1) {
      setUpgradeReasons(upgradeEval.reasons);
      setShowUpgradeModal(true);
    }

    setHealthScores(newScores);
    saveData(tier1Biomarkers, tier2Biomarkers, epigeneticData, newScores, currentTier);
    
    // Send bio-age to watch if connected
    if (connectedDevice) {
      sendBioAgeToWatch(connectedDevice, newScores.biologicalAge);
      sendHealthDataToWatch(connectedDevice, newScores);
    }
    
    setCurrentScreen('dashboard');
    Alert.alert('Success', 'Tier 1 Bio-Age calculated using validated Praxiom algorithms!');
  };

  // TIER 2 ENHANCED SCORING
  const calculateTier2Scores = () => {
    // First calculate Tier 1 scores
    calculateTier1Scores();
    
    // Parse Tier 2 biomarkers
    const il6 = parseFloat(tier2Biomarkers.il6) || 0;
    const il1b = parseFloat(tier2Biomarkers.il1b) || 0;
    const ohd8 = parseFloat(tier2Biomarkers.ohd8) || 0;
    const proteinCarbonyls = parseFloat(tier2Biomarkers.proteinCarbonyls) || 0;
    const hrvRMSSD = parseFloat(tier2Biomarkers.hrvRMSSD) || 0;
    const sleepEfficiency = parseFloat(tier2Biomarkers.sleepEfficiency) || 0;
    const steps = parseFloat(tier1Biomarkers.steps) || 0;

    // Advanced Inflammatory Panel Score
    let il6Score = il6 < 3.0 ? 1.0 : (il6 <= 10.0 ? 0.5 : Math.max(0, 1 - (il6 - 10) / 20));
    let il1bScore = il1b < 100 ? 1.0 : (il1b <= 300 ? 0.5 : Math.max(0, 1 - (il1b - 300) / 400));
    let ohd8Score = ohd8 < 4.0 ? 1.0 : (ohd8 <= 8.0 ? 0.5 : Math.max(0, 1 - (ohd8 - 8) / 10));
    let proteinScore = proteinCarbonyls < 2.0 ? 1.0 : (proteinCarbonyls <= 4.0 ? 0.5 : Math.max(0, 1 - (proteinCarbonyls - 4) / 5));
    
    const inflammatoryPanelScore = ((il6Score * 2.0) + (il1bScore * 1.5) + (ohd8Score * 1.5) + (proteinScore * 1.5)) / 6.5 * 100;

    // Wearable Score (with error corrections from protocol)
    let hrvScore = hrvRMSSD > 70 ? 1.0 : (hrvRMSSD >= 50 ? 0.7 : Math.max(0, hrvRMSSD / 70));
    let sleepScore = sleepEfficiency > 85 ? 1.0 : (sleepEfficiency >= 70 ? 0.7 : Math.max(0, sleepEfficiency / 85));
    let activityScore = steps > 8000 ? 1.0 : (steps >= 5000 ? 0.7 : Math.max(0, steps / 8000));
    
    const wearableScore = ((hrvScore * 0.5) + (sleepScore * 0.3) + (activityScore * 0.2)) * 100;

    // Tier 2 Enhanced SHS
    // SHS_T2 = [(T1_SHS × 0.6) + (Inflammatory Panel × 0.25) + (NAD+ Score × 0.10) + (Wearable Score × 0.05)] × 100
    const tier1SHS = healthScores.systemicHealthScore;
    const nadScore = 75; // Placeholder until NAD+ data available
    
    const tier2SHS = ((tier1SHS * 0.6) + (inflammatoryPanelScore * 0.25) + (nadScore * 0.10) + (wearableScore * 0.05));

    const updatedScores = {
      ...healthScores,
      tier2SystemicScore: Math.round(tier2SHS),
    };

    setHealthScores(updatedScores);
    saveData(tier1Biomarkers, tier2Biomarkers, epigeneticData, updatedScores, 2);
    
    // Send to watch if connected
    if (connectedDevice) {
      sendBioAgeToWatch(connectedDevice, updatedScores.biologicalAge);
      sendHealthDataToWatch(connectedDevice, updatedScores);
    }
    
    setCurrentScreen('dashboard');
    Alert.alert('Success', 'Tier 2 Enhanced Bio-Age calculated!');
  };

  const scanForDevices = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    
    const state = await bleManager.state();
    if (state !== 'PoweredOn') {
      Alert.alert('Bluetooth Off', 'Please enable Bluetooth');
      setIsScanning(false);
      return;
    }

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDiscoveredDevices(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (!exists) {
            return [...prev, device];
          }
          return prev;
        });

        const pineTimeNames = ['InfiniTime', 'Pinetime', 'PineTime', 'Praxiom'];
        if (pineTimeNames.some(name => device.name.includes(name))) {
          bleManager.stopDeviceScan();
          setIsScanning(false);
          connectToDevice(device);
        }
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  };

  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      
      // Start monitoring heart rate
      startHeartRateMonitoring(connected);
      
      // Send current bio-age to watch if available
      if (healthScores.biologicalAge > 0) {
        await sendBioAgeToWatch(connected, healthScores.biologicalAge);
        await sendHealthDataToWatch(connected, healthScores);
      }
      
      Alert.alert('Connected!', `Connected to ${device.name}. Monitoring heart rate...`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', error.message);
    }
  };

  const disconnectWatch = () => {
    if (heartRateMonitoring) {
      heartRateMonitoring.remove();
      setHeartRateMonitoring(null);
    }
    if (connectedDevice) {
      connectedDevice.cancelConnection();
      setConnectedDevice(null);
    }
    Alert.alert('Disconnected', 'Watch disconnected');
  };

  const manualConnect = (device) => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
    connectToDevice(device);
  };

  const updateTier1Biomarker = (key, value) => {
    setTier1Biomarkers(prev => ({ ...prev, [key]: value }));
  };

  const updateTier2Biomarker = (key, value) => {
    setTier2Biomarkers(prev => ({ ...prev, [key]: value }));
  };

  const updateEpigeneticData = (key, value) => {
    setEpigeneticData(prev => ({ ...prev, [key]: value }));
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
  <title>Praxiom Health Bio-Age Report - Tier ${currentTier}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { text-align: center; color: #FFA500; margin-bottom: 30px; }
    .tier-badge { 
      display: inline-block;
      background: ${currentTier === 2 ? '#2196F3' : '#4CAF50'};
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      margin: 10px 0;
    }
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
    .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #FFA500; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
    .metric-label { font-weight: 600; width: 50%; }
    .badge { 
      display: inline-block;
      padding: 5px 15px;
      border-radius: 15px;
      font-weight: bold;
      margin-top: 10px;
    }
    .epigenetic-box {
      background: #e3f2fd;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PRAXIOM HEALTH</h1>
    <h2>Bio-Age Assessment Report</h2>
    <div class="tier-badge">TIER ${currentTier} ASSESSMENT</div>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
    <p style="font-size: 12px; color: #999;">Using Validated ${currentTier === 2 ? 'Tier 2 Enhanced' : 'Tier 1'} Algorithms</p>
  </div>

  <div class="bio-age-banner">
    <p style="margin: 0; font-size: 18px;">Your Biological Age</p>
    <div class="bio-age-value">${healthScores.biologicalAge} years</div>
    <p style="margin: 10px 0 0 0; font-size: 16px;">
      Chronological Age: ${healthScores.chronologicalAge} years
      ${ageDiff !== 0 ? `(${ageDiff > 0 ? '+' : ''}${ageDiff.toFixed(1)} years)` : ''}
    </p>
  </div>

  ${epigeneticData.dunedinPACE ? `
  <div class="epigenetic-box">
    <h3>Epigenetic Assessment Results</h3>
    <p><strong>DunedinPACE:</strong> ${epigeneticData.dunedinPACE} (${parseFloat(epigeneticData.dunedinPACE) < 1.0 ? 'Slower than average aging' : parseFloat(epigeneticData.dunedinPACE) > 1.0 ? 'Faster than average aging' : 'Average aging rate'})</p>
    <p><strong>Test Date:</strong> ${epigeneticData.testDate || 'Not specified'}</p>
    <p><strong>Provider:</strong> ${epigeneticData.testProvider || 'Not specified'}</p>
  </div>
  ` : ''}

  <div class="section">
    <div class="score-card">
      <div class="score">${healthScores.oralHealthScore}</div>
      <div class="label">Oral Health Score</div>
      <div class="badge" style="background-color: ${getRiskLevel(healthScores.oralHealthScore).color};">
        ${getRiskLevel(healthScores.oralHealthScore).text}
      </div>
    </div>
    <div class="score-card">
      <div class="score">${currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore}</div>
      <div class="label">${currentTier === 2 ? 'Enhanced ' : ''}Systemic Health</div>
      <div class="badge" style="background-color: ${getRiskLevel(currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore).color};">
        ${getRiskLevel(currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore).text}
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
    <div class="section-title">Tier 1 Core Biomarkers</div>
    <h3>Oral Health Biomarkers</h3>
    <table>
      <tr><td class="metric-label">Salivary pH</td><td>${tier1Biomarkers.salivaryPH || '--'} (Optimal: 6.5-7.2)</td></tr>
      <tr><td class="metric-label">Active MMP-8</td><td>${tier1Biomarkers.activeMMP8 || '--'} ng/mL (Optimal: <60)</td></tr>
      <tr><td class="metric-label">Salivary Flow Rate</td><td>${tier1Biomarkers.salivaryFlowRate || '--'} mL/min (Optimal: >1.5)</td></tr>
    </table>
    <h3>Systemic Health Biomarkers</h3>
    <table>
      <tr><td class="metric-label">hs-CRP</td><td>${tier1Biomarkers.hsCRP || '--'} mg/L (Optimal: <1.0)</td></tr>
      <tr><td class="metric-label">Omega-3 Index</td><td>${tier1Biomarkers.omega3Index || '--'}% (Optimal: >8.0%)</td></tr>
      <tr><td class="metric-label">GDF-15</td><td>${tier1Biomarkers.gdf15 || '--'} pg/mL (Optimal: <1,200)</td></tr>
      <tr><td class="metric-label">HbA1c</td><td>${tier1Biomarkers.hbA1c || '--'}% (Optimal: <5.7%)</td></tr>
      <tr><td class="metric-label">Vitamin D</td><td>${tier1Biomarkers.vitaminD || '--'} ng/mL (Optimal: >30)</td></tr>
    </table>
  </div>

  ${currentTier === 2 ? `
  <div class="section">
    <div class="section-title">Tier 2 Advanced Biomarkers</div>
    <h3>Advanced Inflammatory Panel</h3>
    <table>
      <tr><td class="metric-label">IL-6</td><td>${tier2Biomarkers.il6 || '--'} pg/mL (Optimal: <3.0)</td></tr>
      <tr><td class="metric-label">IL-1β</td><td>${tier2Biomarkers.il1b || '--'} pg/mL (Optimal: <100)</td></tr>
      <tr><td class="metric-label">8-OHdG</td><td>${tier2Biomarkers.ohd8 || '--'} ng/mL (Optimal: <4.0)</td></tr>
      <tr><td class="metric-label">Protein Carbonyls</td><td>${tier2Biomarkers.proteinCarbonyls || '--'} nmol/mg (Optimal: <2.0)</td></tr>
    </table>
    <h3>Wearable Integration (Advanced)</h3>
    <table>
      <tr><td class="metric-label">HRV (RMSSD)</td><td>${tier2Biomarkers.hrvRMSSD || '--'} ms (Optimal: >70)</td></tr>
      <tr><td class="metric-label">Sleep Efficiency</td><td>${tier2Biomarkers.sleepEfficiency || '--'}% (Optimal: >85%)</td></tr>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Assessment History</div>
    <p><strong>Total Assessments:</strong> ${dataHistory.length}</p>
    <p><strong>Current Tier:</strong> Tier ${currentTier}</p>
    <p><strong>Assessment Period:</strong> ${dataHistory[0]?.date ? new Date(dataHistory[0].date).toLocaleDateString() : 'N/A'} - ${dataHistory[dataHistory.length - 1]?.date ? new Date(dataHistory[dataHistory.length - 1].date).toLocaleDateString() : 'N/A'}</p>
  </div>

  <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
    <p style="font-size: 12px; color: #666; margin: 0;">
      This report is generated using the validated Praxiom Health Bio-Age Longevity Protocol (2025).
      Tier ${currentTier} algorithms are based on peer-reviewed research and clinical validation studies.
      For clinical interpretation, consult with your healthcare provider.
    </p>
  </div>
</body>
</html>
      `;

      const fileName = `praxiom_tier${currentTier}_report_${Date.now()}.html`;
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
          style={[styles.navButton, currentScreen === 'watch-connection' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('watch-connection')}
        >
          <Text style={styles.navButtonText}>⌚ Watch</Text>
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

  // Tier Upgrade Modal
  const TierUpgradeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showUpgradeModal}
      onRequestClose={() => setShowUpgradeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🎯 Tier 2 Upgrade Recommended</Text>
          <Text style={styles.modalSubtitle}>
            Your assessment suggests advanced profiling would be beneficial
          </Text>
          
          <ScrollView style={styles.reasonsList}>
            {upgradeReasons.map((reason, index) => (
              <View key={index} style={[styles.reasonCard, { borderLeftColor: reason.severity === 'high' ? '#f44336' : '#FF9800' }]}>
                <Text style={styles.reasonTitle}>{reason.title}</Text>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => {
                setCurrentTier(2);
                AsyncStorage.setItem('currentTier', '2');
                setShowUpgradeModal(false);
                Alert.alert('Tier 2 Activated', 'You can now access advanced biomarker inputs and enhanced algorithms.');
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Tier 2</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.laterButton}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Watch Connection Screen
  if (currentScreen === 'watch-connection') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>PineTime Watch Connection</Text>
          
          {connectedDevice ? (
            <View style={styles.connectedCard}>
              <Text style={styles.connectedIcon}>✓</Text>
              <Text style={styles.connectedTitle}>Connected to Watch</Text>
              <Text style={styles.connectedDevice}>{connectedDevice.name}</Text>
              <Text style={styles.connectedSubtext}>
                {heartRateMonitoring ? '💗 Heart rate monitoring active' : '⏸️ Monitoring paused'}
              </Text>
              {lastSyncTime && (
                <Text style={styles.lastSyncText}>
                  Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                </Text>
              )}
              
              <TouchableOpacity 
                style={styles.syncButton}
                onPress={manualSyncToWatch}
              >
                <Text style={styles.syncButtonText}>🔄 Sync Bio-Age to Watch</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={disconnectWatch}
              >
                <Text style={styles.disconnectButtonText}>Disconnect Watch</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.instructionCard}>
                <Text style={styles.instructionTitle}>📱 How to Connect</Text>
                <Text style={styles.instructionText}>
                  1. Make sure your PineTime watch is nearby{'\n'}
                  2. Ensure Bluetooth is enabled on your phone{'\n'}
                  3. Wake your watch and keep it on the main watchface{'\n'}
                  4. Tap "Scan for Watch" below
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.scanButton}
                onPress={scanForDevices}
                disabled={isScanning}
              >
                <Text style={styles.scanButtonText}>
                  {isScanning ? '🔍 Scanning...' : '🔍 Scan for PineTime Watch'}
                </Text>
              </TouchableOpacity>

              {discoveredDevices.length > 0 && (
                <View style={styles.devicesSection}>
                  <Text style={styles.devicesSectionTitle}>Discovered Devices:</Text>
                  {discoveredDevices.map((device, index) => (
                    <TouchableOpacity 
                      key={device.id}
                      style={styles.deviceCard}
                      onPress={() => manualConnect(device)}
                    >
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>
                          {device.name || 'Unknown Device'}
                        </Text>
                        <Text style={styles.deviceId}>{device.id}</Text>
                      </View>
                      <Text style={styles.connectArrow}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {isScanning && (
                <View style={styles.scanningIndicator}>
                  <Text style={styles.scanningText}>
                    Scanning for devices... This may take up to 15 seconds.
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>ℹ️ About Watch Integration</Text>
            <Text style={styles.infoText}>
              Your custom Praxiom-branded PineTime firmware will:{'\n\n'}
              • Display your biological age on the watchface{'\n'}
              • Sync heart rate and activity data automatically{'\n'}
              • Provide real-time health monitoring{'\n'}
              • Store data locally for offline access{'\n\n'}
              <Text style={{fontWeight: 'bold'}}>Note:</Text> Bio-Age display requires custom Praxiom firmware on your watch. Heart rate monitoring works with standard InfiniTime.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard Screen (continuing in next message due to length...)
  if (currentScreen === 'dashboard') {
    const ageDiff = healthScores.biologicalAge - healthScores.chronologicalAge;
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <TierUpgradeModal />
        <ScrollView style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.pageTitle}>Personal Health Record</Text>
            <View style={[styles.tierBadge, { backgroundColor: currentTier === 2 ? '#2196F3' : '#4CAF50' }]}>
              <Text style={styles.tierBadgeText}>TIER {currentTier}</Text>
            </View>
          </View>
          
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
              {epigeneticData.dunedinPACE && (
                <Text style={styles.bioAgeEpigenetic}>
                  📊 Including DunedinPACE adjustment
                </Text>
              )}
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
                percentage={currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore}
                color={getScoreColor(currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore)}
              >
                <View style={styles.scoreContent}>
                  <Text style={styles.scoreValue}>
                    {currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore}
                  </Text>
                </View>
              </CircularProgress>
              <Text style={styles.scoreLabel}>
                {currentTier === 2 ? 'Enhanced ' : ''}Systemic Health
              </Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskLevel(currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore).color }]}>
                <Text style={styles.riskText}>
                  {getRiskLevel(currentTier === 2 ? healthScores.tier2SystemicScore : healthScores.systemicHealthScore).text}
                </Text>
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
            <TouchableOpacity 
              style={styles.watchQuickButton}
              onPress={() => setCurrentScreen('watch-connection')}
            >
              <Text style={styles.watchQuickButtonText}>
                {connectedDevice ? '✓ Watch Connected' : '⌚ Connect Watch'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => setCurrentScreen('input')}
          >
            <Text style={styles.updateButtonText}>
              Update {currentTier === 2 ? 'Tier 2' : 'Tier 1'} Biomarker Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setCurrentScreen('epigenetic-input')}
          >
            <Text style={styles.secondaryButtonText}>
              📊 Input DNA Methylation Test
            </Text>
          </TouchableOpacity>

          {currentTier === 1 && (
            <TouchableOpacity 
              style={styles.tierUpgradePrompt}
              onPress={() => {
                setCurrentTier(2);
                AsyncStorage.setItem('currentTier', '2');
                Alert.alert('Tier 2 Activated', 'You now have access to advanced biomarker inputs.');
              }}
            >
              <Text style={styles.tierUpgradeText}>⬆️ Upgrade to Tier 2 Assessment</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Biomarker Input Screen
  if (currentScreen === 'input') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>Tier {currentTier} Biomarker Input</Text>
          <Text style={styles.subtitle}>Praxiom Validated Protocol</Text>

          {/* Tier 1 inputs */}
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
                  onChangeText={(value) => updateTier1Biomarker('age', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('salivaryPH', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Active MMP-8 (ng/mL) (Optimal: {'<'}60)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 55"
                  keyboardType="numeric"
                  value={tier1Biomarkers.activeMMP8}
                  onChangeText={(value) => updateTier1Biomarker('activeMMP8', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('salivaryFlowRate', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('hsCRP', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('omega3Index', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('gdf15', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('hbA1c', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('vitaminD', value)}
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
                  onChangeText={(value) => updateTier1Biomarker('heartRate', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily Steps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 7840"
                  keyboardType="numeric"
                  value={tier1Biomarkers.steps}
                  onChangeText={(value) => updateTier1Biomarker('steps', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Oxygen Saturation (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 96"
                  keyboardType="numeric"
                  value={tier1Biomarkers.oxygenSaturation}
                  onChangeText={(value) => updateTier1Biomarker('oxygenSaturation', value)}
                />
              </View>
            </View>

            {/* Tier 2 Inputs */}
            {currentTier === 2 && (
              <>
                <View style={styles.inputSection}>
                  <Text style={styles.sectionHeader}>🔬 Tier 2: Advanced Inflammatory Panel</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>IL-6 (pg/mL) (Optimal: {'<'}3.0)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 2.5"
                      keyboardType="numeric"
                      value={tier2Biomarkers.il6}
                      onChangeText={(value) => updateTier2Biomarker('il6', value)}
                    />
                    <Text style={styles.helperText}>Weight: 2.0× - Pro-inflammatory cytokine</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>IL-1β (pg/mL) (Optimal: {'<'}100)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 85"
                      keyboardType="numeric"
                      value={tier2Biomarkers.il1b}
                      onChangeText={(value) => updateTier2Biomarker('il1b', value)}
                    />
                    <Text style={styles.helperText}>Weight: 1.5× - Oral-systemic inflammation</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>8-OHdG (ng/mL) (Optimal: {'<'}4.0)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 3.5"
                      keyboardType="numeric"
                      value={tier2Biomarkers.ohd8}
                      onChangeText={(value) => updateTier2Biomarker('ohd8', value)}
                    />
                    <Text style={styles.helperText}>Weight: 1.5× - Oxidative stress/DNA damage</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Protein Carbonyls (nmol/mg) (Optimal: {'<'}2.0)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 1.8"
                      keyboardType="numeric"
                      value={tier2Biomarkers.proteinCarbonyls}
                      onChangeText={(value) => updateTier2Biomarker('proteinCarbonyls', value)}
                    />
                    <Text style={styles.helperText}>Weight: 1.5× - Direct oxidative damage</Text>
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.sectionHeader}>📊 Tier 2: Wearable Integration (Advanced)</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>HRV RMSSD (ms) (Optimal: {'>'}70)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 75"
                      keyboardType="numeric"
                      value={tier2Biomarkers.hrvRMSSD}
                      onChangeText={(value) => updateTier2Biomarker('hrvRMSSD', value)}
                    />
                    <Text style={styles.helperText}>Weight: 1.0× - Autonomic nervous system</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Sleep Efficiency (%) (Optimal: {'>'}85)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 88"
                      keyboardType="numeric"
                      value={tier2Biomarkers.sleepEfficiency}
                      onChangeText={(value) => updateTier2Biomarker('sleepEfficiency', value)}
                    />
                    <Text style={styles.helperText}>Weight: 1.0× - Sleep quality</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={currentTier === 2 ? calculateTier2Scores : calculateTier1Scores}
          >
            <Text style={styles.saveButtonText}>
              Calculate {currentTier === 2 ? 'Enhanced' : ''} Praxiom Bio-Age
            </Text>
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

  // DNA Methylation Input Screen
  if (currentScreen === 'epigenetic-input') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <NavBar />
        <ScrollView style={styles.content}>
          <Text style={styles.pageTitle}>DNA Methylation Test Input</Text>
          <Text style={styles.subtitle}>Epigenetic Age Assessment</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>📊 About DNA Methylation Tests</Text>
            <Text style={styles.infoCardText}>
              DNA methylation tests like DunedinPACE, GrimAge, or PhenoAge measure biological age at the cellular level. Input your test results here to refine your Praxiom Bio-Age calculation.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputSection}>
              <Text style={styles.sectionHeader}>Test Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Test Provider</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., TruDiagnostic, Elysium"
                  value={epigeneticData.testProvider}
                  onChangeText={(value) => updateEpigeneticData('testProvider', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Test Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2025-01-15"
                  value={epigeneticData.testDate}
                  onChangeText={(value) => updateEpigeneticData('testDate', value)}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionHeader}>DunedinPACE Results</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DunedinPACE Score</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 0.95 (1.0 = normal pace)"
                  keyboardType="numeric"
                  value={epigeneticData.dunedinPACE}
                  onChangeText={(value) => updateEpigeneticData('dunedinPACE', value)}
                />
                <Text style={styles.helperText}>
                  {'<'}1.0 = Slower aging | 1.0 = Normal | {'>'}1.0 = Faster aging
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ELOVL2 Methylation (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 45.2%"
                  keyboardType="numeric"
                  value={epigeneticData.elovl2Methylation}
                  onChangeText={(value) => updateEpigeneticData('elovl2Methylation', value)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Intrinsic Capacity Score (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 72"
                  keyboardType="numeric"
                  value={epigeneticData.intrinsicCapacity}
                  onChangeText={(value) => updateEpigeneticData('intrinsicCapacity', value)}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => {
              AsyncStorage.setItem('epigeneticData', JSON.stringify(epigeneticData));
              Alert.alert(
                'Saved', 
                'DNA methylation data saved. Your Bio-Age will be recalculated on the next assessment.',
                [{ text: 'OK', onPress: () => setCurrentScreen('dashboard') }]
              );
            }}
          >
            <Text style={styles.saveButtonText}>Save DNA Methylation Data</Text>
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
            <Text style={styles.settingsHeader}>Current Assessment Level</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsText}>Active Tier: Tier {currentTier}</Text>
              {currentTier === 1 && (
                <TouchableOpacity 
                  style={styles.settingsButton}
                  onPress={() => {
                    setCurrentTier(2);
                    AsyncStorage.setItem('currentTier', '2');
                    Alert.alert('Tier 2 Activated', 'You now have access to advanced biomarker inputs.');
                  }}
                >
                  <Text style={styles.settingsButtonText}>Upgrade to Tier 2</Text>
                </TouchableOpacity>
              )}
              {currentTier === 2 && (
                <TouchableOpacity 
                  style={[styles.settingsButton, { backgroundColor: '#999' }]}
                  onPress={() => {
                    setCurrentTier(1);
                    AsyncStorage.setItem('currentTier', '1');
                    Alert.alert('Switched to Tier 1', 'Using core biomarker assessment.');
                  }}
                >
                  <Text style={styles.settingsButtonText}>Switch to Tier 1</Text>
                </TouchableOpacity>
              )}
            </View>
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
                        setTier2Biomarkers({});
                        setEpigeneticData({});
                        setHealthScores({});
                        setDataHistory([]);
                        setCurrentTier(1);
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
              <Text style={styles.settingsSubtext}>Validated Tier 1 & 2 Algorithms</Text>
              <Text style={styles.settingsSubtext}>Evidence-based clinical framework</Text>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeader}>PineTime Integration Project</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.settingsText}>🔗 Unified Development</Text>
              <Text style={styles.settingsSubtext}>
                This app integrates with your custom Praxiom-branded PineTime firmware.
                The watch displays your biological age and syncs health data automatically.
              </Text>
              <Text style={[styles.settingsSubtext, {marginTop: 10, fontWeight: '600'}]}>
                Firmware Features:{'\n'}
                • Praxiom logo watchface{'\n'}
                • Bio-Age display{'\n'}
                • Optimized data storage{'\n'}
                • Automatic sync with app
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// Styles
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  tierBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tierBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  bioAgeEpigenetic: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 10,
    fontStyle: 'italic',
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
    marginBottom: 10,
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
  watchQuickButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  watchQuickButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#FFA500',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierUpgradePrompt: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  tierUpgradeText: {
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
  // Watch Connection Screen Styles
  connectedCard: {
    backgroundColor: '#e8f5e9',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  connectedIcon: {
    fontSize: 64,
    color: '#4CAF50',
    marginBottom: 15,
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  connectedDevice: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  connectedSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  syncButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 10,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#FFA500',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  devicesSection: {
    marginTop: 20,
  },
  devicesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
  },
  connectArrow: {
    fontSize: 24,
    color: '#FFA500',
  },
  scanningIndicator: {
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  scanningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  reasonsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  reasonCard: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  reasonDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalButtons: {
    gap: 10,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  laterButton: {
    backgroundColor: '#E0E0E0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // DNA Methylation Input Styles
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  infoCardText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
