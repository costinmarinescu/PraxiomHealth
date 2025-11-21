import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableService from './services/WearableService';
import PraxiomAlgorithm from './services/PraxiomAlgorithm';

// ✅ CRITICAL FIX: Wrap Oura import in try-catch to prevent crash if module has issues
let OuraRingService = null;
try {
  OuraRingService = require('./services/OuraRingService').default;
  console.log('✅ OuraRingService loaded successfully');
} catch (error) {
  console.error('⚠️ OuraRingService failed to load, disabling Oura features:', error);
}

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [state, setState] = useState({
    chronologicalAge: 0,
    userName: '',
    biologicalAge: 70.1,
    oralHealthScore: 50,
    systemicHealthScore: 45,
    vitalityIndex: 47.5,
    fitnessScore: 65,
    watchConnected: false,
    ouraConnected: false,
    lastSync: null,
    lastOuraSync: null,
    
    // Tier 1 Biomarkers
    salivaryPH: null,
    mmp8: null,
    flowRate: null,
    hsCRP: null,
    omega3Index: null,
    hba1c: null,
    gdf15: null,
    vitaminD: null,
    
    // Fitness Assessment Data
    aerobicScore: null,
    flexibilityScore: null,
    balanceScore: null,
    mindBodyScore: null,
    fitnessAssessmentDate: null,
    
    // Wearable Data (PineTime)
    heartRate: null,
    steps: 0,
    hrv: null,
    
    // Oura Ring Data
    ouraHeartRate: null,
    ouraHRV: null,
    ouraSteps: null,
    ouraSleepEfficiency: null,
    ouraReadinessScore: null,
  });

  // ✅ CRITICAL FIX: Wrap all initialization in error handlers
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await loadSavedData();
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
      
      try {
        await loadUserProfile();
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
      
      try {
        await initializeWearables();
      } catch (error) {
        console.error('Error initializing wearables:', error);
      }
    };
    
    initializeApp();
  }, []);

  // ✅ CRITICAL FIX: Fully defensive initialization
  const initializeWearables = async () => {
    // Skip if Oura service didn't load
    if (!OuraRingService) {
      console.log('⚠️ Oura Ring features disabled (module not loaded)');
      return;
    }
    
    try {
      await OuraRingService.initialize();
      const ouraStatus = OuraRingService.getConnectionStatus();
      
      if (ouraStatus && ouraStatus.isConnected) {
        updateState({
          ouraConnected: true,
          lastOuraSync: ouraStatus.lastSyncTime,
        });
        
        // Try to sync, but don't let it crash the app
        try {
          await syncOuraData();
        } catch (syncError) {
          console.error('Oura sync failed, but app continues:', syncError);
        }
      }
    } catch (error) {
      console.error('Oura initialization failed, but app continues:', error);
    }
  };

  // ✅ CRITICAL FIX: Fully defensive sync
  const syncOuraData = async () => {
    if (!OuraRingService) {
      return;
    }
    
    try {
      const result = await OuraRingService.autoSync();
      
      // Handle boolean return value
      if (result === false || result === null || result === undefined) {
        console.log('⏭️ Oura Ring: Sync not needed or not connected');
        return;
      }
      
      // Handle object return value
      if (typeof result === 'object' && result.success === true) {
        try {
          const metrics = OuraRingService.getLatestMetrics();
          
          if (metrics) {
            updateState({
              ouraHeartRate: metrics.heartRate,
              ouraHRV: metrics.hrv,
              ouraSteps: metrics.steps,
              ouraSleepEfficiency: metrics.sleepEfficiency,
              ouraReadinessScore: metrics.readinessScore,
              lastOuraSync: metrics.syncTime,
              ouraConnected: true,
            });
            
            console.log('✅ Oura data synced:', metrics);
          }
        } catch (metricsError) {
          console.error('Failed to get Oura metrics, but app continues:', metricsError);
        }
      }
    } catch (error) {
      console.error('Oura sync error, but app continues:', error);
    }
  };

  // ✅ CRITICAL FIX: Only set up periodic sync if Oura is available
  useEffect(() => {
    if (!OuraRingService) {
      return;
    }
    
    const ouraInterval = setInterval(() => {
      syncOuraData().catch(error => {
        console.error('Periodic Oura sync failed:', error);
      });
    }, 60 * 60 * 1000); // 1 hour

    // Initial sync
    syncOuraData().catch(error => {
      console.error('Initial Oura sync failed:', error);
    });

    return () => clearInterval(ouraInterval);
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedAge = await AsyncStorage.getItem('chronologicalAge');
      const savedName = await AsyncStorage.getItem('userName');
      
      if (savedAge) {
        const age = parseInt(savedAge);
        if (age >= 18 && age <= 120) {
          updateState({ chronologicalAge: age });
          console.log('✅ Loaded user age from profile:', age);
        }
      }
      
      if (savedName) {
        updateState({ userName: savedName });
        console.log('✅ Loaded user name from profile:', savedName);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Save critical data when it changes
  useEffect(() => {
    saveData().catch(error => {
      console.error('Error saving data:', error);
    });
  }, [state.biologicalAge, state.oralHealthScore, state.systemicHealthScore, state.fitnessScore]);

  // Auto-push Bio-Age to watch when it changes and watch is connected
  useEffect(() => {
    const pushBioAgeToWatch = async () => {
      if (state.watchConnected && state.biologicalAge) {
        try {
          await WearableService.sendBioAge(state.biologicalAge);
          
          const now = new Date().toISOString();
          await AsyncStorage.setItem('lastBioAgeSync', now);
          updateState({ lastSync: now });
          
          console.log('✅ Bio-Age automatically pushed to watch:', state.biologicalAge);
        } catch (error) {
          console.error('❌ Auto-push Bio-Age failed:', error);
        }
      }
    };
    
    pushBioAgeToWatch();
  }, [state.biologicalAge, state.watchConnected]);

  // Subscribe to PineTime wearable data updates
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const connectionStatus = WearableService.getConnectionStatus();
        
        if (connectionStatus.isConnected) {
          try {
            const wearableData = WearableService.getLatestData();
            
            updateState({
              heartRate: wearableData.heartRate || null,
              steps: wearableData.steps !== undefined ? wearableData.steps : 0,
              hrv: wearableData.hrv || null,
              watchConnected: true,
            });
            
            console.log('📊 PineTime data updated:', {
              hr: wearableData.heartRate,
              steps: wearableData.steps,
              hrv: wearableData.hrv
            });
          } catch (error) {
            console.error('Error fetching wearable data:', error);
          }
        } else {
          updateState({
            watchConnected: false,
            heartRate: null,
            steps: 0,
            hrv: null,
          });
        }
      } catch (error) {
        console.error('Error checking wearable connection:', error);
      }
    }, 10000); // Poll every 10 seconds

    const connectionInterval = setInterval(async () => {
      try {
        const watchStatus = await AsyncStorage.getItem('watchConnected');
        const connectionStatus = WearableService.getConnectionStatus();
        const isConnected = watchStatus === 'true' && connectionStatus.isConnected;
        
        updateState({ watchConnected: isConnected });
      } catch (error) {
        console.error('Error checking watch connection:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
      clearInterval(connectionInterval);
    };
  }, []);

  const loadSavedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('praxiomHealthData');
      const watchStatus = await AsyncStorage.getItem('watchConnected');
      const lastBioAgeSync = await AsyncStorage.getItem('lastBioAgeSync');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setState(prevState => ({
          ...prevState,
          ...parsedData,
          watchConnected: watchStatus === 'true',
          lastSync: lastBioAgeSync
        }));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const saveData = async () => {
    try {
      const dataToSave = {
        chronologicalAge: state.chronologicalAge,
        biologicalAge: state.biologicalAge,
        oralHealthScore: state.oralHealthScore,
        systemicHealthScore: state.systemicHealthScore,
        vitalityIndex: state.vitalityIndex,
        fitnessScore: state.fitnessScore,
        aerobicScore: state.aerobicScore,
        flexibilityScore: state.flexibilityScore,
        balanceScore: state.balanceScore,
        mindBodyScore: state.mindBodyScore,
        fitnessAssessmentDate: state.fitnessAssessmentDate,
        salivaryPH: state.salivaryPH,
        mmp8: state.mmp8,
        flowRate: state.flowRate,
        hsCRP: state.hsCRP,
        omega3Index: state.omega3Index,
        hba1c: state.hba1c,
        gdf15: state.gdf15,
        vitaminD: state.vitaminD,
        ouraHeartRate: state.ouraHeartRate,
        ouraHRV: state.ouraHRV,
        ouraSteps: state.ouraSteps,
        ouraSleepEfficiency: state.ouraSleepEfficiency,
        ouraReadinessScore: state.ouraReadinessScore,
        lastOuraSync: state.lastOuraSync,
      };
      await AsyncStorage.setItem('praxiomHealthData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const updateState = (updates) => {
    setState(prevState => ({
      ...prevState,
      ...updates
    }));
  };

  const calculateBiologicalAge = async () => {
    try {
      // Validate chronological age first
      if (!state.chronologicalAge || state.chronologicalAge < 18 || state.chronologicalAge > 120) {
        console.warn('Invalid chronological age, using current value');
        return state.biologicalAge || state.chronologicalAge;
      }

      // Prepare biomarkers object
      const biomarkers = {
        salivaryPH: state.salivaryPH ? parseFloat(state.salivaryPH) : null,
        activeMMP8: state.mmp8 ? parseFloat(state.mmp8) : null,
        salivaryFlow: state.flowRate ? parseFloat(state.flowRate) : null,
        hsCRP: state.hsCRP ? parseFloat(state.hsCRP) : null,
        omega3Index: state.omega3Index ? parseFloat(state.omega3Index) : null,
        hba1c: state.hba1c ? parseFloat(state.hba1c) : null,
        gdf15: state.gdf15 ? parseFloat(state.gdf15) : null,
        vitaminD: state.vitaminD ? parseFloat(state.vitaminD) : null,
      };

      // Prepare fitness data if available
      const fitnessData = (state.aerobicScore || state.flexibilityScore || state.balanceScore || state.mindBodyScore) ? {
        aerobicFitness: state.aerobicScore ? parseFloat(state.aerobicScore) : null,
        flexibilityPosture: state.flexibilityScore ? parseFloat(state.flexibilityScore) : null,
        coordinationBalance: state.balanceScore ? parseFloat(state.balanceScore) : null,
        mentalPreparedness: state.mindBodyScore ? parseFloat(state.mindBodyScore) : null,
      } : null;

      // Get HRV value from either PineTime or Oura
      const hrvValue = state.hrv ? parseFloat(state.hrv) : (state.ouraHRV ? parseFloat(state.ouraHRV) : null);

      // Call the validated PraxiomAlgorithm
      const result = PraxiomAlgorithm.calculateBiologicalAge({
        chronologicalAge: parseInt(state.chronologicalAge),
        biomarkers,
        fitnessData,
        hrvValue
      });

      console.log('✅ PRAXIOM ALGORITHM RESULTS:', {
        biologicalAge: result.biologicalAge,
        deviation: result.deviation,
        scores: result.scores,
        tier: result.tier
      });

      // Update state with comprehensive results
      updateState({
        biologicalAge: result.biologicalAge,
        oralHealthScore: result.scores.oralHealth,
        systemicHealthScore: result.scores.systemicHealth,
        fitnessScore: result.scores.fitnessScore || state.fitnessScore,
        vitalityIndex: result.scores.vitalityIndex,
        currentTier: result.tier,
        recommendations: result.recommendations,
        coefficients: result.coefficients
      });

      // ✅ NEW: Sync to watch if connected and auto-sync enabled
      if (state.watchConnected && state.settings?.autoSyncEnabled !== false) {
        try {
          await WearableService.sendBioAge(result.biologicalAge);
          console.log('✅ Bio-age synced to watch:', result.biologicalAge);
          updateState({ lastSync: new Date().toISOString() });
        } catch (error) {
          console.warn('⚠️ Watch sync failed (will retry next time):', error.message);
          // Don't throw - sync failure shouldn't break calculation
        }
      }

      return result.biologicalAge;
    } catch (error) {
      console.error('❌ Error calculating biological age with Praxiom Algorithm:', error);
      // Fallback to chronological age if algorithm fails
      return state.chronologicalAge;
    }
  };

  const calculateWearableScore = () => {
    try {
      let score = 50;
      let count = 0;

      const heartRate = state.ouraHeartRate || state.heartRate;
      const hrv = state.ouraHRV || state.hrv;
      const steps = state.ouraSteps || state.steps;

      if (hrv !== null && hrv > 0) {
        if (hrv >= 70) score += 100;
        else if (hrv >= 50) score += 75;
        else if (hrv >= 30) score += 50;
        else score += 25;
        count++;
      }

      if (steps > 0) {
        if (steps >= 8000) score += 100;
        else if (steps >= 5000) score += 75;
        else if (steps >= 3000) score += 50;
        else score += 25;
        count++;
      }

      if (heartRate !== null && heartRate > 0) {
        if (heartRate >= 50 && heartRate <= 70) score += 100;
        else if (heartRate >= 45 && heartRate <= 75) score += 75;
        else if (heartRate >= 40 && heartRate <= 80) score += 50;
        else score += 25;
        count++;
      }

      if (state.ouraReadinessScore !== null) {
        score += state.ouraReadinessScore;
        count++;
      }

      if (count > 0) {
        score = (score - 50) / count;
      } else {
        score = 50;
      }

      updateState({ fitnessScore: Math.round(score) });
      return Math.round(score);
    } catch (error) {
      console.error('Error calculating wearable score:', error);
      return 50;
    }
  };

  const calculateScores = () => {
    try {
      // Prepare biomarkers object for algorithm
      const biomarkers = {
        salivaryPH: state.salivaryPH ? parseFloat(state.salivaryPH) : null,
        activeMMP8: state.mmp8 ? parseFloat(state.mmp8) : null,
        salivaryFlow: state.flowRate ? parseFloat(state.flowRate) : null,
        hsCRP: state.hsCRP ? parseFloat(state.hsCRP) : null,
        omega3Index: state.omega3Index ? parseFloat(state.omega3Index) : null,
        hba1c: state.hba1c ? parseFloat(state.hba1c) : null,
        gdf15: state.gdf15 ? parseFloat(state.gdf15) : null,
        vitaminD: state.vitaminD ? parseFloat(state.vitaminD) : null,
      };

      // Calculate Oral Health Score using algorithm
      const oralHealthScore = PraxiomAlgorithm.calculateOralHealthScore(biomarkers);
      
      // Calculate Systemic Health Score using algorithm
      const systemicHealthScore = PraxiomAlgorithm.calculateSystemicHealthScore(biomarkers);

      // Calculate Fitness Score if data available
      let fitnessScore = null;
      if (state.aerobicScore || state.flexibilityScore || state.balanceScore || state.mindBodyScore) {
        const fitnessData = {
          aerobicFitness: state.aerobicScore ? parseFloat(state.aerobicScore) : null,
          flexibilityPosture: state.flexibilityScore ? parseFloat(state.flexibilityScore) : null,
          coordinationBalance: state.balanceScore ? parseFloat(state.balanceScore) : null,
          mentalPreparedness: state.mindBodyScore ? parseFloat(state.mindBodyScore) : null,
        };
        fitnessScore = PraxiomAlgorithm.calculateFitnessScore(fitnessData);
      }

      // Calculate HRV Score if available
      let hrvScore = null;
      const hrvValue = state.hrv ? parseFloat(state.hrv) : (state.ouraHRV ? parseFloat(state.ouraHRV) : null);
      if (hrvValue && state.chronologicalAge) {
        hrvScore = PraxiomAlgorithm.calculateHRVScore(hrvValue, parseInt(state.chronologicalAge));
      }

      // Calculate Vitality Index (average of all available scores)
      const scores = [oralHealthScore, systemicHealthScore];
      if (fitnessScore !== null) scores.push(fitnessScore);
      if (hrvScore !== null) scores.push(hrvScore);
      const vitalityIndex = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      console.log('✅ SCORES CALCULATED WITH ALGORITHM:', {
        oralHealth: oralHealthScore,
        systemicHealth: systemicHealthScore,
        fitness: fitnessScore,
        hrv: hrvScore,
        vitality: vitalityIndex
      });

      // Update state with calculated scores
      updateState({
        oralHealthScore: Math.round(oralHealthScore * 10) / 10,
        systemicHealthScore: Math.round(systemicHealthScore * 10) / 10,
        fitnessScore: fitnessScore !== null ? Math.round(fitnessScore * 10) / 10 : state.fitnessScore,
        vitalityIndex: Math.round(vitalityIndex * 10) / 10
      });

      return {
        oralHealthScore,
        systemicHealthScore,
        fitnessScore,
        hrvScore,
        vitalityIndex
      };
    } catch (error) {
      console.error('❌ Error calculating scores with Praxiom Algorithm:', error);
      return {
        oralHealthScore: 50,
        systemicHealthScore: 50,
        fitnessScore: null,
        hrvScore: null,
        vitalityIndex: 50
      };
    }
  };

  const updateFitnessAssessment = (fitnessData) => {
    try {
      updateState({
        aerobicScore: fitnessData.aerobicScore,
        flexibilityScore: fitnessData.flexibilityScore,
        balanceScore: fitnessData.balanceScore,
        mindBodyScore: fitnessData.mindBodyScore,
        fitnessScore: fitnessData.fitnessScore,
        fitnessAssessmentDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating fitness assessment:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      state,
      updateState,
      calculateBiologicalAge,
      calculateScores,
      calculateWearableScore,
      updateFitnessAssessment,
      syncOuraData,
      saveData,
      loadSavedData
    }}>
      {children}
    </AppContext.Provider>
  );
};
