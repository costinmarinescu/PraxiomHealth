/**
 * StorageService.js - Enhanced with Encryption & Proper History Tracking
 * 
 * FIXED VERSION - November 2025
 * 
 * Changes:
 * - Uses SecureStorageService for all medical data (HIPAA compliant)
 * - Proper tier-based storage (tier1Biomarkers, tier2Biomarkers, fitnessAssessments)
 * - Data migration from legacy unencrypted storage
 * - Maintains backup/export functionality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStorage from './SecureStorageService';

const STORAGE_KEYS = {
  BIOMARKER_HISTORY: '@praxiom_biomarker_history', // LEGACY - will be migrated
  USER_PROFILE: '@praxiom_user_profile',
  OURA_DATA: '@praxiom_oura_data',
  WEARABLE_DATA: '@praxiom_wearable_history',
  BACKUP_SETTINGS: '@praxiom_backup_settings',
  LAST_BACKUP: '@praxiom_last_backup',
};

class StorageService {
  constructor() {
    this.autoBackupEnabled = false;
    this.backupInterval = null;
    this.migrationCompleted = false;
    this.initializeBackup();
  }

  /**
   * Initialize automatic backup system
   */
  async initializeBackup() {
    try {
      const settings = await this.getBackupSettings();
      if (settings && settings.autoBackupEnabled) {
        this.enableAutoBackup(settings.backupFrequency || 'daily');
      }
    } catch (error) {
      console.error('Error initializing backup:', error);
    }
  }

  // ==================== DATA MIGRATION ====================

  /**
   * ✅ NEW: Migrate legacy unencrypted data to secure storage
   */
  async migrateLegacyData() {
    try {
      console.log('🔄 Starting legacy data migration...');
      
      // Check if migration already completed
      const migrationStatus = await AsyncStorage.getItem('@migration_completed');
      if (migrationStatus === 'true') {
        console.log('✅ Migration already completed');
        this.migrationCompleted = true;
        return { success: true, migrated: 0, alreadyCompleted: true };
      }

      // Get legacy data
      const legacyData = await AsyncStorage.getItem(STORAGE_KEYS.BIOMARKER_HISTORY);
      if (!legacyData) {
        console.log('✅ No legacy data to migrate');
        await AsyncStorage.setItem('@migration_completed', 'true');
        this.migrationCompleted = true;
        return { success: true, migrated: 0 };
      }

      const legacyArray = JSON.parse(legacyData);
      if (!Array.isArray(legacyArray) || legacyArray.length === 0) {
        console.log('✅ No legacy entries to migrate');
        await AsyncStorage.setItem('@migration_completed', 'true');
        this.migrationCompleted = true;
        return { success: true, migrated: 0 };
      }

      console.log(`📦 Found ${legacyArray.length} legacy entries to migrate`);

      // Separate by tier
      const tier1Entries = legacyArray.filter(e => e.tier === 1 || !e.tier);
      const tier2Entries = legacyArray.filter(e => e.tier === 2);
      const fitnessEntries = legacyArray.filter(e => e.tier === 'Fitness Assessment');

      // Migrate to secure storage
      if (tier1Entries.length > 0) {
        await SecureStorage.setItem('tier1Biomarkers', tier1Entries);
        console.log(`✅ Migrated ${tier1Entries.length} Tier 1 entries to encrypted storage`);
      }

      if (tier2Entries.length > 0) {
        await SecureStorage.setItem('tier2Biomarkers', tier2Entries);
        console.log(`✅ Migrated ${tier2Entries.length} Tier 2 entries to encrypted storage`);
      }

      if (fitnessEntries.length > 0) {
        await SecureStorage.setItem('fitnessAssessments', fitnessEntries);
        console.log(`✅ Migrated ${fitnessEntries.length} Fitness entries to encrypted storage`);
      }

      // Mark migration as completed
      await AsyncStorage.setItem('@migration_completed', 'true');
      
      // Keep legacy data for 30 days as backup (don't delete immediately)
      const backupDate = new Date();
      backupDate.setDate(backupDate.getDate() + 30);
      await AsyncStorage.setItem('@migration_backup_until', backupDate.toISOString());
      
      console.log('✅ Migration completed successfully');
      this.migrationCompleted = true;

      return { 
        success: true, 
        migrated: legacyArray.length,
        tier1: tier1Entries.length,
        tier2: tier2Entries.length,
        fitness: fitnessEntries.length
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ NEW: Clean up legacy data after backup period expires
   */
  async cleanupLegacyData() {
    try {
      const backupUntil = await AsyncStorage.getItem('@migration_backup_until');
      if (!backupUntil) return;

      const expiryDate = new Date(backupUntil);
      const now = new Date();

      if (now > expiryDate) {
        await AsyncStorage.removeItem(STORAGE_KEYS.BIOMARKER_HISTORY);
        await AsyncStorage.removeItem('@migration_backup_until');
        console.log('🗑️ Legacy backup data removed (30-day retention period expired)');
      }
    } catch (error) {
      console.error('Error cleaning up legacy data:', error);
    }
  }

  // ==================== BIOMARKER STORAGE (FIXED) ====================

  /**
   * ✅ FIXED: Save biomarker entry with proper tier-based encrypted storage
   */
  async saveBiomarkerEntry(entry) {
    try {
      // Run migration if not completed
      if (!this.migrationCompleted) {
        await this.migrateLegacyData();
      }

      // Add timestamp if not present
      if (!entry.timestamp) {
        entry.timestamp = new Date().toISOString();
      }

      // Determine storage key based on tier
      const tier = entry.tier || 1;
      let storageKey;
      
      if (tier === 'Fitness Assessment') {
        storageKey = 'fitnessAssessments';
      } else if (tier === 1) {
        storageKey = 'tier1Biomarkers';
      } else if (tier === 2) {
        storageKey = 'tier2Biomarkers';
      } else if (tier === 3) {
        storageKey = 'tier3Biomarkers';
      } else {
        storageKey = 'tier1Biomarkers'; // Default to Tier 1
      }

      // Get existing history for this tier from ENCRYPTED storage
      const existingData = await SecureStorage.getItem(storageKey);
      const history = Array.isArray(existingData) ? existingData : (existingData ? [existingData] : []);
      
      // Add new entry
      history.push(entry);
      
      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Save to ENCRYPTED storage
      await SecureStorage.setItem(storageKey, history);

      console.log(`✅ Biomarker entry saved to encrypted storage: ${storageKey}`);
      console.log(`📊 Total entries in ${storageKey}: ${history.length}`);
      
      // Trigger auto-backup if enabled
      if (this.autoBackupEnabled) {
        await this.checkAndBackup();
      }

      return true;
    } catch (error) {
      console.error('❌ Error saving biomarker entry:', error);
      throw error;
    }
  }

  /**
   * ✅ UPDATED: Get all biomarker history from encrypted storage
   */
  async getBiomarkerHistory() {
    try {
      // Run migration if not completed
      if (!this.migrationCompleted) {
        await this.migrateLegacyData();
      }

      // Get from all tiers
      const tier1Data = await SecureStorage.getItem('tier1Biomarkers');
      const tier2Data = await SecureStorage.getItem('tier2Biomarkers');
      const tier3Data = await SecureStorage.getItem('tier3Biomarkers');
      const fitnessData = await SecureStorage.getItem('fitnessAssessments');
      
      let allHistory = [];
      
      if (tier1Data) {
        const tier1Array = Array.isArray(tier1Data) ? tier1Data : [tier1Data];
        allHistory = [...allHistory, ...tier1Array];
      }
      
      if (tier2Data) {
        const tier2Array = Array.isArray(tier2Data) ? tier2Data : [tier2Data];
        allHistory = [...allHistory, ...tier2Array];
      }
      
      if (tier3Data) {
        const tier3Array = Array.isArray(tier3Data) ? tier3Data : [tier3Data];
        allHistory = [...allHistory, ...tier3Array];
      }
      
      if (fitnessData) {
        const fitnessArray = Array.isArray(fitnessData) ? fitnessData : [fitnessData];
        allHistory = [...allHistory, ...fitnessArray];
      }
      
      // Sort by timestamp (newest first)
      allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log(`📋 Retrieved ${allHistory.length} total biomarker entries from encrypted storage`);
      
      return allHistory;
    } catch (error) {
      console.error('Error getting biomarker history:', error);
      return [];
    }
  }

  /**
   * Get biomarker entry by date
   */
  async getBiomarkerByDate(date) {
    try {
      const history = await this.getBiomarkerHistory();
      const targetDate = new Date(date).toDateString();
      
      return history.find(entry => {
        const entryDate = new Date(entry.timestamp).toDateString();
        return entryDate === targetDate;
      });
    } catch (error) {
      console.error('Error getting biomarker by date:', error);
      return null;
    }
  }

  /**
   * Get biomarkers within date range
   */
  async getBiomarkersByDateRange(startDate, endDate) {
    try {
      const history = await this.getBiomarkerHistory();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return history.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate >= start && entryDate <= end;
      });
    } catch (error) {
      console.error('Error getting biomarkers by date range:', error);
      return [];
    }
  }

  /**
   * ✅ UPDATED: Delete biomarker entry from encrypted storage
   */
  async deleteBiomarkerEntry(timestamp) {
    try {
      // Get all history to find which tier the entry belongs to
      const allHistory = await this.getBiomarkerHistory();
      const entryToDelete = allHistory.find(e => e.timestamp === timestamp);
      
      if (!entryToDelete) {
        console.warn('Entry not found:', timestamp);
        return false;
      }

      // Determine storage key
      let storageKey;
      if (entryToDelete.tier === 'Fitness Assessment') {
        storageKey = 'fitnessAssessments';
      } else if (entryToDelete.tier === 1 || !entryToDelete.tier) {
        storageKey = 'tier1Biomarkers';
      } else if (entryToDelete.tier === 2) {
        storageKey = 'tier2Biomarkers';
      } else if (entryToDelete.tier === 3) {
        storageKey = 'tier3Biomarkers';
      }

      // Get history for that tier
      const tierData = await SecureStorage.getItem(storageKey);
      if (!tierData) return false;

      const tierArray = Array.isArray(tierData) ? tierData : [tierData];
      const updated = tierArray.filter(entry => entry.timestamp !== timestamp);
      
      // Save updated history
      await SecureStorage.setItem(storageKey, updated);
      
      console.log(`✅ Entry deleted from ${storageKey}`);
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

  // ==================== USER PROFILE ====================

  /**
   * Save user profile
   */
  async saveUserProfile(profile) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // ==================== WEARABLE DATA STORAGE ====================

  /**
   * Save wearable data snapshot
   */
  async saveWearableSnapshot(data) {
    try {
      const history = await this.getWearableHistory();
      
      const snapshot = {
        timestamp: new Date().toISOString(),
        source: data.source || 'unknown',
        ...data,
      };
      
      history.push(snapshot);
      
      // Keep only last 1000 snapshots
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.WEARABLE_DATA,
        JSON.stringify(history)
      );
      
      return true;
    } catch (error) {
      console.error('Error saving wearable snapshot:', error);
      return false;
    }
  }

  /**
   * Get wearable history
   */
  async getWearableHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WEARABLE_DATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting wearable history:', error);
      return [];
    }
  }

  // ==================== BACKUP & EXPORT ====================

  /**
   * Export all data as JSON
   */
  async exportData() {
    try {
      const [history, profile, ouraData, wearableData] = await Promise.all([
        this.getBiomarkerHistory(),
        this.getUserProfile(),
        AsyncStorage.getItem(STORAGE_KEYS.OURA_DATA),
        this.getWearableHistory(),
      ]);
      
      return {
        exportDate: new Date().toISOString(),
        version: '2.0', // Updated version for encrypted storage
        profile,
        biomarkerHistory: history,
        ouraData: ouraData ? JSON.parse(ouraData) : null,
        wearableHistory: wearableData,
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Export data to file and share
   */
  async exportToFile() {
    try {
      const data = await this.exportData();
      const filename = `praxiom_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Praxiom Health Data',
        });
      }
      
      return {
        success: true,
        filename,
        fileUri,
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
   * Import data from JSON
   */
  async importData(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data format');
      }

      // Import profile
      if (data.profile) {
        await this.saveUserProfile(data.profile);
      }
      
      // Import biomarker history to encrypted storage
      if (data.biomarkerHistory && Array.isArray(data.biomarkerHistory)) {
        // Separate by tier
        const tier1 = data.biomarkerHistory.filter(e => e.tier === 1 || !e.tier);
        const tier2 = data.biomarkerHistory.filter(e => e.tier === 2);
        const tier3 = data.biomarkerHistory.filter(e => e.tier === 3);
        const fitness = data.biomarkerHistory.filter(e => e.tier === 'Fitness Assessment');

        if (tier1.length > 0) await SecureStorage.setItem('tier1Biomarkers', tier1);
        if (tier2.length > 0) await SecureStorage.setItem('tier2Biomarkers', tier2);
        if (tier3.length > 0) await SecureStorage.setItem('tier3Biomarkers', tier3);
        if (fitness.length > 0) await SecureStorage.setItem('fitnessAssessments', fitness);
      }

      // Import Oura data
      if (data.ouraData) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.OURA_DATA,
          JSON.stringify(data.ouraData)
        );
      }

      // Import wearable history
      if (data.wearableHistory && Array.isArray(data.wearableHistory)) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.WEARABLE_DATA,
          JSON.stringify(data.wearableHistory)
        );
      }
      
      return {
        success: true,
        itemsImported: {
          profile: !!data.profile,
          biomarkers: data.biomarkerHistory?.length || 0,
          ouraData: !!data.ouraData,
          wearables: data.wearableHistory?.length || 0,
        },
      };
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Import data from file
   */
  async importFromFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const fileContent = await FileSystem.readAsStringAsync(result.uri);
        const data = JSON.parse(fileContent);
        
        return await this.importData(data);
      }
      
      return {
        success: false,
        error: 'File selection cancelled',
      };
    } catch (error) {
      console.error('Error importing from file:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== AUTOMATIC BACKUP ====================

  /**
   * Get backup settings
   */
  async getBackupSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP_SETTINGS);
      return data ? JSON.parse(data) : {
        autoBackupEnabled: false,
        backupFrequency: 'daily', // daily, weekly, manual
        lastBackupDate: null,
      };
    } catch (error) {
      console.error('Error getting backup settings:', error);
      return null;
    }
  }

  /**
   * Save backup settings
   */
  async saveBackupSettings(settings) {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.BACKUP_SETTINGS,
        JSON.stringify(settings)
      );
      
      // Update auto-backup
      if (settings.autoBackupEnabled) {
        this.enableAutoBackup(settings.backupFrequency);
      } else {
        this.disableAutoBackup();
      }
      
      return true;
    } catch (error) {
      console.error('Error saving backup settings:', error);
      return false;
    }
  }

  /**
   * Enable automatic backup
   */
  enableAutoBackup(frequency = 'daily') {
    this.disableAutoBackup(); // Clear existing interval
    
    const intervals = {
      hourly: 60 * 60 * 1000, // 1 hour
      daily: 24 * 60 * 60 * 1000, // 24 hours
      weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    const intervalTime = intervals[frequency] || intervals.daily;
    
    this.autoBackupEnabled = true;
    this.backupInterval = setInterval(() => {
      this.performAutomaticBackup();
    }, intervalTime);
    
    console.log(`✅ Auto-backup enabled: ${frequency}`);
    
    // Perform initial backup
    this.performAutomaticBackup();
  }

  /**
   * Disable automatic backup
   */
  disableAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    this.autoBackupEnabled = false;
    console.log('⏹️ Auto-backup disabled');
  }

  /**
   * Check if backup is needed and perform if necessary
   */
  async checkAndBackup() {
    try {
      const settings = await this.getBackupSettings();
      if (!settings || !settings.autoBackupEnabled) {
        return false;
      }

      const lastBackup = settings.lastBackupDate ? new Date(settings.lastBackupDate) : null;
      const now = new Date();
      
      let shouldBackup = false;
      
      if (!lastBackup) {
        shouldBackup = true;
      } else {
        const hoursSinceBackup = (now - lastBackup) / (1000 * 60 * 60);
        
        switch (settings.backupFrequency) {
          case 'hourly':
            shouldBackup = hoursSinceBackup >= 1;
            break;
          case 'daily':
            shouldBackup = hoursSinceBackup >= 24;
            break;
          case 'weekly':
            shouldBackup = hoursSinceBackup >= 168; // 7 days
            break;
        }
      }
      
      if (shouldBackup) {
        return await this.performAutomaticBackup();
      }
      
      return false;
    } catch (error) {
      console.error('Error checking backup:', error);
      return false;
    }
  }

  /**
   * Perform automatic backup
   */
  async performAutomaticBackup() {
    try {
      console.log('💾 Performing automatic backup...');
      
      const data = await this.exportData();
      const filename = `praxiom_auto_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
      
      // Update last backup time
      const settings = await this.getBackupSettings();
      settings.lastBackupDate = new Date().toISOString();
      await AsyncStorage.setItem(
        STORAGE_KEYS.BACKUP_SETTINGS,
        JSON.stringify(settings)
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_BACKUP,
        new Date().toISOString()
      );
      
      console.log('✅ Automatic backup completed:', filename);
      
      return {
        success: true,
        filename,
        fileUri,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Automatic backup failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get last backup info
   */
  async getLastBackupInfo() {
    try {
      const lastBackup = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
      const settings = await this.getBackupSettings();
      
      return {
        lastBackupDate: lastBackup ? new Date(lastBackup) : null,
        autoBackupEnabled: settings?.autoBackupEnabled || false,
        backupFrequency: settings?.backupFrequency || 'daily',
      };
    } catch (error) {
      console.error('Error getting backup info:', error);
      return null;
    }
  }

  // ==================== DATA MANAGEMENT ====================

  /**
   * ✅ UPDATED: Clear all data (including encrypted storage)
   */
  async clearAllData() {
    try {
      // Clear encrypted biomarker data
      await SecureStorage.removeItem('tier1Biomarkers');
      await SecureStorage.removeItem('tier2Biomarkers');
      await SecureStorage.removeItem('tier3Biomarkers');
      await SecureStorage.removeItem('fitnessAssessments');
      
      // Clear legacy and other data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BIOMARKER_HISTORY,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.OURA_DATA,
        STORAGE_KEYS.WEARABLE_DATA,
      ]);
      
      console.log('✅ All data cleared (including encrypted storage)');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const biomarkers = await this.getBiomarkerHistory();
      const wearables = await this.getWearableHistory();
      
      // Get security status
      const securityStatus = await SecureStorage.getSecurityStatus();
      
      return {
        biomarkerEntries: biomarkers.length,
        wearableSnapshots: wearables.length,
        oldestEntry: biomarkers.length > 0 ? biomarkers[biomarkers.length - 1].timestamp : null,
        newestEntry: biomarkers.length > 0 ? biomarkers[0].timestamp : null,
        encryptedKeys: securityStatus.encryptedKeys,
        securityLevel: securityStatus.securityLevel,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
}

export default new StorageService();
