import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WearableDataService {
  constructor() {
    this.initialized = false;
    this.platform = Platform.OS;
  }

  // Initialize service
  async initialize() {
    this.initialized = true;
    return true;
  }

  // Calculate Fitness Score (0-100) from provided data
  calculateFitnessScore(healthData) {
    const {
      steps = 0,
      hrv = 50, // Heart Rate Variability (ms)
      restingHR = 70,
      sleepHours = 7,
      workouts = 0
    } = healthData;

    let score = 0;

    // Steps (30 points) - Target: 10,000 steps/day
    const stepsScore = Math.min((steps / 10000) * 30, 30);
    score += stepsScore;

    // HRV (25 points) - Higher is better, typical range 20-200ms
    const hrvScore = Math.min((hrv / 100) * 25, 25);
    score += hrvScore;

    // Resting Heart Rate (20 points) - Target: 60-70 bpm
    let hrScore = 0;
    if (restingHR >= 60 && restingHR <= 70) {
      hrScore = 20; // Optimal
    } else if (restingHR < 60) {
      hrScore = 15; // Athletic but might be too low
    } else if (restingHR <= 80) {
      hrScore = 15; // Slightly elevated
    } else {
      hrScore = 10; // High resting HR
    }
    score += hrScore;

    // Sleep (15 points) - Target: 7+ hours
    const sleepScore = Math.min((sleepHours / 7) * 15, 15);
    score += sleepScore;

    // Activity/Workouts (10 points) - Target: 5+ per week
    const activityScore = Math.min((workouts / 5) * 10, 10);
    score += activityScore;

    return Math.round(Math.min(score, 100));
  }

  // Calculate Systemic Health Score (0-100) from provided data
  calculateSystemicScore(healthData) {
    const {
      systolicBP = 120,
      diastolicBP = 80,
      spo2 = 98, // Oxygen saturation %
      heartRate = 70
    } = healthData;

    let score = 100; // Start at perfect, deduct points for issues

    // Blood Pressure Check
    // Optimal: <120/80
    // Elevated: 120-129/<80
    // High: ≥130/≥80
    if (systolicBP >= 140 || diastolicBP >= 90) {
      score -= 30; // Stage 2 hypertension
    } else if (systolicBP >= 130 || diastolicBP >= 80) {
      score -= 20; // Stage 1 hypertension
    } else if (systolicBP >= 120) {
      score -= 10; // Elevated
    }

    // SpO2 Check (Oxygen Saturation)
    if (spo2 < 95) {
      score -= 25; // Low oxygen
    } else if (spo2 < 97) {
      score -= 10; // Slightly low
    }

    // Heart Rate Check
    if (heartRate > 100) {
      score -= 20; // Tachycardia
    } else if (heartRate < 50 && heartRate > 0) {
      score -= 15; // Bradycardia (unless athletic)
    }

    return Math.round(Math.max(score, 0));
  }

  // Import data from JSON/CSV file (manual upload)
  async importDataFromFile(fileData) {
    try {
      // Parse file data (assuming JSON format)
      const data = typeof fileData === 'string' ? JSON.parse(fileData) : fileData;
      
      // Calculate scores from imported data
      const fitnessScore = this.calculateFitnessScore(data);
      const systemicScore = this.calculateSystemicScore(data);

      const scores = {
        fitnessScore,
        systemicScore,
        timestamp: new Date().toISOString(),
        source: 'manual_import'
      };

      await this.cacheData('scores', scores);
      return scores;
    } catch (error) {
      console.error('Import data error:', error);
      return null;
    }
  }

  // Calculate scores from watch data
  async calculateScoresFromWatch(watchData) {
    try {
      const fitnessScore = this.calculateFitnessScore(watchData);
      const systemicScore = this.calculateSystemicScore(watchData);

      const scores = {
        fitnessScore,
        systemicScore,
        timestamp: new Date().toISOString(),
        source: 'praxiom_watch'
      };

      await this.cacheData('scores', scores);
      return scores;
    } catch (error) {
      console.error('Calculate scores error:', error);
      return null;
    }
  }

  // Get sample data for demonstration
  getSampleHealthData() {
    return {
      steps: 8500,
      hrv: 65,
      restingHR: 68,
      sleepHours: 7.5,
      workouts: 4,
      systolicBP: 118,
      diastolicBP: 78,
      spo2: 98,
      heartRate: 72
    };
  }

  // Import and calculate all scores (uses sample data for now)
  async importAndCalculateScores() {
    try {
      // For now, use sample data
      // In production, this would integrate with native health APIs
      const sampleData = this.getSampleHealthData();
      
      const fitnessScore = this.calculateFitnessScore(sampleData);
      const systemicScore = this.calculateSystemicScore(sampleData);

      const scores = {
        fitnessScore,
        systemicScore,
        timestamp: new Date().toISOString(),
        source: 'sample_data',
        note: 'Using sample data. Connect wearables for real-time data.'
      };

      await this.cacheData('scores', scores);
      return scores;
    } catch (error) {
      console.error('Import and calculate error:', error);
      return null;
    }
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

  // Future: Native health integration methods
  // These would be implemented when native modules are added
  
  async initializeAppleHealth() {
    // Placeholder for Apple Health integration
    console.log('Apple Health: Not yet implemented. Native module required.');
    return false;
  }

  async initializeGoogleFit() {
    // Placeholder for Google Fit integration
    console.log('Google Fit: Not yet implemented. Native module required.');
    return false;
  }
}

export default new WearableDataService();
