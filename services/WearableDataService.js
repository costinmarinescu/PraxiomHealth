import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WearableDataService {
  constructor() {
    this.initialized = false;
    this.platform = Platform.OS;
  }

  // Initialize health services based on platform
  async initialize() {
    if (this.initialized) return true;

    try {
      if (this.platform === 'ios') {
        return await this.initializeAppleHealth();
      } else if (this.platform === 'android') {
        return await this.initializeGoogleFit();
      }
    } catch (error) {
      console.error('Health service initialization error:', error);
      return false;
    }
  }

  // Initialize Apple Health (iOS)
  async initializeAppleHealth() {
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.HeartRateVariability,
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.OxygenSaturation,
          AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
          AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        ],
        write: [],
      },
    };

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        if (error) {
          console.error('Apple Health init error:', error);
          resolve(false);
        } else {
          this.initialized = true;
          resolve(true);
        }
      });
    });
  }

  // Initialize Google Fit (Android)
  async initializeGoogleFit() {
    const options = {
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_LOCATION_READ,
        Scopes.FITNESS_HEART_RATE_READ,
      ],
    };

    try {
      const authorized = await GoogleFit.authorize(options);
      this.initialized = authorized.success;
      return authorized.success;
    } catch (error) {
      console.error('Google Fit init error:', error);
      return false;
    }
  }

  // Get heart rate data
  async getHeartRateData(startDate, endDate) {
    if (!this.initialized) await this.initialize();

    if (this.platform === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getHeartRateSamples(options, (error, results) => {
          if (error) {
            console.error('Heart rate fetch error:', error);
            resolve([]);
          } else {
            resolve(results || []);
          }
        });
      });
    } else if (this.platform === 'android') {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      const samples = await GoogleFit.getHeartRateSamples(opt);
      return samples || [];
    }
    return [];
  }

  // Get HRV data (iOS only for now)
  async getHRVData(startDate, endDate) {
    if (!this.initialized) await this.initialize();

    if (this.platform === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getHeartRateVariabilitySamples(options, (error, results) => {
          if (error) {
            console.error('HRV fetch error:', error);
            resolve([]);
          } else {
            resolve(results || []);
          }
        });
      });
    }
    return [];
  }

  // Get steps data
  async getStepsData(startDate, endDate) {
    if (!this.initialized) await this.initialize();

    if (this.platform === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getStepCount(options, (error, results) => {
          if (error) {
            console.error('Steps fetch error:', error);
            resolve({ value: 0 });
          } else {
            resolve(results || { value: 0 });
          }
        });
      });
    } else if (this.platform === 'android') {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      const steps = await GoogleFit.getDailyStepCountSamples(opt);
      const totalSteps = steps.reduce((sum, day) => sum + (day.steps || 0), 0);
      return { value: totalSteps };
    }
    return { value: 0 };
  }

  // Get SpO2 data (iOS only for now)
  async getSpO2Data(startDate, endDate) {
    if (!this.initialized) await this.initialize();

    if (this.platform === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getOxygenSaturationSamples(options, (error, results) => {
          if (error) {
            console.error('SpO2 fetch error:', error);
            resolve([]);
          } else {
            resolve(results || []);
          }
        });
      });
    }
    return [];
  }

  // Get blood pressure data
  async getBloodPressureData(startDate, endDate) {
    if (!this.initialized) await this.initialize();

    if (this.platform === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getBloodPressureSamples(options, (error, results) => {
          if (error) {
            console.error('Blood pressure fetch error:', error);
            resolve([]);
          } else {
            resolve(results || []);
          }
        });
      });
    }
    return [];
  }

  // Get sleep data
  async getSleepData(startDate, endDate) {
    if (!this.initialized) await this.initialize();

    if (this.platform === 'ios') {
      return new Promise((resolve) => {
        const options = { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
        AppleHealthKit.getSleepSamples(options, (error, results) => {
          if (error) {
            console.error('Sleep fetch error:', error);
            resolve([]);
          } else {
            resolve(results || []);
          }
        });
      });
    } else if (this.platform === 'android') {
      const opt = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      const sleep = await GoogleFit.getSleepSamples(opt);
      return sleep || [];
    }
    return [];
  }

  // Calculate Fitness Score (0-100)
  async calculateFitnessScore() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let score = 0;

    try {
      // Steps (30 points) - Target: 10,000 steps/day
      const stepsData = await this.getStepsData(sevenDaysAgo, now);
      const avgSteps = stepsData.value / 7;
      const stepsScore = Math.min((avgSteps / 10000) * 30, 30);
      score += stepsScore;

      // HRV (25 points) - Higher is better, typical range 20-200ms
      const hrvData = await this.getHRVData(sevenDaysAgo, now);
      if (hrvData.length > 0) {
        const avgHRV = hrvData.reduce((sum, item) => sum + item.value, 0) / hrvData.length;
        const hrvScore = Math.min((avgHRV / 100) * 25, 25);
        score += hrvScore;
      } else {
        score += 12.5; // Default mid-range if no data
      }

      // Resting Heart Rate (20 points) - Target: 60-70 bpm
      const hrData = await this.getHeartRateData(sevenDaysAgo, now);
      if (hrData.length > 0) {
        const restingHR = Math.min(...hrData.map(item => item.value));
        if (restingHR >= 60 && restingHR <= 70) {
          score += 20;
        } else if (restingHR < 60) {
          score += 15; // Athletic but might be too low
        } else if (restingHR <= 80) {
          score += 15;
        } else {
          score += 10;
        }
      } else {
        score += 10; // Default if no data
      }

      // Sleep (15 points) - Target: 7+ hours/night
      const sleepData = await getSleepData(sevenDaysAgo, now);
      if (sleepData.length > 0) {
        const totalSleepHours = sleepData.reduce((sum, item) => {
          const duration = (new Date(item.endDate) - new Date(item.startDate)) / 3600000;
          return sum + duration;
        }, 0);
        const avgSleepHours = totalSleepHours / 7;
        const sleepScore = Math.min((avgSleepHours / 7) * 15, 15);
        score += sleepScore;
      } else {
        score += 7.5; // Default mid-range
      }

      // Activity/Exercise (10 points)
      // Based on active energy burned or workout frequency
      score += 5; // Placeholder - would need workout data

    } catch (error) {
      console.error('Fitness score calculation error:', error);
    }

    return Math.round(Math.min(score, 100));
  }

  // Calculate Systemic Health Score (0-100)
  async calculateSystemicScore() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let score = 100; // Start at perfect, deduct points for issues

    try {
      // Blood Pressure Check
      const bpData = await this.getBloodPressureData(sevenDaysAgo, now);
      if (bpData.length > 0) {
        const latestBP = bpData[bpData.length - 1];
        const systolic = latestBP.bloodPressureSystolicValue;
        const diastolic = latestBP.bloodPressureDiastolicValue;

        // Optimal: <120/80
        // Elevated: 120-129/<80
        // High: ≥130/≥80
        if (systolic >= 140 || diastolic >= 90) {
          score -= 30; // Stage 2 hypertension
        } else if (systolic >= 130 || diastolic >= 80) {
          score -= 20; // Stage 1 hypertension
        } else if (systolic >= 120) {
          score -= 10; // Elevated
        }
      }

      // SpO2 Check
      const spo2Data = await this.getSpO2Data(sevenDaysAgo, now);
      if (spo2Data.length > 0) {
        const avgSpO2 = spo2Data.reduce((sum, item) => sum + item.value, 0) / spo2Data.length;
        
        if (avgSpO2 < 95) {
          score -= 25; // Low oxygen
        } else if (avgSpO2 < 97) {
          score -= 10; // Slightly low
        }
      }

      // Heart Rate Variability
      const hrData = await this.getHeartRateData(sevenDaysAgo, now);
      if (hrData.length > 0) {
        const avgHR = hrData.reduce((sum, item) => sum + item.value, 0) / hrData.length;
        
        if (avgHR > 100) {
          score -= 20; // Tachycardia
        } else if (avgHR < 50 && avgHR > 0) {
          score -= 15; // Bradycardia (unless athletic)
        }
      }

    } catch (error) {
      console.error('Systemic score calculation error:', error);
    }

    return Math.round(Math.max(score, 0));
  }

  // Cache data to AsyncStorage
  async cacheData(key, data) {
    try {
      await AsyncStorage.setItem(`wearable_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Cache error:', error);
    }
  }

  // Get cached data
  async getCachedData(key) {
    try {
      const data = await AsyncStorage.getItem(`wearable_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  // Import and calculate all scores
  async importAndCalculateScores() {
    try {
      const fitnessScore = await this.calculateFitnessScore();
      const systemicScore = await this.calculateSystemicScore();

      const scores = {
        fitnessScore,
        systemicScore,
        timestamp: new Date().toISOString(),
      };

      await this.cacheData('scores', scores);
      return scores;
    } catch (error) {
      console.error('Import and calculate error:', error);
      return null;
    }
  }
}

export default new WearableDataService();
