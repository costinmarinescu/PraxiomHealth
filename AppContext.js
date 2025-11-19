import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as PraxiomAlgorithm from './services/PraxiomAlgorithm';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // State
  const [state, setState] = useState({
    // User Profile
    userId: null,
    userProfile: {
      dateOfBirth: null,
      chronologicalAge: null,
      biologicalAge: null,
      targetBioAge: null,
      assessmentTier: 'Foundation', // Foundation, Personalization, Optimization
    },

    // Tier 1 - Foundation
    tier1Data: {
      // Oral Health Biomarkers
      salivaryPH: null,
      mmp8: null,
      flowRate: null,
      // Systemic Health Biomarkers
      hsCRP: null,
      omega3Index: null,
      hba1c: null,
      gdf15: null,
      vitaminD: null,
      // Optional HRV
      hrv: null,
    },

    // Tier 2 - Personalization
    tier2Data: {
      // Advanced Inflammatory Panel
      il6: null,
      il1b: null,
      ohd8g: null,
      proteinCarbonyls: null,
      inflammAge: null,
      // NAD+ Metabolism Panel
      nadPlus: null,
      nadh: null,
      nmethylNicotinamide: null,
      cd38Activity: null,
      // Wearable Integration (30-day averages)
      hrvRMSSD: null,
      sleepEfficiency: null,
      deepSleep: null,
      remSleep: null,
      dailySteps: null,
      activeMinutes: null,
      // Oral Microbiome
      pGingivalis: null,
      fNucleatum: null,
      tDenticola: null,
      shannonDiversity: null,
      dysbiosisIndex: null,
    },

    // Tier 3 - Optimization
    tier3Data: {
      // Epigenetic Clocks
      dunedinPACE: null,
      grimAge2: null,
      phenoAge: null,
      intrinsicCapacity: null,
      // Proteomics
      gdf15Protein: null,
      igfbp2: null,
      cystatinC: null,
      osteopontin: null,
      proteinAge: null,
      // Cellular Senescence
      p16INK4a: null,
      saBetaGal: null,
      saspCytokines: null,
      // Optional Advanced Imaging
      mriScore: null,
      // Optional Genetic Risk
      geneticRiskScore: null,
    },

    // Optional Fitness Score (Tier 1)
    fitnessData: {
      aerobicFitness: null,
      flexibilityPosture: null,
      coordinationBalance: null,
      mentalPreparedness: null,
      compositeScore: null,
    },

    // Calculated Scores
    scores: {
      oralHealthScore: null,
      systemicHealthScore: null,
      inflammatoryScore: null,
      nadMetabolismScore: null,
      wearableScore: null,
      microbiomeScore: null,
      fitnessScore: null,
      vitalityIndex: null,
      bioAgeDeviation: null,
    },

    // History
    assessmentHistory: [],
    
    // Watch Connection
    watchConnected: false,
    watchDevice: null,
    lastSyncTime: null,
  });

  // Refs for services
  const servicesInitialized = useRef(false);

  // Initialize services on mount
  useEffect(() => {
    if (!servicesInitialized.current) {
      initializeServices();
      loadStoredData();
      servicesInitialized.current = true;
    }
  }, []);

  // Initialize any required services
  const initializeServices = async () => {
    try {
      console.log('📱 Initializing app services...');
      // Add any service initialization here
      console.log('✅ Services initialized');
    } catch (error) {
      console.error('❌ Service initialization error:', error);
    }
  };

  // Load stored data from AsyncStorage
  const loadStoredData = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('userProfile');
      const storedTier1 = await AsyncStorage.getItem('tier1Data');
      const storedTier2 = await AsyncStorage.getItem('tier2Data');
      const storedTier3 = await AsyncStorage.getItem('tier3Data');
      const storedFitness = await AsyncStorage.getItem('fitnessData');
      const storedHistory = await AsyncStorage.getItem('assessmentHistory');

      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setState(prev => ({
          ...prev,
          userProfile: { ...prev.userProfile, ...profile }
        }));
      }

      if (storedTier1) {
        setState(prev => ({
          ...prev,
          tier1Data: { ...prev.tier1Data, ...JSON.parse(storedTier1) }
        }));
      }

      if (storedTier2) {
        setState(prev => ({
          ...prev,
          tier2Data: { ...prev.tier2Data, ...JSON.parse(storedTier2) }
        }));
      }

      if (storedTier3) {
        setState(prev => ({
          ...prev,
          tier3Data: { ...prev.tier3Data, ...JSON.parse(storedTier3) }
        }));
      }

      if (storedFitness) {
        setState(prev => ({
          ...prev,
          fitnessData: { ...prev.fitnessData, ...JSON.parse(storedFitness) }
        }));
      }

      if (storedHistory) {
        setState(prev => ({
          ...prev,
          assessmentHistory: JSON.parse(storedHistory)
        }));
      }

      console.log('✅ Loaded stored data successfully');
    } catch (error) {
      console.error('❌ Error loading stored data:', error);
    }
  };

  // Update state with automatic persistence
  const updateState = async (updates) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Persist specific sections to AsyncStorage
      if (updates.userProfile) {
        AsyncStorage.setItem('userProfile', JSON.stringify(newState.userProfile));
      }
      if (updates.tier1Data) {
        AsyncStorage.setItem('tier1Data', JSON.stringify(newState.tier1Data));
      }
      if (updates.tier2Data) {
        AsyncStorage.setItem('tier2Data', JSON.stringify(newState.tier2Data));
      }
      if (updates.tier3Data) {
        AsyncStorage.setItem('tier3Data', JSON.stringify(newState.tier3Data));
      }
      if (updates.fitnessData) {
        AsyncStorage.setItem('fitnessData', JSON.stringify(newState.fitnessData));
      }
      if (updates.assessmentHistory) {
        AsyncStorage.setItem('assessmentHistory', JSON.stringify(newState.assessmentHistory));
      }
      
      return newState;
    });
  };

  // Calculate chronological age from date of birth
  const calculateChronologicalAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };

  // Update date of birth and recalculate age
  const updateDateOfBirth = async (dateOfBirth) => {
    const chronologicalAge = calculateChronologicalAge(dateOfBirth);
    
    await updateState({
      userProfile: {
        ...state.userProfile,
        dateOfBirth,
        chronologicalAge,
      }
    });

    console.log('✅ Date of birth updated:', { dateOfBirth, chronologicalAge });
  };

  // ========================================
  // TIER 1 CALCULATION - Uses PraxiomAlgorithm.js
  // ========================================
  const calculateTier1BioAge = async () => {
    try {
      const chronAge = state.userProfile.chronologicalAge;
      
      if (!chronAge) {
        throw new Error('Chronological age not set. Please enter date of birth first.');
      }

      console.log('🧮 Starting Tier 1 Bio-Age Calculation...');
      console.log('📊 Input Data:', {
        chronologicalAge: chronAge,
        tier1Data: state.tier1Data,
        fitnessData: state.fitnessData,
      });

      // Calculate using the PraxiomAlgorithm module
      const result = PraxiomAlgorithm.calculateTier1BioAge(
        chronAge,
        state.tier1Data,
        state.fitnessData
      );

      console.log('✅ Tier 1 Calculation Result:', result);

      // Update state with results
      await updateState({
        userProfile: {
          ...state.userProfile,
          biologicalAge: result.bioAge,
          targetBioAge: Math.max(18, result.bioAge - 5), // Target is 5 years younger
        },
        scores: {
          ...state.scores,
          oralHealthScore: result.scores.oralHealthScore,
          systemicHealthScore: result.scores.systemicHealthScore,
          fitnessScore: result.scores.fitnessScore,
          vitalityIndex: result.scores.vitalityIndex,
          bioAgeDeviation: result.bioAge - chronAge,
        },
        assessmentHistory: [
          {
            date: new Date().toISOString(),
            tier: 'Foundation',
            biologicalAge: result.bioAge,
            chronologicalAge: chronAge,
            scores: result.scores,
            biomarkers: { ...state.tier1Data },
          },
          ...state.assessmentHistory,
        ],
      });

      return result;
    } catch (error) {
      console.error('❌ Tier 1 calculation error:', error);
      throw error;
    }
  };

  // ========================================
  // TIER 2 CALCULATION - Uses PraxiomAlgorithm.js
  // ========================================
  const calculateTier2BioAge = async () => {
    try {
      const chronAge = state.userProfile.chronologicalAge;
      
      if (!chronAge) {
        throw new Error('Chronological age not set. Please enter date of birth first.');
      }

      console.log('🧮 Starting Tier 2 Bio-Age Calculation...');
      console.log('📊 Input Data:', {
        chronologicalAge: chronAge,
        tier1Data: state.tier1Data,
        tier2Data: state.tier2Data,
        fitnessData: state.fitnessData,
      });

      // Calculate using the PraxiomAlgorithm module
      const result = PraxiomAlgorithm.calculateTier2BioAge(
        chronAge,
        state.tier1Data,
        state.tier2Data,
        state.fitnessData
      );

      console.log('✅ Tier 2 Calculation Result:', result);

      // Update state with results
      await updateState({
        userProfile: {
          ...state.userProfile,
          biologicalAge: result.bioAge,
          targetBioAge: Math.max(18, result.bioAge - 5),
          assessmentTier: 'Personalization',
        },
        scores: {
          ...state.scores,
          oralHealthScore: result.scores.oralHealthScore,
          systemicHealthScore: result.scores.systemicHealthScore,
          inflammatoryScore: result.scores.inflammatoryScore,
          nadMetabolismScore: result.scores.nadMetabolismScore,
          wearableScore: result.scores.wearableScore,
          microbiomeScore: result.scores.microbiomeScore,
          fitnessScore: result.scores.fitnessScore,
          vitalityIndex: result.scores.vitalityIndex,
          bioAgeDeviation: result.bioAge - chronAge,
        },
        assessmentHistory: [
          {
            date: new Date().toISOString(),
            tier: 'Personalization',
            biologicalAge: result.bioAge,
            chronologicalAge: chronAge,
            scores: result.scores,
            biomarkers: { ...state.tier1Data, ...state.tier2Data },
          },
          ...state.assessmentHistory,
        ],
      });

      return result;
    } catch (error) {
      console.error('❌ Tier 2 calculation error:', error);
      throw error;
    }
  };

  // ========================================
  // TIER 3 CALCULATION - Uses PraxiomAlgorithm.js
  // ========================================
  const calculateTier3BioAge = async () => {
    try {
      const chronAge = state.userProfile.chronologicalAge;
      
      if (!chronAge) {
        throw new Error('Chronological age not set. Please enter date of birth first.');
      }

      console.log('🧮 Starting Tier 3 Bio-Age Calculation...');
      console.log('📊 Input Data:', {
        chronologicalAge: chronAge,
        tier1Data: state.tier1Data,
        tier2Data: state.tier2Data,
        tier3Data: state.tier3Data,
        fitnessData: state.fitnessData,
      });

      // Calculate using the PraxiomAlgorithm module
      const result = PraxiomAlgorithm.calculateTier3BioAge(
        chronAge,
        state.tier1Data,
        state.tier2Data,
        state.tier3Data,
        state.fitnessData
      );

      console.log('✅ Tier 3 Calculation Result:', result);

      // Update state with results
      await updateState({
        userProfile: {
          ...state.userProfile,
          biologicalAge: result.bioAge,
          targetBioAge: Math.max(18, result.bioAge - 10),
          assessmentTier: 'Optimization',
        },
        scores: {
          ...state.scores,
          oralHealthScore: result.scores.oralHealthScore,
          systemicHealthScore: result.scores.systemicHealthScore,
          inflammatoryScore: result.scores.inflammatoryScore,
          nadMetabolismScore: result.scores.nadMetabolismScore,
          wearableScore: result.scores.wearableScore,
          microbiomeScore: result.scores.microbiomeScore,
          fitnessScore: result.scores.fitnessScore,
          vitalityIndex: result.scores.vitalityIndex,
          bioAgeDeviation: result.bioAge - chronAge,
        },
        assessmentHistory: [
          {
            date: new Date().toISOString(),
            tier: 'Optimization',
            biologicalAge: result.bioAge,
            chronologicalAge: chronAge,
            scores: result.scores,
            biomarkers: { ...state.tier1Data, ...state.tier2Data, ...state.tier3Data },
          },
          ...state.assessmentHistory,
        ],
      });

      return result;
    } catch (error) {
      console.error('❌ Tier 3 calculation error:', error);
      throw error;
    }
  };

  // Watch connection management
  const setWatchConnection = async (connected, device = null) => {
    await updateState({
      watchConnected: connected,
      watchDevice: device,
      lastSyncTime: connected ? new Date().toISOString() : state.lastSyncTime,
    });
  };

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Functions
    updateState,
    updateDateOfBirth,
    calculateChronologicalAge,
    
    // Tier Calculations
    calculateTier1BioAge,
    calculateTier2BioAge,
    calculateTier3BioAge,
    
    // Watch Management
    setWatchConnection,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
