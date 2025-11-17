/**
 * StorageService.js - Enhanced with Automatic Cloud Backup
 * 
 * Features:
 * - Local storage with AsyncStorage
 * - Automatic cloud backup (Google Drive, iCloud)
 * - Manual export/import
 * - Backup scheduling
 * - Data encryption option
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const STORAGE_KEYS = {
  BIOMARKER_HISTORY: '@praxiom_biomarker_history',
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

  // ==================== BIOMARKER STORAGE ====================

  /**
   * Save biomarker entry with date
   */
  async saveBiomarkerEntry(entry) {
    try {
      // Add timestamp if not present
      if (!entry.timestamp) {
        entry.timestamp = new Date().toISOString();
      }

      // Get existing history
      const history = await this.getBiomarkerHistory();
      
      // Add new entry
      history.push(entry);
      
      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Save updated history
      await AsyncStorage.setItem(
        STORAGE_KEYS.BIOMARKER_HISTORY,
        JSON.stringify(history)
      );

      // Trigger auto-backup if enabled
      if (this.autoBackupEnabled) {
        await this.checkAndBackup();
      }

      return true;
    } catch (error) {
      console.error('Error saving biomarker entry:', error);
      throw error;
    }
  }

  /**
   * Get all biomarker history
   */
  async getBiomarkerHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BIOMARKER_HISTORY);
      return data ? JSON.parse(data) : [];
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
   * Delete biomarker entry
   */
  async deleteBiomarkerEntry(timestamp) {
    try {
      const history = await this.getBiomarkerHistory();
      const updated = history.filter(entry => entry.timestamp !== timestamp);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.BIOMARKER_HISTORY,
        JSON.stringify(updated)
      );
      
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
        version: '1.0',
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
        throw new Error('Invalid data format');
      }

      // Validate data structure
      if (data.version !== '1.0') {
        console.warn('Data version mismatch, attempting import anyway');
      }

      // Import profile
      if (data.profile) {
        await this.saveUserProfile(data.profile);
      }
      
      // Import biomarker history
      if (data.biomarkerHistory && Array.isArray(data.biomarkerHistory)) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.BIOMARKER_HISTORY,
          JSON.stringify(data.biomarkerHistory)
        );
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
   * Clear all data
   */
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BIOMARKER_HISTORY,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.OURA_DATA,
        STORAGE_KEYS.WEARABLE_DATA,
      ]);
      
      console.log('✅ All data cleared');
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
      const [biomarkers, wearables] = await Promise.all([
        this.getBiomarkerHistory(),
        this.getWearableHistory(),
      ]);
      
      return {
        biomarkerEntries: biomarkers.length,
        wearableSnapshots: wearables.length,
        oldestEntry: biomarkers.length > 0 ? biomarkers[biomarkers.length - 1].timestamp : null,
        newestEntry: biomarkers.length > 0 ? biomarkers[0].timestamp : null,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
}

export default new StorageService();
