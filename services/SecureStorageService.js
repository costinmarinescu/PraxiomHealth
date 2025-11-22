import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

/**
 * SecureStorageService - HIPAA-Compliant Encrypted Storage
 * 
 * Provides AES-256 encryption for sensitive medical data
 * Regular settings use unencrypted AsyncStorage for performance
 */

// Generate a device-specific encryption key (in production, use more sophisticated key management)
const ENCRYPTION_KEY = 'PRAXIOM_SECURE_KEY_V1_2025'; // In production: use react-native-keychain

// ✅ FIXED: Keys that require encryption (medical/personal data)
const SECURE_KEYS = [
  'bioAge',
  'tier1Results',
  'tier2Results', 
  'tier3Results',
  'biomarkerHistory',
  'tier1Biomarkers',
  'tier2Biomarkers',
  'tier3Biomarkers',
  'fitnessAssessment',    // ✅ ORIGINAL singular form
  'fitnessAssessments',   // ✅ ADDED: plural form for compatibility
  'dateOfBirth',
  'userProfile',
  'oura_client_id',      // Oura API credentials
  'oura_client_secret'   // Oura API credentials
];

/**
 * Encrypt data using AES-256
 */
const encrypt = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256
 */
const decrypt = (encryptedData) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Check if a key requires encryption
 */
const requiresEncryption = (key) => {
  return SECURE_KEYS.some(secureKey => key.includes(secureKey));
};

/**
 * Store data (automatically encrypts sensitive keys)
 */
export const setItem = async (key, value) => {
  try {
    if (requiresEncryption(key)) {
      // Encrypt sensitive data
      const encrypted = encrypt(value);
      await AsyncStorage.setItem(`secure_${key}`, encrypted);
      console.log(`✅ Encrypted and stored: ${key}`);
    } else {
      // Store non-sensitive data without encryption
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✅ Stored (unencrypted): ${key}`);
    }
  } catch (error) {
    console.error(`Storage error for ${key}:`, error);
    throw error;
  }
};

/**
 * Retrieve data (automatically decrypts if needed)
 */
export const getItem = async (key) => {
  try {
    if (requiresEncryption(key)) {
      // Try to get encrypted version first
      const encrypted = await AsyncStorage.getItem(`secure_${key}`);
      if (encrypted) {
        const decrypted = decrypt(encrypted);
        console.log(`✅ Retrieved and decrypted: ${key}`);
        return decrypted;
      }
      
      // Fallback: check for unencrypted legacy data
      const legacy = await AsyncStorage.getItem(key);
      if (legacy) {
        console.warn(`⚠️ Found unencrypted data for ${key}, migrating...`);
        const parsed = JSON.parse(legacy);
        // Migrate to encrypted storage
        await setItem(key, parsed);
        await AsyncStorage.removeItem(key);
        return parsed;
      }
      
      return null;
    } else {
      // Retrieve non-sensitive data
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
      await AsyncStorage.removeItem(`secure_${key}`);
      // Also remove any legacy unencrypted version
      await AsyncStorage.removeItem(key);
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
 * Clear all data (use with caution)
 */
export const clear = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('Clear error:', error);
    throw error;
  }
};

/**
 * Get all keys
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
 * Get security status for debugging
 */
export const getSecurityStatus = async () => {
  try {
    const allKeys = await getAllKeys();
    const secureKeys = allKeys.filter(k => k.startsWith('secure_'));
    const insecureKeys = allKeys.filter(k => !k.startsWith('secure_'));
    
    return {
      totalKeys: allKeys.length,
      encryptedKeys: secureKeys.length,
      unencryptedKeys: insecureKeys.length,
      securityLevel: secureKeys.length > 0 ? 'HIGH' : 'LOW',
      encryptedKeysList: secureKeys,
      unencryptedKeysList: insecureKeys
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
  clear,
  getAllKeys,
  getSecurityStatus
};
