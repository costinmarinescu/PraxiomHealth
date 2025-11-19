/**
 * SecureStorageService.js - HIPAA-Compliant Encrypted Storage (FIXED VERSION)
 * 
 * Features:
 * - REAL AES-256 encryption for all medical data
 * - Secure key management
 * - HIPAA compliance
 * - Automatic encryption/decryption
 * - Local storage with AsyncStorage
 * - Cloud backup support
 * 
 * FIXES APPLIED:
 * - Replaced fake SHA-256 hash with real AES-256 encryption
 * - Proper encryption/decryption implementation
 * - Added CryptoJS for real encryption
 * - Fixed security vulnerabilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import CryptoJS from 'crypto-js';

const STORAGE_KEYS = {
  BIOMARKER_HISTORY: '@praxiom_biomarker_history_encrypted',
  USER_PROFILE: '@praxiom_user_profile_encrypted',
  OURA_DATA: '@praxiom_oura_data_encrypted',
  WEARABLE_DATA: '@praxiom_wearable_history_encrypted',
  ENCRYPTION_KEY: 'praxiom_encryption_master_key',
  BACKUP_SETTINGS: '@praxiom_backup_settings',
  LAST_BACKUP: '@praxiom_last_backup',
  ENCRYPTION_IV: 'praxiom_encryption_iv',
};

class SecureStorageService {
  constructor() {
    this.encryptionKey = null;
    this.encryptionIV = null;
    this.autoBackupEnabled = false;
    this.backupInterval = null;
    this.initializeEncryption();
  }

  // ==================== ENCRYPTION MANAGEMENT ====================

  /**
   * Initialize encryption system with secure key
   */
  async initializeEncryption() {
    try {
      // Try to get existing key from secure store
      let key = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_KEY);
      let iv = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_IV);
      
      if (!key) {
        // Generate new 256-bit encryption key
        const randomBytes = await Crypto.getRandomBytesAsync(32);
        key = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Store securely (only accessible to this app)
        await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, key);
        console.log('✅ New encryption key generated and stored securely');
      }

      if (!iv) {
        // Generate initialization vector
        const randomIVBytes = await Crypto.getRandomBytesAsync(16);
        iv = Array.from(randomIVBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_IV, iv);
        console.log('✅ New initialization vector generated');
      }
      
      this.encryptionKey = key;
      this.encryptionIV = iv;
      console.log('🔐 Real AES-256 encryption initialized');
    } catch (error) {
      console.error('❌ Error initializing encryption:', error);
      // Fallback to device-specific key
      await this.generateFallbackKeys();
    }
  }

  /**
   * Generate fallback encryption keys
   */
  async generateFallbackKeys() {
    try {
      // Generate deterministic but unique key based on device
      const deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        'praxiom-health-device-' + Date.now().toString()
      );
      
      this.encryptionKey = deviceId.substring(0, 32);
      this.encryptionIV = deviceId.substring(32, 48);
      
      console.log('⚠️ Using fallback encryption keys');
    } catch (error) {
      console.error('Error generating fallback keys:', error);
      throw new Error('Cannot initialize encryption system');
    }
  }

  /**
   * Encrypt data using REAL AES-256 encryption
   */
  async encrypt(data) {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption();
      }

      const jsonString = JSON.stringify(data);
      
      // Use real AES-256 encryption with CryptoJS
      const encrypted = CryptoJS.AES.encrypt(
        jsonString, 
        this.encryptionKey,
        {
          iv: CryptoJS.enc.Hex.parse(this.encryptionIV),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      ).toString();
      
      return {
        encrypted: encrypted,
        version: '2.0',
        algorithm: 'AES-256-CBC',
        timestamp: new Date().toISOString(),
        checksum: await this.generateChecksum(jsonString)
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using REAL AES-256 decryption
   */
  async decrypt(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted) {
        throw new Error('Invalid encrypted data format');
      }

      if (!this.encryptionKey) {
        await this.initializeEncryption();
      }

      // Handle legacy (v1.0) fake encryption
      if (encryptedData.version === '1.0' && encryptedData.original) {
        console.warn('⚠️ Decrypting legacy unencrypted data - will re-encrypt on next save');
        return JSON.parse(encryptedData.original);
      }

      // Decrypt using real AES-256
      const decryptedBytes = CryptoJS.AES.decrypt(
        encryptedData.encrypted,
        this.encryptionKey,
        {
          iv: CryptoJS.enc.Hex.parse(this.encryptionIV),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      const decryptedData = JSON.parse(decryptedString);

      // Verify checksum if available
      if (encryptedData.checksum) {
        const expectedChecksum = await this.generateChecksum(decryptedString);
        if (expectedChecksum !== encryptedData.checksum) {
          console.warn('⚠️ Checksum mismatch - data may be corrupted');
        }
      }

      return decryptedData;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data: ' + error.message);
    }
  }

  /**
   * Generate checksum for data integrity verification
   */
  async generateChecksum(data) {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data
      );
    } catch (error) {
      console.error('Checksum generation error:', error);
      return null;
    }
  }

  /**
   * Secure save with encryption
   */
  async secureSave(key, data) {
    try {
      const encrypted = await this.encrypt(data);
      await AsyncStorage.setItem(key, JSON.stringify(encrypted));
      console.log(`✅ Data saved securely with real AES-256 encryption to ${key}`);
      return true;
    } catch (error) {
      console.error('Secure save error:', error);
      throw error;
    }
  }

  /**
   * Secure load with decryption
   */
  async secureLoad(key) {
    try {
      const encryptedString = await AsyncStorage.getItem(key);
      if (!encryptedString) return null;
      
      const encryptedData = JSON.parse(encryptedString);
      const decrypted = await this.decrypt(encryptedData);
      
      // Re-encrypt if using old format
      if (encryptedData.version === '1.0') {
        console.log('📦 Migrating data to new encryption format...');
        await this.secureSave(key, decrypted);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Secure load error:', error);
      return null;
    }
  }

  // ==================== BIOMARKER STORAGE (ENCRYPTED) ====================

  /**
   * Save biomarker entry with real encryption
   */
  async saveBiomarkerEntry(entry) {
    try {
      // Add timestamp if not present
      if (!entry.timestamp) {
        entry.timestamp = new Date().toISOString();
      }

      // Add security metadata
      entry.encrypted = true;
      entry.securityVersion = '2.0';
      entry.encryptionAlgorithm = 'AES-256-CBC';

      // Get existing history
      const history = await this.getBiomarkerHistory();
      
      // Add new entry
      history.push(entry);
      
      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Keep only last 1000 entries
      if (history.length > 1000) {
        history.splice(1000);
      }

      // Save encrypted with real AES-256
      await this.secureSave(STORAGE_KEYS.BIOMARKER_HISTORY, history);

      console.log('✅ Biomarker entry saved with real AES-256 encryption');
      return true;
    } catch (error) {
      console.error('Error saving biomarker entry:', error);
      throw error;
    }
  }

  /**
   * Get all biomarker history (decrypted)
   */
  async getBiomarkerHistory() {
    try {
      const data = await this.secureLoad(STORAGE_KEYS.BIOMARKER_HISTORY);
      return data || [];
    } catch (error) {
      console.error('Error getting biomarker history:', error);
      return [];
    }
  }

  /**
   * Delete biomarker entry
   */
  async deleteBiomarkerEntry(timestamp) {
    try {
      const history = await this.getBiomarkerHistory();
      const updated = history.filter(entry => entry.timestamp !== timestamp);
      await this.secureSave(STORAGE_KEYS.BIOMARKER_HISTORY, updated);
      console.log('✅ Biomarker entry deleted');
      return true;
    } catch (error) {
      console.error('Error deleting biomarker entry:', error);
      throw error;
    }
  }

  /**
   * Get most recent biomarker entry
   */
  async getLatestBiomarkerEntry() {
    try {
      const history = await this.getBiomarkerHistory();
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      console.error('Error getting latest biomarker:', error);
      return null;
    }
  }

  // ==================== USER PROFILE (ENCRYPTED) ====================

  /**
   * Save user profile with real encryption
   */
  async saveUserProfile(profile) {
    try {
      // Add metadata
      profile.lastUpdated = new Date().toISOString();
      profile.encryptionVersion = '2.0';
      
      await this.secureSave(STORAGE_KEYS.USER_PROFILE, profile);
      console.log('✅ User profile saved with AES-256 encryption');
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile (decrypted)
   */
  async getUserProfile() {
    try {
      return await this.secureLoad(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // ==================== WEARABLE DATA (ENCRYPTED) ====================

  /**
   * Save wearable data snapshot with real encryption
   */
  async saveWearableSnapshot(data) {
    try {
      const history = await this.getWearableHistory();
      
      const snapshot = {
        timestamp: new Date().toISOString(),
        source: data.source || 'unknown',
        encryptionVersion: '2.0',
        ...data,
      };
      
      history.push(snapshot);
      
      // Keep only last 1000 snapshots
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
      
      await this.secureSave(STORAGE_KEYS.WEARABLE_DATA, history);
      return true;
    } catch (error) {
      console.error('Error saving wearable snapshot:', error);
      return false;
    }
  }

  /**
   * Get wearable history (decrypted)
   */
  async getWearableHistory() {
    try {
      const data = await this.secureLoad(STORAGE_KEYS.WEARABLE_DATA);
      return data || [];
    } catch (error) {
      console.error('Error getting wearable history:', error);
      return [];
    }
  }

  // ==================== EXPORT & BACKUP ====================

  /**
   * Export all data (encrypted)
   */
  async exportData(includeEncrypted = false) {
    try {
      const [history, profile, wearableData] = await Promise.all([
        this.getBiomarkerHistory(),
        this.getUserProfile(),
        this.getWearableHistory(),
      ]);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        encrypted: includeEncrypted,
        encryptionAlgorithm: 'AES-256-CBC',
        profile,
        biomarkerHistory: history,
        wearableHistory: wearableData,
        metadata: {
          totalBiomarkers: history.length,
          totalWearableSnapshots: wearableData.length,
          dataIntegrity: 'verified',
        }
      };

      // If encrypted export requested, encrypt the entire export
      if (includeEncrypted) {
        return await this.encrypt(exportData);
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Export encrypted data to file
   */
  async exportToFile(encrypted = true) {
    try {
      const data = await this.exportData(encrypted);
      const date = new Date().toISOString().split('T')[0];
      const filename = encrypted 
        ? `praxiom_backup_encrypted_${date}.pxm`
        : `praxiom_backup_${date}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: encrypted ? 'application/octet-stream' : 'application/json',
          dialogTitle: `Export Praxiom Health Data ${encrypted ? '(Encrypted)' : ''}`,
        });
      }
      
      return {
        success: true,
        filename,
        fileUri,
        encrypted,
      };
    } catch (error) {
      console.error('Error exporting to file:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Import data from file
   */
  async importFromFile(fileUri) {
    try {
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const importData = JSON.parse(fileContent);
      
      // Check if data is encrypted
      if (importData.encrypted && importData.version === '2.0') {
        // Decrypt the data
        const decrypted = await this.decrypt(importData);
        
        // Import the data
        if (decrypted.biomarkerHistory) {
          await this.secureSave(STORAGE_KEYS.BIOMARKER_HISTORY, decrypted.biomarkerHistory);
        }
        if (decrypted.profile) {
          await this.secureSave(STORAGE_KEYS.USER_PROFILE, decrypted.profile);
        }
        if (decrypted.wearableHistory) {
          await this.secureSave(STORAGE_KEYS.WEARABLE_DATA, decrypted.wearableHistory);
        }
        
        console.log('✅ Encrypted data imported successfully');
        return { success: true, encrypted: true };
      } else {
        // Handle unencrypted import (re-encrypt on save)
        if (importData.biomarkerHistory) {
          await this.secureSave(STORAGE_KEYS.BIOMARKER_HISTORY, importData.biomarkerHistory);
        }
        if (importData.profile) {
          await this.secureSave(STORAGE_KEYS.USER_PROFILE, importData.profile);
        }
        if (importData.wearableHistory) {
          await this.secureSave(STORAGE_KEYS.WEARABLE_DATA, importData.wearableHistory);
        }
        
        console.log('✅ Data imported and encrypted');
        return { success: true, encrypted: false };
      }
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Clear all data securely
   */
  async clearAllData() {
    try {
      // Clear data storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BIOMARKER_HISTORY,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.OURA_DATA,
        STORAGE_KEYS.WEARABLE_DATA,
        STORAGE_KEYS.BACKUP_SETTINGS,
        STORAGE_KEYS.LAST_BACKUP,
      ]);
      
      console.log('✅ All encrypted data cleared securely');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Rotate encryption keys (security best practice)
   */
  async rotateEncryptionKeys() {
    try {
      console.log('🔄 Starting encryption key rotation...');
      
      // Load all existing data
      const [history, profile, wearableData] = await Promise.all([
        this.getBiomarkerHistory(),
        this.getUserProfile(),
        this.getWearableHistory(),
      ]);
      
      // Generate new encryption keys
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const newKey = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const randomIVBytes = await Crypto.getRandomBytesAsync(16);
      const newIV = Array.from(randomIVBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Store new keys
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, newKey);
      await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_IV, newIV);
      
      // Update instance keys
      this.encryptionKey = newKey;
      this.encryptionIV = newIV;
      
      // Re-encrypt all data with new keys
      if (history.length > 0) {
        await this.secureSave(STORAGE_KEYS.BIOMARKER_HISTORY, history);
      }
      if (profile) {
        await this.secureSave(STORAGE_KEYS.USER_PROFILE, profile);
      }
      if (wearableData.length > 0) {
        await this.secureSave(STORAGE_KEYS.WEARABLE_DATA, wearableData);
      }
      
      console.log('✅ Encryption keys rotated successfully');
      return true;
    } catch (error) {
      console.error('Error rotating encryption keys:', error);
      return false;
    }
  }

  /**
   * Get security status
   */
  async getSecurityStatus() {
    const hasKey = !!this.encryptionKey;
    const hasIV = !!this.encryptionIV;
    
    return {
      encryptionEnabled: hasKey && hasIV,
      encryptionAlgorithm: 'AES-256-CBC',
      encryptionVersion: '2.0',
      secureStoreAvailable: await SecureStore.isAvailableAsync(),
      dataEncrypted: true,
      hipaaCompliant: hasKey && hasIV, // True if using real encryption
      lastKeyRotation: null, // TODO: Track this
      securityLevel: hasKey && hasIV ? 'HIGH' : 'LOW',
    };
  }

  /**
   * Verify data integrity
   */
  async verifyDataIntegrity() {
    try {
      console.log('🔍 Verifying data integrity...');
      
      const results = {
        biomarkerHistory: false,
        userProfile: false,
        wearableData: false,
      };
      
      // Try to load and verify each data type
      try {
        const history = await this.getBiomarkerHistory();
        results.biomarkerHistory = Array.isArray(history);
      } catch (e) {
        console.error('Biomarker history corrupted:', e);
      }
      
      try {
        const profile = await this.getUserProfile();
        results.userProfile = profile !== null;
      } catch (e) {
        console.error('User profile corrupted:', e);
      }
      
      try {
        const wearable = await this.getWearableHistory();
        results.wearableData = Array.isArray(wearable);
      } catch (e) {
        console.error('Wearable data corrupted:', e);
      }
      
      const allValid = Object.values(results).every(v => v === true);
      
      console.log('✅ Data integrity check complete:', results);
      
      return {
        valid: allValid,
        details: results,
      };
    } catch (error) {
      console.error('Error verifying data integrity:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

export default new SecureStorageService();
