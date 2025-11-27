/**
 * AppContext.js - FIXED VERSION
 * ✅ Added proper error handling for SecureStore
 * ✅ AsyncStorage fallback when SecureStore fails
 * ✅ Fixed dispatch reference error
 * ✅ Added try-catch blocks everywhere
 */

import React, { createContext, useReducer, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { calculateBioAge } from './services/PraxiomAlgorithm';

// Create context
export const AppContext = createContext();

// Initial state
const initialState = {
  isAuthenticated: false,
  userName: '',
  userProfile: null,
  chronologicalAge: 45,
  
  // Bio-age calculation results
  bioAge: null,
  oralHealthScore: null,
  systemicHealthScore: null,
  fitnessScore: null,
  hrvScore: null,
  
  // Biomarker data
  biomarkers: {},
  biomarkerHistory: [],
  
  // Wearable data
  wearableConnected: false,
  wearableData: {},
  
  // App settings
  settings: {
    notifications: true,
    darkMode: false,
    units: 'metric',
  },
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    
    case 'SET_USER_PROFILE':
      return {
        ...state,
        userProfile: action.payload,
        userName: action.payload?.name || '',
        chronologicalAge: action.payload?.age || 45,
      };
    
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    
    case 'SET_BIOMARKERS':
      return { ...state, biomarkers: action.payload };
    
    case 'ADD_BIOMARKER_ENTRY':
      return {
        ...state,
        biomarkerHistory: [action.payload, ...state.biomarkerHistory].slice(0, 100),
      };
    
    case 'SET_BIO_AGE':
      return {
        ...state,
        bioAge: action.payload.bioAge,
        oralHealthScore: action.payload.oralHealthScore,
        systemicHealthScore: action.payload.systemicHealthScore,
        fitnessScore: action.payload.fitnessScore,
        hrvScore: action.payload.hrvScore,
      };
    
    case 'SET_WEARABLE_DATA':
      return {
        ...state,
        wearableConnected: true,
        wearableData: action.payload,
      };
    
    case 'DISCONNECT_WEARABLE':
      return {
        ...state,
        wearableConnected: false,
        wearableData: {},
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// Storage helper with fallback
async function setItemInStorage(key, value) {
  try {
    // First try SecureStore
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(key, value);
        console.log(`✅ Saved ${key} to SecureStore`);
        return true;
      } catch (secureError) {
        console.warn(`⚠️ SecureStore failed for ${key}:`, secureError.message);
        // Fall through to AsyncStorage
      }
    }
    
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(key, value);
    console.log(`✅ Saved ${key} to AsyncStorage (fallback)`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save ${key}:`, error);
    return false;
  }
}

async function getItemFromStorage(key) {
  try {
    // First try SecureStore
    if (Platform.OS !== 'web') {
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) {
          console.log(`✅ Got ${key} from SecureStore`);
          return value;
        }
      } catch (secureError) {
        console.warn(`⚠️ SecureStore read failed for ${key}:`, secureError.message);
        // Fall through to AsyncStorage
      }
    }
    
    // Fallback to AsyncStorage
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      console.log(`✅ Got ${key} from AsyncStorage`);
    }
    return value;
  } catch (error) {
    console.error(`❌ Failed to get ${key}:`, error);
    return null;
  }
}

async function removeItemFromStorage(key) {
  try {
    // Try to remove from both
    const promises = [];
    
    if (Platform.OS !== 'web') {
      promises.push(
        SecureStore.deleteItemAsync(key).catch(e =>
          console.warn(`SecureStore delete failed for ${key}:`, e.message)
        )
      );
    }
    
    promises.push(
      AsyncStorage.removeItem(key).catch(e =>
        console.warn(`AsyncStorage delete failed for ${key}:`, e.message)
      )
    );
    
    await Promise.all(promises);
    console.log(`✅ Removed ${key} from storage`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove ${key}:`, error);
    return false;
  }
}

// Provider component
export function AppContextProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app data on mount
  useEffect(() => {
    initializeAppData();
  }, []);

  // Save critical data when it changes
  useEffect(() => {
    if (isInitialized && state.biomarkers) {
      saveBiomarkers(state.biomarkers);
    }
  }, [state.biomarkers, isInitialized]);

  useEffect(() => {
    if (isInitialized && state.biomarkerHistory) {
      saveBiomarkerHistory(state.biomarkerHistory);
    }
  }, [state.biomarkerHistory, isInitialized]);

  const initializeAppData = async () => {
    console.log('🚀 Initializing AppContext...');
    try {
      // Load user profile
      const profileStr = await AsyncStorage.getItem('userProfile');
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          dispatch({ type: 'SET_USER_PROFILE', payload: profile });
          console.log('✅ Loaded user profile');
        } catch (parseError) {
          console.error('Failed to parse profile:', parseError);
        }
      }

      // Load biomarkers
      const biomarkersStr = await getItemFromStorage('biomarkers');
      if (biomarkersStr) {
        try {
          const biomarkers = JSON.parse(biomarkersStr);
          dispatch({ type: 'SET_BIOMARKERS', payload: biomarkers });
          console.log('✅ Loaded biomarkers');
        } catch (parseError) {
          console.error('Failed to parse biomarkers:', parseError);
        }
      }

      // Load biomarker history
      const historyStr = await getItemFromStorage('biomarkerHistory');
      if (historyStr) {
        try {
          const history = JSON.parse(historyStr);
          dispatch({ type: 'UPDATE_STATE', payload: { biomarkerHistory: history } });
          console.log('✅ Loaded biomarker history');
        } catch (parseError) {
          console.error('Failed to parse history:', parseError);
        }
      }

      // Check authentication
      const authStr = await AsyncStorage.getItem('@praxiom_authenticated');
      if (authStr === 'true') {
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        console.log('✅ User is authenticated');
      }

      setIsInitialized(true);
      console.log('✅ AppContext initialization complete');
    } catch (error) {
      console.error('❌ AppContext initialization error:', error);
      setIsInitialized(true); // Still set as initialized to prevent hang
    }
  };

  const saveBiomarkers = async (biomarkers) => {
    try {
      await setItemInStorage('biomarkers', JSON.stringify(biomarkers));
    } catch (error) {
      console.error('Failed to save biomarkers:', error);
    }
  };

  const saveBiomarkerHistory = async (history) => {
    try {
      const historyToSave = history.slice(0, 100);
      await setItemInStorage('biomarkerHistory', JSON.stringify(historyToSave));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  // Helper functions
  const updateBiomarkers = (newBiomarkers) => {
    dispatch({ type: 'SET_BIOMARKERS', payload: newBiomarkers });
    
    // Add to history
    const historyEntry = {
      date: new Date().toISOString(),
      biomarkers: newBiomarkers,
    };
    dispatch({ type: 'ADD_BIOMARKER_ENTRY', payload: historyEntry });
    
    // Calculate bio-age
    const ageData = calculateBioAge(newBiomarkers, state.chronologicalAge);
    dispatch({ type: 'SET_BIO_AGE', payload: ageData });
  };

  const updateState = (updates) => {
    dispatch({ type: 'UPDATE_STATE', payload: updates });
  };

  const setAuthenticated = (isAuth) => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: isAuth });
  };

  const resetApp = async () => {
    console.log('🔄 Resetting app...');
    try {
      // Clear all storage
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
      
      // Also try to clear SecureStore items
      const secureKeys = ['userPin', 'biomarkers', 'biomarkerHistory'];
      for (const key of secureKeys) {
        await removeItemFromStorage(key);
      }
      
      dispatch({ type: 'RESET' });
      console.log('✅ App reset complete');
    } catch (error) {
      console.error('❌ Reset failed:', error);
      Alert.alert('Error', 'Failed to reset app data');
    }
  };

  const value = {
    ...state,
    dispatch, // Include dispatch for backward compatibility
    updateBiomarkers,
    updateState,
    setAuthenticated,
    resetApp,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

