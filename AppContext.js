import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableService from './services/WearableService';

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

  const calculateBiologicalAge = () => {
    try {
      let bioAge = state.chronologicalAge;
      
      const oralHealthImpact = ((100 - state.oralHealthScore) / 100) * 15 - 5;
      const systemicHealthImpact = ((100 - state.systemicHealthScore) / 100) * 15 - 5;
      const fitnessImpact = state.fitnessScore ? ((100 - state.fitnessScore) / 100) * 5 - 2 : 0;
      
      bioAge = state.chronologicalAge + oralHealthImpact + systemicHealthImpact + fitnessImpact;
      bioAge = Math.round(bioAge * 10) / 10;
      
      updateState({ biologicalAge: bioAge });
      return bioAge;
    } catch (error) {
      console.error('Error calculating biological age:', error);
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
      // Calculate Oral Health Score
      let oralScore = 100;
      let oralCount = 0;
      
      if (state.salivaryPH !== null) {
        const ph = parseFloat(state.salivaryPH);
        if (ph >= 6.5 && ph <= 7.2) oralScore += 100;
        else if (ph >= 6.0 && ph < 6.5) oralScore += 70;
        else if (ph > 7.2 && ph <= 7.5) oralScore += 70;
        else oralScore += 40;
        oralCount++;
      }
      
      if (state.mmp8 !== null) {
        const mmp8 = parseFloat(state.mmp8);
        if (mmp8 < 60) oralScore += 100;
        else if (mmp8 < 100) oralScore += 70;
        else oralScore += 40;
        oralCount++;
      }
      
      if (state.flowRate !== null) {
        const flow = parseFloat(state.flowRate);
        if (flow > 1.5) oralScore += 100;
        else if (flow > 1.0) oralScore += 70;
        else oralScore += 40;
        oralCount++;
      }
      
      if (oralCount > 0) {
        oralScore = (oralScore - 100) / oralCount;
      } else {
        oralScore = 50;
      }
      
      // Calculate Systemic Health Score
      let systemicScore = 100;
      let systemicCount = 0;
      
      if (state.hsCRP !== null) {
        const hscrp = parseFloat(state.hsCRP);
        if (hscrp < 1.0) systemicScore += 100;
        else if (hscrp < 3.0) systemicScore += 70;
        else systemicScore += 40;
        systemicCount++;
      }
      
      if (state.omega3Index !== null) {
        const omega3 = parseFloat(state.omega3Index);
        if (omega3 > 8) systemicScore += 100;
        else if (omega3 > 6) systemicScore += 70;
        else systemicScore += 40;
        systemicCount++;
      }
      
      if (state.hba1c !== null) {
        const hba1c = parseFloat(state.hba1c);
        if (hba1c < 5.7) systemicScore += 100;
        else if (hba1c < 6.5) systemicScore += 70;
        else systemicScore += 40;
        systemicCount++;
      }
      
      if (state.gdf15 !== null) {
        const gdf15 = parseFloat(state.gdf15);
        if (gdf15 < 1200) systemicScore += 100;
        else if (gdf15 < 2000) systemicScore += 70;
        else systemicScore += 40;
        systemicCount++;
      }
      
      if (state.vitaminD !== null) {
        const vitD = parseFloat(state.vitaminD);
        if (vitD >= 30 && vitD <= 100) systemicScore += 100;
        else if (vitD >= 20 && vitD < 30) systemicScore += 70;
        else systemicScore += 40;
        systemicCount++;
      }
      
      if (systemicCount > 0) {
        systemicScore = (systemicScore - 100) / systemicCount;
      } else {
        systemicScore = 45;
      }
      
      // Calculate wearable score
      calculateWearableScore();
      
      // Calculate Vitality Index
      const vitalityIndex = (oralScore + systemicScore) / 2;
      
      // Update all scores
      updateState({
        oralHealthScore: Math.round(oralScore),
        systemicHealthScore: Math.round(systemicScore),
        vitalityIndex: Math.round(vitalityIndex)
      });
      
      return calculateBiologicalAge();
    } catch (error) {
      console.error('Error calculating scores:', error);
      return state.chronologicalAge;
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
