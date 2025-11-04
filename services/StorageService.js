import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  BIOMARKER_HISTORY: '@praxiom_biomarker_history',
  USER_PROFILE: '@praxiom_user_profile',
};

class StorageService {
  // Save biomarker entry with date
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

      return true;
    } catch (error) {
      console.error('Error saving biomarker entry:', error);
      throw error;
    }
  }

  // Get all biomarker history
  async getBiomarkerHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BIOMARKER_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting biomarker history:', error);
      return [];
    }
  }

  // Get biomarker entry by date
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

  // Get biomarkers within date range
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

  // Delete biomarker entry
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

  // Get most recent biomarker entry
  async getLatestBiomarkerEntry() {
    try {
      const history = await this.getBiomarkerHistory();
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      console.error('Error getting latest biomarker:', error);
      return null;
    }
  }

  // Save user profile
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

  // Get user profile
  async getUserProfile() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Clear all data
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BIOMARKER_HISTORY,
        STORAGE_KEYS.USER_PROFILE,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Export data as JSON
  async exportData() {
    try {
      const history = await this.getBiomarkerHistory();
      const profile = await this.getUserProfile();
      
      return {
        exportDate: new Date().toISOString(),
        profile,
        history,
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Import data from JSON
  async importData(data) {
    try {
      if (data.profile) {
        await this.saveUserProfile(data.profile);
      }
      
      if (data.history && Array.isArray(data.history)) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.BIOMARKER_HISTORY,
          JSON.stringify(data.history)
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

export default new StorageService();
