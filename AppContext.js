import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableService from './services/WearableService';
import PraxiomAlgorithm from './services/PraxiomAlgorithm';
import StorageService from './services/StorageService';

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
    ouraData: null, // ✅ NEW: Store full Oura data object
  });

  // ✅ UPDATED: Wrap all initialization in error handlers + data migration
  useEffect(() => {
    const initializeApp = async () => {
      // ✅ NEW: Run data migration FIRST (before loading any data)
      try {
        console.log('🔄 Checking for legacy data migration...');
        const migrationResult = await StorageService.migrateLegacyData();
        
        if (migrationResult.success) {
          if (migrationResult.migrated > 0) {
            console.log(`✅ Successfully migrated ${migrationResult.migrated} legacy entries to encrypted storage`);
            console.log(`   - Tier 1: ${migrationResult.tier1 || 0} entries`);
            console.log(`   - Tier 2: ${migrationResult.tier2 || 0} entries`);
            console.log(`   - Fitness: ${migrationResult.fitness || 0} entries`);
          } else if (migrationResult.alreadyCompleted) {
            console.log('✅ Data migration already completed previously');
          } else {
            console.log('✅ No legacy data found to migrate');
          }
        } else {
          console.error('⚠️ Migration failed (non-fatal):', migrationResult.error);
        }

        // Also clean up old backup data if retention period expired
        await StorageService.cleanupLegacyData();
      } catch (error) {
        console.error('⚠️ Migration error (non-fatal):', error);
        // Don't let migration errors stop app initialization
      }

      // Load data after migration
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

  // ✅ UPDATED: Initialize with new credential-based system
  const initializeWearables = async () => {
    // Skip if Oura service didn't load
    if (!OuraRingService) {
      console.log('⚠️ Oura Ring features disabled (module not loaded)');
      return;
    }
    
    try {
      // New OuraRingService uses init() which loads credentials from storage
      const initialized = await OuraRingService.init();
      
      if (initialized && OuraRingService.isAuthenticated()) {
        updateState({
          ouraConnected: true,
        });
        
        console.log('✅ Oura Ring initialized and authenticated');
        
        // Try to sync, but don't let it crash the app
        try {
          await syncOuraData();
        } catch (syncError) {
          console.error('Oura sync failed, but app continues:', syncError);
        }
      } else {
        console.log('⏭️ Oura Ring credentials not configured yet');
      }
    } catch (error) {
      console.error('Oura initialization failed, but app continues:', error);
    }
  };

  // ✅ UPDATED: Sync with new OuraRingService API
  const syncOuraData = async () => {
    if (!OuraRingService) {
      return;
    }
    
    try {
      // Check if authenticated first
      if (!OuraRingService.isAuthenticated()) {
        console.log('⏭️ Oura Ring: Not authenticated');
        updateState({ ouraConnected: false });
        return;
      }

      // New API: getLatestHealthData() returns formatted data
      const result = await OuraRingService.autoSync();
      
      if (result && result.success && result.data) {
        // Extract health data from the summary
        const summary = result.data;
        
        updateState({
          ouraHeartRate: summary.hrv?.hrv || null,
          ouraHRV: summary.hrv?.hrv || null,
          ouraSteps: summary.activity?.steps || null,
          ouraSleepEfficiency: summary.sleep?.efficiency || null,
          ouraReadinessScore: summary.readiness?.score || null,
          lastOuraSync: new Date().toISOString(),
          ouraConnected: true,
          ouraData: summary, // Store full data
        });
        
        console.log('✅ Oura data synced:', {
          hrv: summary.hrv?.hrv,
          steps: summary.activity?.steps,
          sleep: summary.sleep?.efficiency,
          readiness: summary.readiness?.score
        });
      } else {
        console.log('⏭️ Oura sync returned no data');
      }
    } catch (error) {
      console.error('Oura sync error, but app continues:', error);
      // Don't set ouraConnected to false on error - credentials might still be valid
    }
  };

  // ✅ Only set up periodic sync if Oura is available and authenticated
  useEffect(() => {
    if (!OuraRingService) {
      return;
    }
    
    const ouraInterval = setInterval(() => {
      // Only sync if authenticated
      if (OuraRingService.isAuthenticated()) {
        syncOuraData().catch(error => {
          console.error('Periodic Oura sync failed:', error);
        });
      }
    }, 60 * 60 * 1000); // 1 hour

    // Initial sync if authenticated
    if (OuraRingService.isAuthenticated()) {
      syncOuraData().catch(error => {
        console.error('Initial Oura sync failed:', error);
      });
    }

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

  // Periodic Bio-Age sync to watch (every 2 minutes when auto-sync enabled)
  useEffect(() => {
    if (!state.settings?.autoSyncEnabled && state.settings?.autoSyncEnabled !== undefined) {
      console.log('⏸️ Auto-sync disabled - periodic sync stopped');
      return;
    }
    
    if (!state.watchConnected || !state.biologicalAge) {
      return;
    }

    console.log('🔄 Starting periodic watch sync (every 2 minutes)...');

    const syncInterval = setInterval(async () => {
      if (state.watchConnected && state.biologicalAge) {
        try {
          await WearableService.sendBioAge(state.biologicalAge);
          
          const now = new Date().toISOString();
          await AsyncStorage.setItem('lastBioAgeSync', now);
          updateState({ lastSync: now });
          
          console.log('✅ [PERIODIC] Bio-age synced to watch:', state.biologicalAge, 'at', new Date().toLocaleTimeString());
        } catch (error) {
          console.warn('⚠️ [PERIODIC] Watch sync failed:', error.message);
        }
      }
    }, 120000); // 120000ms = 2 minutes

    // Cleanup interval on unmount or dependency change
    return () => {
      console.log('🛑 Stopping periodic watch sync');
      clearInterval(syncInterval);
    };
  }, [state.watchConnected, state.biologicalAge, state.settings?.autoSyncEnabled]);

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
      console.log('🔵 [CALC] Starting calculation...');
      console.log('🔵 [CALC] Chronological age:', state.chronologicalAge);
      
      // Validate chronological age first
      if (!state.chronologicalAge || state.chronologicalAge < 18 || state.chronologicalAge > 120) {
        const errorMsg = `Invalid chronological age: ${state.chronologicalAge}`;
        console.error('❌ [CALC]', errorMsg);
        throw new Error(errorMsg);
      }

      // Verify PraxiomAlgorithm is available
      if (!PraxiomAlgorithm) {
        throw new Error('PraxiomAlgorithm module not loaded');
      }
      if (typeof PraxiomAlgorithm.calculateBiologicalAge !== 'function') {
        throw new Error('PraxiomAlgorithm.calculateBiologicalAge is not a function');
      }
      console.log('✅ [CALC] PraxiomAlgorithm loaded correctly');

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
      console.log('✅ [CALC] Biomarkers prepared:', biomarkers);

      // Prepare fitness data if available
      const fitnessData = (state.aerobicScore || state.flexibilityScore || state.balanceScore || state.mindBodyScore) ? {
        aerobicFitness: state.aerobicScore ? parseFloat(state.aerobicScore) : null,
        flexibilityPosture: state.flexibilityScore ? parseFloat(state.flexibilityScore) : null,
        coordinationBalance: state.balanceScore ? parseFloat(state.balanceScore) : null,
        mentalPreparedness: state.mindBodyScore ? parseFloat(state.mindBodyScore) : null,
      } : null;

      // Get HRV value from either PineTime or Oura
      const hrvValue = state.hrv ? parseFloat(state.hrv) : (state.ouraHRV ? parseFloat(state.ouraHRV) : null);
      
      console.log('🔵 [CALC] Calling PraxiomAlgorithm.calculateBiologicalAge...');

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
      console.error('❌ [CALC] CALCULATION ERROR:', error);
      console.error('❌ [CALC] Error name:', error.name);
      console.error('❌ [CALC] Error message:', error.message);
      console.error('❌ [CALC] Error stack:', error.stack);
      
      // Create user-friendly error message
      const userMessage = `Calculation failed: ${error.message}\n\nPlease check:\n• Date of birth is set in Settings\n• All biomarker values are valid numbers\n• App is updated to latest version`;
      
      throw new Error(userMessage);
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

  // ✅ NEW: Function for watch to call to disconnect
  const disconnectWatch = async () => {
    try {
      updateState({
        watchConnected: false,
        heartRate: null,
        steps: 0,
        hrv: null,
      });
      await AsyncStorage.setItem('watchConnected', 'false');
      console.log('✅ Watch disconnected');
    } catch (error) {
      console.error('Error disconnecting watch:', error);
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
      loadSavedData,
      disconnectWatch, // ✅ NEW: Export disconnectWatch
    }}>
      {children}
    </AppContext.Provider>
  );
};
