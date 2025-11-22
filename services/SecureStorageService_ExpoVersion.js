import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEYS = [
  'bioAge',
  'tier1Results',
  'tier2Results', 
  'tier3Results',
  'biomarkerHistory',
  'tier1Biomarkers',
  'tier2Biomarkers',
  'tier3Biomarkers',
  'fitnessAssessment',
  'fitnessAssessments',
  'dateOfBirth',
  'userProfile',
  'oura_client_id',
  'oura_client_secret'
];

const requiresEncryption = (key) => {
  return SECURE_KEYS.some(secureKey => key.includes(secureKey));
};

/**
 * Store data (uses SecureStore for sensitive data)
 */
export const setItem = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    
    if (requiresEncryption(key)) {
      // Use expo-secure-store for sensitive data
      await SecureStore.setItemAsync(`secure_${key}`, jsonValue);
      console.log(`✅ Encrypted and stored: ${key}`);
    } else {
      // Use AsyncStorage for non-sensitive data
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✅ Stored (unencrypted): ${key}`);
    }
  } catch (error) {
    console.error(`Storage error for ${key}:`, error);
    throw error;
  }
};

/**
 * Retrieve data
 */
export const getItem = async (key) => {
  try {
    if (requiresEncryption(key)) {
      // Try to get from SecureStore
      const value = await SecureStore.getItemAsync(`secure_${key}`);
      if (value) {
        console.log(`✅ Retrieved from SecureStore: ${key}`);
        return JSON.parse(value);
      }
      
      // Fallback: check AsyncStorage for legacy data
      const legacy = await AsyncStorage.getItem(key);
      if (legacy) {
        console.warn(`⚠️ Found unencrypted data for ${key}, migrating...`);
        const parsed = JSON.parse(legacy);
        // Migrate to SecureStore
        await setItem(key, parsed);
        await AsyncStorage.removeItem(key);
        return parsed;
      }
      
      return null;
    } else {
      // Retrieve from AsyncStorage
      const jsonValue = await AsyncStorage.getItem(key);
      console.log(`✅ Retrieved (unencrypted): ${key}`);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    }
  } catch (error) {
    console.error(`Retrieval error for ${key}:`, error);
    return null;
  }
};

/**
 * Remove data
 */
export const removeItem = async (key) => {
  try {
    if (requiresEncryption(key)) {
      await SecureStore.deleteItemAsync(`secure_${key}`);
      await AsyncStorage.removeItem(key); // Remove legacy
    } else {
      await AsyncStorage.removeItem(key);
    }
    console.log(`✅ Removed: ${key}`);
  } catch (error) {
    console.error(`Removal error for ${key}:`, error);
    throw error;
  }
};

/**
 * Get all keys from AsyncStorage
 */
export const getAllKeys = async () => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Get keys error:', error);
    return [];
  }
};

/**
 * Get security status
 */
export const getSecurityStatus = async () => {
  try {
    const allKeys = await getAllKeys();
    const secureKeys = allKeys.filter(k => k.startsWith('secure_'));
    
    // Note: SecureStore keys are not enumerable, so we check a few known ones
    const knownSecureKeys = ['tier1Biomarkers', 'tier2Biomarkers', 'fitnessAssessments'];
    let secureStoreCount = 0;
    
    for (const key of knownSecureKeys) {
      try {
        const value = await SecureStore.getItemAsync(`secure_${key}`);
        if (value) secureStoreCount++;
      } catch (e) {}
    }
    
    return {
      totalKeys: allKeys.length,
      encryptedKeys: secureStoreCount,
      unencryptedKeys: allKeys.length - secureKeys.length,
      securityLevel: secureStoreCount > 0 ? 'HIGH' : 'LOW',
      encryptedKeysList: [`Found ${secureStoreCount} encrypted keys in SecureStore`],
      unencryptedKeysList: allKeys.filter(k => !k.startsWith('secure_'))
    };
  } catch (error) {
    console.error('Security status error:', error);
    return { error: error.message };
  }
};

export default {
  setItem,
  getItem,
  removeItem,
  getAllKeys,
  getSecurityStatus
};
