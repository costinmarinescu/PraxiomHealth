import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableService from './services/WearableService';
import PraxiomAlgorithm from './services/PraxiomAlgorithm';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [state, setState] = useState({
    chronologicalAge: 53,
    biologicalAge: 70.1,
    oralHealthScore: 50,
    systemicHealthScore: 45,
    vitalityIndex: 47.5,
    fitnessScore: 65,
    watchConnected: false,
    lastSync: null,

    // Tier 1 Biomarkers
    salivaryPH: null,
    mmp8: null,
    flowRate: null,
    hsCRP: null,
    omega3Index: null,
    hba1c: null,
    gdf15: null,
    vitaminD: null,

    // Wearable Data
    heartRate: null,
    steps: 0,
    hrv: null,
  });

  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
    subscribeToWearableData();
  }, []);

  // Subscribe to WearableService data updates (instead of polling)
  const subscribeToWearableData = () => {
    console.log('📡 Subscribing to WearableService data updates...');

    // Listen for data updates from watch
    const unsubscribeData = WearableService.onDataUpdate((data) => {
      console.log('📊 Received wearable data update:', data);

      setState((prevState) => ({
        ...prevState,
        heartRate: data.heartRate !== undefined ? data.heartRate : prevState.heartRate,
        steps: data.steps !== undefined ? data.steps : prevState.steps,
        hrv: data.hrv !== undefined ? data.hrv : prevState.hrv,
      }));

      // Log what was actually updated
      if (data.heartRate !== undefined) console.log('✅ Heart rate updated:', data.heartRate);
      if (data.steps !== undefined) console.log('✅ Steps updated:', data.steps);
      if (data.hrv !== undefined) console.log('✅ HRV updated:', data.hrv);
    });

    // Listen for connection status changes
    const unsubscribeConnection = WearableService.onConnectionChange((isConnected) => {
      console.log('🔗 Watch connection status changed:', isConnected);

      setState((prevState) => ({
        ...prevState,
        watchConnected: isConnected,
      }));
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WearableService listeners');
      unsubscribeData();
      unsubscribeConnection();
    };
  };

  // Save critical data when it changes
  useEffect(() => {
    saveData();
  }, [state.biologicalAge, state.oralHealthScore, state.systemicHealthScore]);

  const loadSavedData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('praxiomHealthData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setState((prevState) => ({
          ...prevState,
          ...parsedData,
        }));
        console.log('✅ Loaded saved data from storage');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      const dataToSave = {
        biologicalAge: state.biologicalAge,
        oralHealthScore: state.oralHealthScore,
        systemicHealthScore: state.systemicHealthScore,
        salivaryPH: state.salivaryPH,
        mmp8: state.mmp8,
        flowRate: state.flowRate,
        hsCRP: state.hsCRP,
        omega3Index: state.omega3Index,
        hba1c: state.hba1c,
        gdf15: state.gdf15,
        vitaminD: state.vitaminD,
      };
      await AsyncStorage.setItem('praxiomHealthData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  };

  const updateState = (newState) => {
    setState((prevState) => ({
      ...prevState,
      ...newState,
    }));
  };

  const calculateScores = () => {
    try {
      console.log('🧮 Starting score calculation...');

      // Calculate Oral Health Score
      let oralScore = 75;
      if (state.salivaryPH !== null) {
        const phDiff = Math.abs(state.salivaryPH - 6.8);
        oralScore -= phDiff * 5;
      }
      if (state.mmp8 !== null) {
        oralScore -= Math.min(40, state.mmp8 * 0.5);
      }
      if (state.flowRate !== null && state.flowRate > 1.5) {
        oralScore += 10;
      }
      oralScore = Math.max(0, Math.min(100, oralScore));

      // Calculate Systemic Health Score
      let systemicScore = 75;
      if (state.hsCRP !== null) {
        systemicScore -= Math.min(30, state.hsCRP * 10);
      }
      if (state.omega3Index !== null && state.omega3Index >= 8) {
        systemicScore += 15;
      }
      if (state.hba1c !== null) {
        const hba1cDiff = Math.abs(state.hba1c - 5.2);
        systemicScore -= hba1cDiff * 5;
      }
      systemicScore = Math.max(0, Math.min(100, systemicScore));

      // Calculate Fitness Score from steps
      const fitnessFromSteps = Math.min(100, (state.steps / 10000) * 100);
      const heartHealthScore = state.hrv ? Math.min(100, state.hrv) : 50;
      const vitalityIndex = (fitnessFromSteps + heartHealthScore) / 2;

      // ✅ Use actual PraxiomAlgorithm.calculateBioAge() API
      const result = PraxiomAlgorithm.calculateBioAge(
        state.chronologicalAge,
        oralScore,
        systemicScore,
        fitnessFromSteps
      );

      const biologicalAge = result.bioAge;

      console.log('📊 Calculation complete:', {
        oralScore: Math.round(oralScore),
        systemicScore: Math.round(systemicScore),
        fitnessScore: Math.round(fitnessFromSteps),
        vitalityIndex: Math.round(vitalityIndex * 10) / 10,
        biologicalAge: biologicalAge,
      });

      updateState({
        oralHealthScore: Math.round(oralScore),
        systemicHealthScore: Math.round(systemicScore),
        vitalityIndex: Math.round(vitalityIndex * 10) / 10,
        biologicalAge: biologicalAge,
        fitnessScore: Math.round(fitnessFromSteps),
        lastSync: new Date().toISOString(),
      });

      // 🔥 AUTO-SEND BIO-AGE TO WATCH IF CONNECTED
      if (state.watchConnected) {
        console.log('📤 Watch is connected, attempting to send bio-age...');
        WearableService.sendBiologicalAge(biologicalAge)
          .then(() => {
            console.log('✅ Bio-age successfully sent to watch:', biologicalAge);
          })
          .catch((error) => {
            console.error('❌ Failed to send bio-age to watch:', error.message);
            // Don't throw - just log the error
          });
      } else {
        console.log('⚠️ Watch not connected, bio-age not sent');
      }

      return biologicalAge;
    } catch (error) {
      console.error('❌ Error calculating scores:', error);
      return state.biologicalAge;
    }
  };

  const value = {
    state,
    updateState,
    calculateScores,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
