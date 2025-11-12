import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WearableService from './services/WearableService';

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
  }, []);

  // Save critical data when it changes
  useEffect(() => {
    saveData();
  }, [state.biologicalAge, state.oralHealthScore, state.systemicHealthScore]);

  // Subscribe to wearable data updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (WearableService.isConnected()) {
        try {
          // Get latest wearable data
          const heartRate = await WearableService.getHeartRate();
          const steps = await WearableService.getStepCount();
          
          // Update state with new data
          updateState({
            heartRate: heartRate || null,
            steps: steps || 0,
            watchConnected: true,
          });
        } catch (error) {
          console.error('Error fetching wearable data:', error);
        }
      }
    }, 10000); // Poll every 10 seconds

    // Also check connection status
    const connectionInterval = setInterval(async () => {
      try {
        const watchStatus = await AsyncStorage.getItem('watchConnected');
        const isConnected = watchStatus === 'true' && WearableService.isConnected();
        
        updateState({ watchConnected: isConnected });
      } catch (error) {
        console.error('Error checking watch connection:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
      clearInterval(connectionInterval);
    };
  }, []); // Empty deps - only run once on mount

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
        salivaryPH: state.salivaryPH,
        mmp8: state.mmp8,
        flowRate: state.flowRate,
        hsCRP: state.hsCRP,
        omega3Index: state.omega3Index,
        hba1c: state.hba1c,
        gdf15: state.gdf15,
        vitaminD: state.vitaminD
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
    // Implementation of the Praxiom Bio-Age algorithm
    let bioAge = state.chronologicalAge;
    
    // Oral Health Component (0-100 score affects -5 to +10 years)
    const oralHealthImpact = ((100 - state.oralHealthScore) / 100) * 15 - 5;
    
    // Systemic Health Component (0-100 score affects -5 to +10 years)
    const systemicHealthImpact = ((100 - state.systemicHealthScore) / 100) * 15 - 5;
    
    // Fitness Component (optional, -2 to +3 years)
    const fitnessImpact = state.fitnessScore ? ((100 - state.fitnessScore) / 100) * 5 - 2 : 0;
    
    // Calculate final biological age
    bioAge = state.chronologicalAge + oralHealthImpact + systemicHealthImpact + fitnessImpact;
    
    // Round to 1 decimal place
    bioAge = Math.round(bioAge * 10) / 10;
    
    // Update state with new biological age
    updateState({ biologicalAge: bioAge });
    
    return bioAge;
  };

  const calculateWearableScore = () => {
    let score = 50; // Default
    let count = 0;

    // HRV scoring (optimal ≥70 ms)
    if (state.hrv !== null && state.hrv > 0) {
      const hrv = parseFloat(state.hrv);
      if (hrv >= 70) {
        score += 100;
      } else if (hrv >= 50) {
        score += 75;
      } else if (hrv >= 30) {
        score += 50;
      } else {
        score += 25;
      }
      count++;
    }

    // Steps scoring (optimal ≥8000)
    if (state.steps > 0) {
      const steps = parseInt(state.steps);
      if (steps >= 8000) {
        score += 100;
      } else if (steps >= 5000) {
        score += 75;
      } else if (steps >= 3000) {
        score += 50;
      } else {
        score += 25;
      }
      count++;
    }

    // Heart rate scoring (optimal: 50-70 bpm at rest)
    if (state.heartRate !== null && state.heartRate > 0) {
      const hr = parseInt(state.heartRate);
      if (hr >= 50 && hr <= 70) {
        score += 100;
      } else if (hr >= 45 && hr <= 75) {
        score += 75;
      } else if (hr >= 40 && hr <= 80) {
        score += 50;
      } else {
        score += 25;
      }
      count++;
    }

    if (count > 0) {
      score = (score - 50) / count;
    } else {
      score = 50; // Default if no data
    }

    updateState({ fitnessScore: Math.round(score) });
    return Math.round(score);
  };

  const calculateScores = () => {
    // Calculate Oral Health Score
    let oralScore = 100;
    let oralCount = 0;
    
    if (state.salivaryPH !== null) {
      // pH scoring: optimal 6.5-7.2
      const ph = parseFloat(state.salivaryPH);
      if (ph >= 6.5 && ph <= 7.2) {
        oralScore += 100;
      } else if (ph >= 6.0 && ph < 6.5) {
        oralScore += 70;
      } else if (ph > 7.2 && ph <= 7.5) {
        oralScore += 70;
      } else {
        oralScore += 40;
      }
      oralCount++;
    }
    
    if (state.mmp8 !== null) {
      // MMP-8 scoring: optimal <60 ng/mL
      const mmp8 = parseFloat(state.mmp8);
      if (mmp8 < 60) {
        oralScore += 100;
      } else if (mmp8 < 100) {
        oralScore += 70;
      } else {
        oralScore += 40;
      }
      oralCount++;
    }
    
    if (state.flowRate !== null) {
      // Flow rate scoring: optimal >1.5 mL/min
      const flow = parseFloat(state.flowRate);
      if (flow > 1.5) {
        oralScore += 100;
      } else if (flow > 1.0) {
        oralScore += 70;
      } else {
        oralScore += 40;
      }
      oralCount++;
    }
    
    if (oralCount > 0) {
      oralScore = (oralScore - 100) / oralCount;
    } else {
      oralScore = 50; // Default if no data
    }
    
    // Calculate Systemic Health Score
    let systemicScore = 100;
    let systemicCount = 0;
    
    if (state.hsCRP !== null) {
      // hs-CRP scoring: optimal <1.0 mg/L
      const hscrp = parseFloat(state.hsCRP);
      if (hscrp < 1.0) {
        systemicScore += 100;
      } else if (hscrp < 3.0) {
        systemicScore += 70;
      } else {
        systemicScore += 40;
      }
      systemicCount++;
    }
    
    if (state.omega3Index !== null) {
      // Omega-3 Index scoring: optimal >8%
      const omega3 = parseFloat(state.omega3Index);
      if (omega3 > 8) {
        systemicScore += 100;
      } else if (omega3 > 6) {
        systemicScore += 70;
      } else {
        systemicScore += 40;
      }
      systemicCount++;
    }
    
    if (state.hba1c !== null) {
      // HbA1c scoring: optimal <5.7%
      const hba1c = parseFloat(state.hba1c);
      if (hba1c < 5.7) {
        systemicScore += 100;
      } else if (hba1c < 6.5) {
        systemicScore += 70;
      } else {
        systemicScore += 40;
      }
      systemicCount++;
    }
    
    if (state.gdf15 !== null) {
      // GDF-15 scoring: optimal <1200 pg/mL
      const gdf15 = parseFloat(state.gdf15);
      if (gdf15 < 1200) {
        systemicScore += 100;
      } else if (gdf15 < 2000) {
        systemicScore += 70;
      } else {
        systemicScore += 40;
      }
      systemicCount++;
    }
    
    if (state.vitaminD !== null) {
      // Vitamin D scoring: optimal 30-100 ng/mL
      const vitD = parseFloat(state.vitaminD);
      if (vitD >= 30 && vitD <= 100) {
        systemicScore += 100;
      } else if (vitD >= 20 && vitD < 30) {
        systemicScore += 70;
      } else {
        systemicScore += 40;
      }
      systemicCount++;
    }
    
    if (systemicCount > 0) {
      systemicScore = (systemicScore - 100) / systemicCount;
    } else {
      systemicScore = 45; // Default if no data
    }
    
    // Calculate wearable score
    calculateWearableScore();
    
    // Calculate Vitality Index (average of both scores)
    const vitalityIndex = (oralScore + systemicScore) / 2;
    
    // Update all scores
    updateState({
      oralHealthScore: Math.round(oralScore),
      systemicHealthScore: Math.round(systemicScore),
      vitalityIndex: Math.round(vitalityIndex)
    });
    
    // Recalculate biological age with new scores
    calculateBiologicalAge();
  };

  return (
    <AppContext.Provider value={{
      state,
      updateState,
      calculateBiologicalAge,
      calculateScores,
      calculateWearableScore,
      saveData,
      loadSavedData
    }}>
      {children}
    </AppContext.Provider>
  );
};
