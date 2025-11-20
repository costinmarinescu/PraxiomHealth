import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import SecureStorageService from './services/SecureStorageService';
import { encode as base64Encode } from 'base-64';

// ✅ FIX #1: Import with aliases to avoid shadowing
import { 
  calculateTier1BioAge as tier1Algorithm,
  calculateTier2BioAge as tier2Algorithm, 
  calculateTier3BioAge as tier3Algorithm 
} from './services/PraxiomAlgorithm';

export const AppContext = createContext();

const bleManager = new BleManager();

// PineTime BLE Service UUIDs
const PINETIME_SERVICE_UUID = '00000000-78fc-48fe-8e23-433b3a1942d0';
const BIO_AGE_CHAR_UUID = '00000001-78fc-48fe-8e23-433b3a1942d0';

export const AppProvider = ({ children }) => {
  // User Profile State
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [chronologicalAge, setChronologicalAge] = useState(null);
  
  // Biological Age State
  const [bioAge, setBioAge] = useState(null);
  const [lastCalculated, setLastCalculated] = useState(null);
  
  // Biomarker Data State
  const [tier1Biomarkers, setTier1Biomarkers] = useState({});
  const [tier2Biomarkers, setTier2Biomarkers] = useState({});
  const [tier3Biomarkers, setTier3Biomarkers] = useState({});
  
  // Assessment Results State  
  const [tier1Results, setTier1Results] = useState(null);
  const [tier2Results, setTier2Results] = useState(null);
  const [tier3Results, setTier3Results] = useState(null);
  const [fitnessAssessment, setFitnessAssessment] = useState(null);
  
  // History State
  const [biomarkerHistory, setBiomarkerHistory] = useState([]);
  
  // Watch Connection State
  const [watchConnected, setWatchConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  
  // Settings State
  const [notifications, setNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize app - load all data from secure storage
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Load user profile
        const savedDOB = await SecureStorageService.getItem('dateOfBirth');
        if (savedDOB) {
          setDateOfBirth(savedDOB);
          const age = calculateAge(savedDOB);
          setChronologicalAge(age);
        }
        
        // Load biological age
        const savedBioAge = await SecureStorageService.getItem('bioAge');
        if (savedBioAge) setBioAge(savedBioAge);
        
        const savedLastCalc = await SecureStorageService.getItem('lastCalculated');
        if (savedLastCalc) setLastCalculated(savedLastCalc);
        
        // Load biomarkers
        const savedT1 = await SecureStorageService.getItem('tier1Biomarkers');
        if (savedT1) setTier1Biomarkers(savedT1);
        
        const savedT2 = await SecureStorageService.getItem('tier2Biomarkers');
        if (savedT2) setTier2Biomarkers(savedT2);
        
        const savedT3 = await SecureStorageService.getItem('tier3Biomarkers');
        if (savedT3) setTier3Biomarkers(savedT3);
        
        // Load assessment results
        const savedT1Results = await SecureStorageService.getItem('tier1Results');
        if (savedT1Results) setTier1Results(savedT1Results);
        
        const savedT2Results = await SecureStorageService.getItem('tier2Results');
        if (savedT2Results) setTier2Results(savedT2Results);
        
        const savedT3Results = await SecureStorageService.getItem('tier3Results');
        if (savedT3Results) setTier3Results(savedT3Results);
        
        const savedFitness = await SecureStorageService.getItem('fitnessAssessment');
        if (savedFitness) setFitnessAssessment(savedFitness);
        
        // Load history
        const savedHistory = await SecureStorageService.getItem('biomarkerHistory');
        if (savedHistory) setBiomarkerHistory(savedHistory);
        
        // ✅ FIX #2: Ensure boolean values properly restored
        const savedAutoSync = await SecureStorageService.getItem('autoSync');
        if (savedAutoSync !== null) {
          setAutoSync(savedAutoSync === true || savedAutoSync === 'true');
        }
        
        const savedNotif = await SecureStorageService.getItem('notifications');
        if (savedNotif !== null) {
          setNotifications(savedNotif === true || savedNotif === 'true');
        }
        
        const savedSharing = await SecureStorageService.getItem('dataSharing');
        if (savedSharing !== null) {
          setDataSharing(savedSharing === true || savedSharing === 'true');
        }
        
        console.log('✅ App initialized successfully');
      } catch (error) {
        console.error('❌ App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  /**
   * Calculate age from date of birth
   */
  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /**
   * Save date of birth and calculate age
   */
  const saveDateOfBirth = async (dob) => {
    try {
      await SecureStorageService.setItem('dateOfBirth', dob);
      setDateOfBirth(dob);
      const age = calculateAge(dob);
      setChronologicalAge(age);
      console.log(`✅ DOB saved: ${dob}, Age: ${age}`);
    } catch (error) {
      console.error('❌ Error saving DOB:', error);
      throw error;
    }
  };

  /**
   * ✅ FIX #1: Calculate Tier 1 Bio-Age using imported algorithm
   */
  const processTier1Calculation = async () => {
    try {
      if (!chronologicalAge) {
        throw new Error('Please set your date of birth first');
      }

      console.log('🧮 Calculating Tier 1 Bio-Age with PraxiomAlgorithm...');
      console.log('Input data:', { chronologicalAge, tier1Biomarkers, fitnessAssessment });

      // ✅ Call the IMPORTED algorithm function (not local)
      const results = tier1Algorithm(
        chronologicalAge,
        tier1Biomarkers,
        fitnessAssessment
      );

      console.log('📊 Tier 1 Results:', results);

      // Save results
      await SecureStorageService.setItem('tier1Results', results);
      setTier1Results(results);

      // Save bio-age
      await SecureStorageService.setItem('bioAge', results.bioAge);
      setBioAge(results.bioAge);

      const timestamp = new Date().toISOString();
      await SecureStorageService.setItem('lastCalculated', timestamp);
      setLastCalculated(timestamp);

      // Add to history immediately
      await addToHistory({
        tier: 1,
        bioAge: results.bioAge,
        ohs: results.oralHealthScore,
        shs: results.systemicHealthScore,
        fs: results.fitnessScore,
        timestamp: timestamp
      });

      // ✅ FIX #2: Auto-sync to watch if enabled (with proper type checking)
      console.log(`🔄 Auto-sync check: enabled=${autoSync} (type: ${typeof autoSync}), connected=${watchConnected}`);
      if (autoSync === true && watchConnected && connectedDevice) {
        console.log('🔄 Auto-syncing bio-age to watch...');
        await syncBioAgeToWatch(results.bioAge);
      } else {
        console.log('⏸️ Auto-sync skipped:', {
          autoSync: autoSync,
          autoSyncType: typeof autoSync,
          watchConnected,
          hasDevice: !!connectedDevice
        });
      }

      console.log('✅ Tier 1 calculation complete');
      return results;

    } catch (error) {
      console.error('❌ Tier 1 calculation error:', error);
      throw error;
    }
  };

  /**
   * ✅ FIX #1: Calculate Tier 2 Bio-Age using imported algorithm
   */
  const processTier2Calculation = async () => {
    try {
      if (!chronologicalAge) {
        throw new Error('Please set your date of birth first');
      }
      if (!tier1Results) {
        throw new Error('Please complete Tier 1 assessment first');
      }

      console.log('🧮 Calculating Tier 2 Bio-Age with PraxiomAlgorithm...');

      // ✅ Call the IMPORTED algorithm function
      const results = tier2Algorithm(
        chronologicalAge,
        tier1Results,
        tier2Biomarkers,
        fitnessAssessment
      );

      console.log('📊 Tier 2 Results:', results);

      await SecureStorageService.setItem('tier2Results', results);
      setTier2Results(results);

      await SecureStorageService.setItem('bioAge', results.bioAge);
      setBioAge(results.bioAge);

      const timestamp = new Date().toISOString();
      await SecureStorageService.setItem('lastCalculated', timestamp);
      setLastCalculated(timestamp);

      // Add to history
      await addToHistory({
        tier: 2,
        bioAge: results.bioAge,
        ohs: results.oralHealthScore,
        shs: results.systemicHealthScore,
        inflammatoryScore: results.inflammatoryScore,
        nadScore: results.nadMetabolismScore,
        timestamp: timestamp
      });

      // Auto-sync to watch
      console.log(`🔄 Auto-sync check: enabled=${autoSync}, connected=${watchConnected}`);
      if (autoSync === true && watchConnected && connectedDevice) {
        console.log('🔄 Auto-syncing bio-age to watch...');
        await syncBioAgeToWatch(results.bioAge);
      }

      console.log('✅ Tier 2 calculation complete');
      return results;

    } catch (error) {
      console.error('❌ Tier 2 calculation error:', error);
      throw error;
    }
  };

  /**
   * ✅ FIX #1: Calculate Tier 3 Bio-Age using imported algorithm
   */
  const processTier3Calculation = async () => {
    try {
      if (!chronologicalAge) {
        throw new Error('Please set your date of birth first');
      }
      if (!tier2Results) {
        throw new Error('Please complete Tier 2 assessment first');
      }

      console.log('🧮 Calculating Tier 3 Bio-Age with PraxiomAlgorithm...');

      // ✅ Call the IMPORTED algorithm function
      const results = tier3Algorithm(
        chronologicalAge,
        tier1Results,
        tier2Results,
        tier3Biomarkers,
        fitnessAssessment
      );

      console.log('📊 Tier 3 Results:', results);

      await SecureStorageService.setItem('tier3Results', results);
      setTier3Results(results);

      await SecureStorageService.setItem('bioAge', results.bioAge);
      setBioAge(results.bioAge);

      const timestamp = new Date().toISOString();
      await SecureStorageService.setItem('lastCalculated', timestamp);
      setLastCalculated(timestamp);

      // Add to history
      await addToHistory({
        tier: 3,
        bioAge: results.bioAge,
        ohs: results.oralHealthScore,
        shs: results.systemicHealthScore,
        epigeneticScore: results.epigeneticDeviation,
        proteomicScore: results.proteomicAdjustment,
        timestamp: timestamp
      });

      // Auto-sync to watch
      console.log(`🔄 Auto-sync check: enabled=${autoSync}, connected=${watchConnected}`);
      if (autoSync === true && watchConnected && connectedDevice) {
        console.log('🔄 Auto-syncing bio-age to watch...');
        await syncBioAgeToWatch(results.bioAge);
      }

      console.log('✅ Tier 3 calculation complete');
      return results;

    } catch (error) {
      console.error('❌ Tier 3 calculation error:', error);
      throw error;
    }
  };

  /**
   * Add entry to biomarker history
   */
  const addToHistory = async (entry) => {
    try {
      const updatedHistory = [...biomarkerHistory, entry];
      await SecureStorageService.setItem('biomarkerHistory', updatedHistory);
      setBiomarkerHistory(updatedHistory);
      console.log('✅ Added to history');
    } catch (error) {
      console.error('❌ Error adding to history:', error);
    }
  };

  /**
   * Save Tier 1 biomarkers
   */
  const saveTier1Biomarkers = async (biomarkers) => {
    try {
      await SecureStorageService.setItem('tier1Biomarkers', biomarkers);
      setTier1Biomarkers(biomarkers);
      console.log('✅ Tier 1 biomarkers saved');
    } catch (error) {
      console.error('❌ Error saving Tier 1 biomarkers:', error);
      throw error;
    }
  };

  /**
   * Save Tier 2 biomarkers
   */
  const saveTier2Biomarkers = async (biomarkers) => {
    try {
      await SecureStorageService.setItem('tier2Biomarkers', biomarkers);
      setTier2Biomarkers(biomarkers);
      console.log('✅ Tier 2 biomarkers saved');
    } catch (error) {
      console.error('❌ Error saving Tier 2 biomarkers:', error);
      throw error;
    }
  };

  /**
   * Save Tier 3 biomarkers
   */
  const saveTier3Biomarkers = async (biomarkers) => {
    try {
      await SecureStorageService.setItem('tier3Biomarkers', biomarkers);
      setTier3Biomarkers(biomarkers);
      console.log('✅ Tier 3 biomarkers saved');
    } catch (error) {
      console.error('❌ Error saving Tier 3 biomarkers:', error);
      throw error;
    }
  };

  /**
   * Save fitness assessment
   */
  const saveFitnessAssessment = async (assessment) => {
    try {
      await SecureStorageService.setItem('fitnessAssessment', assessment);
      setFitnessAssessment(assessment);
      console.log('✅ Fitness assessment saved');
    } catch (error) {
      console.error('❌ Error saving fitness assessment:', error);
      throw error;
    }
  };

  /**
   * ✅ FIX #4: Sync bio-age to watch with proper React Native encoding
   */
  const syncBioAgeToWatch = async (bioAgeValue = null) => {
    try {
      const ageToSync = bioAgeValue || bioAge;
      
      if (!ageToSync) {
        throw new Error('No bio-age to sync');
      }
      
      if (!watchConnected || !connectedDevice) {
        throw new Error('Watch not connected');
      }

      console.log(`📡 Syncing bio-age to watch: ${ageToSync}`);

      // ✅ Use React Native compatible base64 encoding
      const ageString = ageToSync.toString();
      const base64Data = base64Encode(ageString);

      // Write to characteristic
      await connectedDevice.writeCharacteristicWithResponseForService(
        PINETIME_SERVICE_UUID,
        BIO_AGE_CHAR_UUID,
        base64Data
      );

      console.log('✅ Bio-age synced to watch successfully');
      return true;

    } catch (error) {
      console.error('❌ Watch sync error:', error);
      throw error;
    }
  };

  /**
   * Connect to PineTime watch
   */
  const connectToWatch = async () => {
    try {
      console.log('🔍 Scanning for PineTime watch...');

      const devices = await bleManager.startDeviceScan(
        [PINETIME_SERVICE_UUID],
        null,
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }

          if (device && device.name?.includes('PineTime')) {
            bleManager.stopDeviceScan();
            connectToDevice(device);
          }
        }
      );

      // Timeout after 10 seconds
      setTimeout(() => {
        bleManager.stopDeviceScan();
        console.log('⏱️ Scan timeout');
      }, 10000);

    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  };

  /**
   * Connect to specific device
   */
  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      
      setConnectedDevice(connected);
      setWatchConnected(true);
      
      console.log('✅ Connected to PineTime watch');

      // Auto-sync if enabled and bio-age exists
      if (autoSync === true && bioAge) {
        console.log('🔄 Auto-syncing on connection...');
        await syncBioAgeToWatch();
      }

    } catch (error) {
      console.error('❌ Device connection error:', error);
      throw error;
    }
  };

  /**
   * Disconnect from watch
   */
  const disconnectFromWatch = async () => {
    try {
      if (connectedDevice) {
        await connectedDevice.cancelConnection();
      }
      setConnectedDevice(null);
      setWatchConnected(false);
      console.log('✅ Disconnected from watch');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  };

  /**
   * ✅ FIX #2: Toggle auto-sync with proper boolean handling
   */
  const toggleAutoSync = async (value) => {
    try {
      // Ensure boolean value
      const boolValue = value === true || value === 'true';
      
      console.log(`🔄 Setting auto-sync to: ${boolValue} (type: ${typeof boolValue})`);
      
      // Save to storage first
      await SecureStorageService.setItem('autoSync', boolValue);
      
      // Then update state
      setAutoSync(boolValue);
      
      console.log('✅ Auto-sync setting saved');
      
      // If enabling and conditions are met, sync immediately
      if (boolValue && watchConnected && bioAge) {
        console.log('🔄 Auto-sync enabled, syncing immediately...');
        await syncBioAgeToWatch();
      }
      
    } catch (error) {
      console.error('❌ Error toggling auto-sync:', error);
      throw error;
    }
  };

  /**
   * Toggle notifications
   */
  const toggleNotifications = async (value) => {
    try {
      const boolValue = value === true || value === 'true';
      await SecureStorageService.setItem('notifications', boolValue);
      setNotifications(boolValue);
    } catch (error) {
      console.error('❌ Error toggling notifications:', error);
    }
  };

  /**
   * Toggle data sharing
   */
  const toggleDataSharing = async (value) => {
    try {
      const boolValue = value === true || value === 'true';
      await SecureStorageService.setItem('dataSharing', boolValue);
      setDataSharing(boolValue);
    } catch (error) {
      console.error('❌ Error toggling data sharing:', error);
    }
  };

  /**
   * Get watch connection info
   */
  const getWatchInfo = () => {
    return {
      connected: watchConnected,
      deviceName: connectedDevice?.name || 'Not connected',
      autoSync: autoSync
    };
  };

  // Context value
  const value = {
    // User Profile
    dateOfBirth,
    chronologicalAge,
    saveDateOfBirth,
    
    // Biological Age
    bioAge,
    lastCalculated,
    
    // Biomarkers
    tier1Biomarkers,
    tier2Biomarkers,
    tier3Biomarkers,
    saveTier1Biomarkers,
    saveTier2Biomarkers,
    saveTier3Biomarkers,
    
    // Assessment Results
    tier1Results,
    tier2Results,
    tier3Results,
    fitnessAssessment,
    saveFitnessAssessment,
    
    // ✅ FIX: Export renamed functions (not shadowing imports)
    calculateTier1BioAge: processTier1Calculation,
    calculateTier2BioAge: processTier2Calculation,
    calculateTier3BioAge: processTier3Calculation,
    
    // History
    biomarkerHistory,
    addToHistory,
    
    // Watch Connection
    watchConnected,
    connectedDevice,
    autoSync,
    connectToWatch,
    disconnectFromWatch,
    syncBioAgeToWatch,
    toggleAutoSync,
    getWatchInfo,
    
    // Settings
    notifications,
    dataSharing,
    toggleNotifications,
    toggleDataSharing,
    
    // Loading
    isLoading
  };

  if (isLoading) {
    return null; // Or return a loading screen component
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
