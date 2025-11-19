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
  console.log('🔧 AppProvider initializing...');
  
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
    
    // Loading state
    isLoading: true,
    loadError: null,
  });

  // Refs for services
  const servicesInitialized = useRef(false);
  const isMounted = useRef(true);

  // Initialize services on mount
  useEffect(() => {
    console.log('🚀 AppContext useEffect triggered');
    
    const init = async () => {
      if (!servicesInitialized.current) {
        try {
          console.log('📱 Starting initialization...');
          await initializeServices();
          await loadStoredData();
          
          if (isMounted.current) {
            servicesInitialized.current = true;
            setState(prev => ({ ...prev, isLoading: false }));
            console.log('✅ Initialization complete');
          }
        } catch (error) {
          console.error('❌ Initialization error:', error);
          if (isMounted.current) {
            setState(prev => ({ 
              ...prev, 
              isLoading: false,
              loadError: error.message 
            }));
          }
        }
      }
    };
    
    init();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize any required services
  const initializeServices = async () => {
    try {
      console.log('📱 Initializing app services...');
      // Add any service initialization here
      console.log('✅ Services initialized');
      return true;
    } catch (error) {
      console.error('❌ Service initialization error:', error);
      throw error;
    }
  };

  // Load stored data from AsyncStorage
  const loadStoredData = async () => {
    try {
      console.log('💾 Loading stored data...');
      
      const [storedProfile, storedTier1, storedTier2, storedTier3, storedFitness, storedHistory] = await Promise.all([
        AsyncStorage.getItem('userProfile').catch(e => { console.warn('Profile load error:', e); return null; }),
        AsyncStorage.getItem('tier1Data').catch(e => { console.warn('Tier1 load error:', e); return null; }),
        AsyncStorage.getItem('tier2Data').catch(e => { console.warn('Tier2 load error:', e); return null; }),
        AsyncStorage.getItem('tier3Data').catch(e => { console.warn('Tier3 load error:', e); return null; }),
        AsyncStorage.getItem('fitnessData').catch(e => { console.warn('Fitness load error:', e); return null; }),
        AsyncStorage.getItem('assessmentHistory').catch(e => { console.warn('History load error:', e); return null; }),
      ]);

      const updates = {};
      
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          updates.userProfile = { ...state.userProfile, ...profile };
          console.log('✅ Loaded user profile');
        } catch (e) {
          console.warn('Failed to parse user profile:', e);
        }
      }

      if (storedTier1) {
        try {
          updates.tier1Data = { ...state.tier1Data, ...JSON.parse(storedTier1) };
          console.log('✅ Loaded tier 1 data');
        } catch (e) {
          console.warn('Failed to parse tier 1 data:', e);
        }
      }

      if (storedTier2) {
        try {
          updates.tier2Data = { ...state.tier2Data, ...JSON.parse(storedTier2) };
          console.log('✅ Loaded tier 2 data');
        } catch (e) {
          console.warn('Failed to parse tier 2 data:', e);
        }
      }

      if (storedTier3) {
        try {
          updates.tier3Data = { ...state.tier3Data, ...JSON.parse(storedTier3) };
          console.log('✅ Loaded tier 3 data');
        } catch (e) {
          console.warn('Failed to parse tier 3 data:', e);
        }
      }

      if (storedFitness) {
        try {
          updates.fitnessData = { ...state.fitnessData, ...JSON.parse(storedFitness) };
          console.log('✅ Loaded fitness data');
        } catch (e) {
          console.warn('Failed to parse fitness data:', e);
        }
      }

      if (storedHistory) {
        try {
          updates.assessmentHistory = JSON.parse(storedHistory);
          console.log('✅ Loaded assessment history');
        } catch (e) {
          console.warn('Failed to parse assessment history:', e);
        }
      }

      if (Object.keys(updates).length > 0 && isMounted.current) {
        setState(prev => ({ ...prev, ...updates }));
      }

      console.log('✅ Loaded stored data successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading stored data:', error);
      // Don't throw - allow app to continue with default state
      return false;
    }
  };

  // Update state with automatic persistence
  const updateState = async (updates) => {
    try {
      setState(prev => {
        const newState = { ...prev, ...updates };
        
        // Persist specific sections to AsyncStorage (non-blocking)
        if (updates.userProfile) {
          AsyncStorage.setItem('userProfile', JSON.stringify(newState.userProfile)).catch(e => 
            console.warn('Failed to save userProfile:', e)
          );
        }
        if (updates.tier1Data) {
          AsyncStorage.setItem('tier1Data', JSON.stringify(newState.tier1Data)).catch(e => 
            console.warn('Failed to save tier1Data:', e)
          );
        }
        if (updates.tier2Data) {
          AsyncStorage.setItem('tier2Data', JSON.stringify(newState.tier2Data)).catch(e => 
            console.warn('Failed to save tier2Data:', e)
          );
        }
        if (updates.tier3Data) {
          AsyncStorage.setItem('tier3Data', JSON.stringify(newState.tier3Data)).catch(e => 
            console.warn('Failed to save tier3Data:', e)
          );
        }
        if (updates.fitnessData) {
          AsyncStorage.setItem('fitnessData', JSON.stringify(newState.fitnessData)).catch(e => 
            console.warn('Failed to save fitnessData:', e)
          );
        }
        if (updates.assessmentHistory) {
          AsyncStorage.setItem('assessmentHistory', JSON.stringify(newState.assessmentHistory)).catch(e => 
            console.warn('Failed to save assessmentHistory:', e)
          );
        }
        
        return newState;
      });
    } catch (error) {
      console.error('❌ updateState error:', error);
    }
  };

  // Calculate chronological age from date of birth
  const calculateChronologicalAge = (dateOfBirth) => {
    try {
      if (!dateOfBirth) return null;
      
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        console.warn('Invalid date of birth:', dateOfBirth);
        return null;
      }
      
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('❌ calculateChronologicalAge error:', error);
      return null;
    }
  };

  // Update date of birth and recalculate age
  const updateDateOfBirth = async (dateOfBirth) => {
    try {
      const chronologicalAge = calculateChronologicalAge(dateOfBirth);
      
      await updateState({
        userProfile: {
          ...state.userProfile,
          dateOfBirth,
          chronologicalAge,
        }
      });

      console.log('✅ Date of birth updated:', { dateOfBirth, chronologicalAge });
    } catch (error) {
      console.error('❌ updateDateOfBirth error:', error);
      throw error;
    }
  };

  // ========================================
  // TIER 1 CALCULATION - Uses PraxiomAlgorithm.js
  // ========================================
  const calculateTier1BioAge = async () => {
    try {
      const chronAge = state.userProfile.chronologicalAge;
      
      if (!chronAge || chronAge <= 0) {
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
      
      if (!chronAge || chronAge <= 0) {
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
      
      if (!chronAge || chronAge <= 0) {
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
    try {
      await updateState({
        watchConnected: connected,
        watchDevice: device,
        lastSyncTime: connected ? new Date().toISOString() : state.lastSyncTime,
      });
    } catch (error) {
      console.error('❌ setWatchConnection error:', error);
    }
  };

  // Context value - useMemo to prevent recreating on every render
  const contextValue = React.useMemo(() => ({
    // State - spread all state properties
    userId: state.userId,
    userProfile: state.userProfile,
    tier1Data: state.tier1Data,
    tier2Data: state.tier2Data,
    tier3Data: state.tier3Data,
    fitnessData: state.fitnessData,
    scores: state.scores,
    assessmentHistory: state.assessmentHistory,
    watchConnected: state.watchConnected,
    watchDevice: state.watchDevice,
    lastSyncTime: state.lastSyncTime,
    isLoading: state.isLoading,
    loadError: state.loadError,
    
    // Functions
    updateState,
    updateDateOfBirth,
    calculateChronologicalAge,
    calculateTier1BioAge,
    calculateTier2BioAge,
    calculateTier3BioAge,
    setWatchConnection,
  }), [
    state.userId,
    state.userProfile,
    state.tier1Data,
    state.tier2Data,
    state.tier3Data,
    state.fitnessData,
    state.scores,
    state.assessmentHistory,
    state.watchConnected,
    state.watchDevice,
    state.lastSyncTime,
    state.isLoading,
    state.loadError,
  ]);

  console.log('✅ AppContext render complete, isLoading:', state.isLoading);
  console.log('✅ Context value has userProfile:', !!contextValue.userProfile);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
