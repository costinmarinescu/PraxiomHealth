import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optional imports - these require native modules
let AppleHealthKit = null;
let GoogleFit = null;

// Try to import health libraries if available
try {
  AppleHealthKit = require('react-native-health');
} catch (e) {
  console.log('Apple HealthKit not available');
}

try {
  GoogleFit = require('react-native-google-fit');
} catch (e) {
  console.log('Google Fit not available');
}

class WearableDataService {
  constructor() {
    this.isInitialized = false;
    this.healthDataCache = {};
    this.healthKitAvailable = AppleHealthKit !== null && Platform.OS === 'ios';
    this.googleFitAvailable = GoogleFit !== null && Platform.OS === 'android';
  }

  /**
   * Check if wearable integration is available
   */
  isAvailable() {
    return this.healthKitAvailable || this.googleFitAvailable;
  }

  /**
   * Initialize health data access for the platform
   */
  async initialize() {
    if (this.isInitialized) return true;

    if (!this.isAvailable()) {
      console.log('Health libraries not available - this is expected in development');
      return false;
    }

    try {
      if (Platform.OS === 'ios' && this.healthKitAvailable) {
        return await this.initializeAppleHealth();
      } else if (Platform.OS === 'android' && this.googleFitAvailable) {
        return await this.initializeGoogleFit();
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize wearable data service:', error);
      return false;
    }
  }

  /**
   * Initialize Apple HealthKit for iOS
   */
  async initializeAppleHealth() {
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.RestingHeartRate,
          AppleHealthKit.Constants.Permissions.HeartRateVariability,
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.StepCount,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.OxygenSaturation,
          AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
          AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.Workout,
        ],
        write: [],
      },
    };

    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.error('[AppleHealth] Cannot grant permissions', error);
          reject(error);
        } else {
          console.log('[AppleHealth] Permissions granted');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  /**
   * Initialize Google Fit for Android
   */
  async initializeGoogleFit() {
    const options = {
      scopes: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.blood_pressure.read',
        'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
        'https://www.googleapis.com/auth/fitness.sleep.read',
      ],
    };

    return new Promise((resolve, reject) => {
      GoogleFit.authorize(options)
        .then((authResult) => {
          if (authResult.success) {
            console.log('[GoogleFit] Authorization successful');
            this.isInitialized = true;
            resolve(true);
          } else {
            console.error('[GoogleFit] Authorization denied');
            reject(new Error('Authorization denied'));
          }
        })
        .catch((error) => {
          console.error('[GoogleFit] Authorization error', error);
          reject(error);
        });
    });
  }

  /**
   * Fetch comprehensive health data from wearables
   */
  async fetchHealthData(startDate, endDate) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Unable to initialize wearable data service');
      }
    }

    const data = {
      heartRate: await this.getHeartRateData(startDate, endDate),
      heartRateVariability: await this.getHRVData(startDate, endDate),
      steps: await this.getStepsData(startDate, endDate),
      oxygenSaturation: await this.getOxygenSaturationData(startDate, endDate),
      bloodPressure: await this.getBloodPressureData(startDate, endDate),
      sleep: await this.getSleepData(startDate, endDate),
      activity: await this.getActivityData(startDate, endDate),
    };

    // Cache the data
    this.healthDataCache = data;
    await this.saveToStorage(data);

    return data;
  }

  /**
   * Get heart rate data
   */
  async getHeartRateData(startDate, endDate) {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getHeartRateSamples(options, (err, results) => {
          if (err) {
            console.error('[AppleHealth] Error getting heart rate:', err);
            resolve([]);
          } else {
            resolve(results);
          }
        });
      });
    } else if (Platform.OS === 'android') {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      return GoogleFit.getHeartRateSamples(opt);
    }
    return [];
  }

  /**
   * Get heart rate variability (HRV) data
   */
  async getHRVData(startDate, endDate) {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getHeartRateVariabilitySamples(options, (err, results) => {
          if (err) {
            console.error('[AppleHealth] Error getting HRV:', err);
            resolve([]);
          } else {
            resolve(results);
          }
        });
      });
    }
    // Google Fit doesn't provide direct HRV access
    return [];
  }

  /**
   * Get steps data
   */
  async getStepsData(startDate, endDate) {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getStepCount(options, (err, results) => {
          if (err) {
            console.error('[AppleHealth] Error getting steps:', err);
            resolve({ value: 0 });
          } else {
            resolve(results);
          }
        });
      });
    } else if (Platform.OS === 'android') {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      return GoogleFit.getDailyStepCountSamples(opt);
    }
    return { value: 0 };
  }

  /**
   * Get oxygen saturation (SpO2) data
   */
  async getOxygenSaturationData(startDate, endDate) {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getOxygenSaturationSamples(options, (err, results) => {
          if (err) {
            console.error('[AppleHealth] Error getting SpO2:', err);
            resolve([]);
          } else {
            resolve(results);
          }
        });
      });
    }
    return [];
  }

  /**
   * Get blood pressure data
   */
  async getBloodPressureData(startDate, endDate) {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getBloodPressureSamples(options, (err, results) => {
          if (err) {
            console.error('[AppleHealth] Error getting blood pressure:', err);
            resolve([]);
          } else {
            resolve(results);
          }
        });
      });
    }
    return [];
  }

  /**
   * Get sleep data
   */
  async getSleepData(startDate, endDate) {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getSleepSamples(options, (err, results) => {
          if (err) {
            console.error('[AppleHealth] Error getting sleep:', err);
            resolve([]);
          } else {
            resolve(results);
          }
        });
      });
    } else if (Platform.OS === 'android') {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      return GoogleFit.getSleepSamples(opt);
    }
    return [];
  }

  /**
   * Get activity/workout data
   */
  async getActivityData(startDate, endDate) {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getSamples(options, (err, results) => {
          if (err) {
            console.error('[AppleHealth] Error getting activity:', err);
            resolve([]);
          } else {
            resolve(results);
          }
        });
      });
    } else if (Platform.OS === 'android') {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      return GoogleFit.getActivitySamples(opt);
    }
    return [];
  }

  /**
   * Calculate fitness score from wearable data
   */
  calculateFitnessScore(healthData) {
    let score = 0;
    let factors = 0;

    // Steps (0-30 points)
    if (healthData.steps && healthData.steps.value) {
      const steps = healthData.steps.value;
      const stepsScore = Math.min(30, (steps / 10000) * 30);
      score += stepsScore;
      factors++;
    }

    // Heart rate variability (0-25 points)
    if (healthData.heartRateVariability && healthData.heartRateVariability.length > 0) {
      const avgHRV = healthData.heartRateVariability.reduce((sum, item) => sum + item.value, 0) 
                     / healthData.heartRateVariability.length;
      const hrvScore = Math.min(25, (avgHRV / 100) * 25);
      score += hrvScore;
      factors++;
    }

    // Resting heart rate (0-20 points)
    if (healthData.heartRate && healthData.heartRate.length > 0) {
      const avgHR = healthData.heartRate.reduce((sum, item) => sum + item.value, 0) 
                    / healthData.heartRate.length;
      // Lower resting HR is better (ideal 60-70)
      const hrScore = avgHR <= 60 ? 20 : Math.max(0, 20 - ((avgHR - 60) / 2));
      score += hrScore;
      factors++;
    }

    // Sleep (0-15 points)
    if (healthData.sleep && healthData.sleep.length > 0) {
      const totalSleep = healthData.sleep.reduce((sum, item) => {
        const duration = (new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);
      const avgSleep = totalSleep / healthData.sleep.length;
      const sleepScore = avgSleep >= 7 ? 15 : (avgSleep / 7) * 15;
      score += sleepScore;
      factors++;
    }

    // Activity/exercise (0-10 points)
    if (healthData.activity && healthData.activity.length > 0) {
      const activityScore = Math.min(10, healthData.activity.length * 2);
      score += activityScore;
      factors++;
    }

    // Normalize to 0-100 scale
    return factors > 0 ? (score / factors) * (100 / 20) : 0;
  }

  /**
   * Calculate systemic health score from wearable data
   */
  calculateSystemicScore(healthData) {
    let score = 100;

    // Blood pressure
    if (healthData.bloodPressure && healthData.bloodPressure.length > 0) {
      const avgSystolic = healthData.bloodPressure.reduce((sum, item) => 
        sum + item.bloodPressureSystolicValue, 0) / healthData.bloodPressure.length;
      const avgDiastolic = healthData.bloodPressure.reduce((sum, item) => 
        sum + item.bloodPressureDiastolicValue, 0) / healthData.bloodPressure.length;
      
      if (avgSystolic > 140 || avgDiastolic > 90) score -= 20;
      else if (avgSystolic > 130 || avgDiastolic > 85) score -= 10;
    }

    // Oxygen saturation
    if (healthData.oxygenSaturation && healthData.oxygenSaturation.length > 0) {
      const avgSpO2 = healthData.oxygenSaturation.reduce((sum, item) => 
        sum + item.value, 0) / healthData.oxygenSaturation.length;
      
      if (avgSpO2 < 95) score -= 15;
      else if (avgSpO2 < 97) score -= 5;
    }

    // Resting heart rate
    if (healthData.heartRate && healthData.heartRate.length > 0) {
      const avgHR = healthData.heartRate.reduce((sum, item) => 
        sum + item.value, 0) / healthData.heartRate.length;
      
      if (avgHR > 100 || avgHR < 40) score -= 15;
      else if (avgHR > 90 || avgHR < 50) score -= 8;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Save health data to local storage
   */
  async saveToStorage(data) {
    try {
      await AsyncStorage.setItem('wearableHealthData', JSON.stringify(data));
      await AsyncStorage.setItem('wearableDataLastSync', new Date().toISOString());
    } catch (error) {
      console.error('Error saving wearable data:', error);
    }
  }

  /**
   * Load cached health data from storage
   */
  async loadFromStorage() {
    try {
      const data = await AsyncStorage.getItem('wearableHealthData');
      const lastSync = await AsyncStorage.getItem('wearableDataLastSync');
      
      if (data) {
        this.healthDataCache = JSON.parse(data);
        return { data: this.healthDataCache, lastSync };
      }
    } catch (error) {
      console.error('Error loading wearable data:', error);
    }
    return null;
  }

  /**
   * Import data from Fitbit (requires Fitbit API setup)
   */
  async importFromFitbit(accessToken) {
    // This requires Fitbit OAuth setup and API integration
    // Placeholder for Fitbit integration
    console.log('Fitbit integration requires API setup');
    throw new Error('Fitbit integration not yet implemented');
  }

  /**
   * Import data from Garmin (requires Garmin Connect API setup)
   */
  async importFromGarmin(accessToken) {
    // This requires Garmin Connect API setup
    // Placeholder for Garmin integration
    console.log('Garmin integration requires API setup');
    throw new Error('Garmin integration not yet implemented');
  }
}

export default new WearableDataService();
