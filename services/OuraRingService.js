/**
 * OuraRingService.js
 * 
 * Oura Ring Integration Service for Praxiom Health
 * Uses Oura Cloud API v2 for data synchronization
 * 
 * Features:
 * - OAuth 2.0 authentication
 * - Daily sleep, activity, and readiness data
 * - HRV, resting heart rate, and recovery metrics
 * - Automatic data sync with health profile
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection';
const OURA_AUTH_BASE = 'https://cloud.ouraring.com/oauth/authorize';
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token';

// IMPORTANT: Replace with your Oura API credentials
// Get these from: https://cloud.ouraring.com/oauth/applications
const OURA_CLIENT_ID = 'YOUR_OURA_CLIENT_ID';
const OURA_CLIENT_SECRET = 'YOUR_OURA_CLIENT_SECRET';

const STORAGE_KEYS = {
  OURA_ACCESS_TOKEN: '@praxiom_oura_access_token',
  OURA_REFRESH_TOKEN: '@praxiom_oura_refresh_token',
  OURA_LAST_SYNC: '@praxiom_oura_last_sync',
  OURA_USER_DATA: '@praxiom_oura_user_data',
};

class OuraRingService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.lastSyncTime = null;
    this.isConnected = false;
    this.userData = null;
  }

  /**
   * Initialize Oura Ring connection
   */
  async initialize() {
    try {
      // Load saved tokens
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.OURA_ACCESS_TOKEN);
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.OURA_REFRESH_TOKEN);
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.OURA_LAST_SYNC);
      
      if (accessToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.lastSyncTime = lastSync ? new Date(lastSync) : null;
        this.isConnected = true;
        
        console.log('✅ Oura Ring: Initialized with saved credentials');
        return true;
      }
      
      console.log('⚠️ Oura Ring: No saved credentials found');
      return false;
    } catch (error) {
      console.error('❌ Oura Ring initialization error:', error);
      return false;
    }
  }

  /**
   * Authenticate with Oura Cloud using OAuth 2.0
   */
  async authenticate(redirectUri) {
    try {
      console.log('🔐 Starting Oura Ring authentication...');
      
      const authUrl = `${OURA_AUTH_BASE}?client_id=${OURA_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=daily`;
      
      const result = await AuthSession.startAsync({
        authUrl: authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === 'success' && result.params.code) {
        const code = result.params.code;
        
        // Exchange code for access token
        const tokenResponse = await fetch(OURA_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `grant_type=authorization_code&code=${code}&client_id=${OURA_CLIENT_ID}&client_secret=${OURA_CLIENT_SECRET}&redirect_uri=${redirectUri}`,
        });

        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
          this.accessToken = tokenData.access_token;
          this.refreshToken = tokenData.refresh_token;
          
          // Save tokens
          await AsyncStorage.setItem(STORAGE_KEYS.OURA_ACCESS_TOKEN, this.accessToken);
          await AsyncStorage.setItem(STORAGE_KEYS.OURA_REFRESH_TOKEN, this.refreshToken);
          
          this.isConnected = true;
          console.log('✅ Oura Ring: Authentication successful');
          
          return {
            success: true,
            message: 'Successfully connected to Oura Ring',
          };
        }
      }
      
      return {
        success: false,
        message: 'Authentication cancelled or failed',
      };
    } catch (error) {
      console.error('❌ Oura Ring authentication error:', error);
      return {
        success: false,
        message: 'Authentication error: ' + error.message,
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(OURA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=refresh_token&refresh_token=${this.refreshToken}&client_id=${OURA_CLIENT_ID}&client_secret=${OURA_CLIENT_SECRET}`,
      });

      const tokenData = await response.json();
      
      if (tokenData.access_token) {
        this.accessToken = tokenData.access_token;
        if (tokenData.refresh_token) {
          this.refreshToken = tokenData.refresh_token;
        }
        
        await AsyncStorage.setItem(STORAGE_KEYS.OURA_ACCESS_TOKEN, this.accessToken);
        if (tokenData.refresh_token) {
          await AsyncStorage.setItem(STORAGE_KEYS.OURA_REFRESH_TOKEN, tokenData.refresh_token);
        }
        
        console.log('✅ Oura Ring: Token refreshed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Oura Ring token refresh error:', error);
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, retryCount = 0) {
    try {
      if (!this.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${OURA_API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle token expiration
      if (response.status === 401 && retryCount === 0) {
        console.log('🔄 Token expired, refreshing...');
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.makeRequest(endpoint, retryCount + 1);
        }
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Oura API request error:', error);
      throw error;
    }
  }

  /**
   * Sync daily data from Oura Ring
   */
  async syncDailyData(startDate = null, endDate = null) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Oura Ring');
      }

      // Default to last 7 days if no dates specified
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }
      if (!endDate) {
        endDate = new Date();
      }

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      console.log(`📥 Syncing Oura data: ${start} to ${end}`);

      // Fetch all data types in parallel
      const [sleepData, activityData, readinessData, hrvData] = await Promise.all([
        this.makeRequest(`/daily_sleep?start_date=${start}&end_date=${end}`),
        this.makeRequest(`/daily_activity?start_date=${start}&end_date=${end}`),
        this.makeRequest(`/daily_readiness?start_date=${start}&end_date=${end}`),
        this.makeRequest(`/heartrate?start_date=${start}&end_date=${end}`),
      ]);

      // Process and combine data
      const processedData = this.processOuraData({
        sleep: sleepData.data || [],
        activity: activityData.data || [],
        readiness: readinessData.data || [],
        heartrate: hrvData.data || [],
      });

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEYS.OURA_USER_DATA, JSON.stringify(processedData));
      await AsyncStorage.setItem(STORAGE_KEYS.OURA_LAST_SYNC, new Date().toISOString());
      
      this.userData = processedData;
      this.lastSyncTime = new Date();

      console.log('✅ Oura data synced successfully');
      console.log(`📊 Synced ${processedData.dailyData.length} days of data`);

      return {
        success: true,
        data: processedData,
        syncTime: this.lastSyncTime,
      };
    } catch (error) {
      console.error('❌ Oura sync error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process Oura data into Praxiom format
   */
  processOuraData(rawData) {
    const dailyData = {};

    // Process sleep data
    rawData.sleep.forEach(day => {
      const date = day.day;
      if (!dailyData[date]) dailyData[date] = {};
      
      dailyData[date].sleep = {
        totalSleep: day.total_sleep_duration / 60, // Convert to minutes
        deepSleep: day.deep_sleep_duration / 60,
        remSleep: day.rem_sleep_duration / 60,
        lightSleep: day.light_sleep_duration / 60,
        sleepEfficiency: day.sleep_efficiency,
        sleepScore: day.score,
        restingHeartRate: day.lowest_heart_rate,
        avgHRV: day.average_hrv,
      };
    });

    // Process activity data
    rawData.activity.forEach(day => {
      const date = day.day;
      if (!dailyData[date]) dailyData[date] = {};
      
      dailyData[date].activity = {
        steps: day.steps,
        calories: day.total_calories,
        activeCalories: day.active_calories,
        activityScore: day.score,
        met: day.average_met_minutes,
        inactivityAlerts: day.inactivity_alerts,
      };
    });

    // Process readiness data
    rawData.readiness.forEach(day => {
      const date = day.day;
      if (!dailyData[date]) dailyData[date] = {};
      
      dailyData[date].readiness = {
        readinessScore: day.score,
        temperatureDeviation: day.temperature_deviation,
        recoveryIndex: day.recovery_index,
      };
    });

    // Calculate average metrics for Praxiom integration
    const allDays = Object.values(dailyData);
    const averages = {
      restingHeartRate: this.calculateAverage(allDays.map(d => d.sleep?.restingHeartRate).filter(Boolean)),
      hrv: this.calculateAverage(allDays.map(d => d.sleep?.avgHRV).filter(Boolean)),
      steps: this.calculateAverage(allDays.map(d => d.activity?.steps).filter(Boolean)),
      sleepEfficiency: this.calculateAverage(allDays.map(d => d.sleep?.sleepEfficiency).filter(Boolean)),
      readinessScore: this.calculateAverage(allDays.map(d => d.readiness?.readinessScore).filter(Boolean)),
    };

    return {
      dailyData: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
      averages,
      lastSync: new Date().toISOString(),
    };
  }

  /**
   * Get latest health metrics for Praxiom algorithm
   */
  getLatestMetrics() {
    if (!this.userData || !this.userData.dailyData.length) {
      return null;
    }

    const latest = this.userData.dailyData[0];
    const averages = this.userData.averages;

    return {
      // For fitness score calculation
      heartRate: latest.sleep?.restingHeartRate || averages.restingHeartRate || null,
      hrv: latest.sleep?.avgHRV || averages.hrv || null,
      steps: latest.activity?.steps || averages.steps || null,
      spO2: null, // Oura doesn't provide SpO2 yet
      
      // Additional metrics
      sleepEfficiency: latest.sleep?.sleepEfficiency || averages.sleepEfficiency || null,
      readinessScore: latest.readiness?.readinessScore || averages.readinessScore || null,
      
      // Metadata
      source: 'Oura Ring',
      syncTime: this.lastSyncTime,
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      lastSyncTime: this.lastSyncTime,
      hasData: this.userData !== null,
      dataPoints: this.userData ? this.userData.dailyData.length : 0,
    };
  }

  /**
   * Disconnect Oura Ring
   */
  async disconnect() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.OURA_ACCESS_TOKEN,
        STORAGE_KEYS.OURA_REFRESH_TOKEN,
        STORAGE_KEYS.OURA_LAST_SYNC,
        STORAGE_KEYS.OURA_USER_DATA,
      ]);

      this.accessToken = null;
      this.refreshToken = null;
      this.lastSyncTime = null;
      this.isConnected = false;
      this.userData = null;

      console.log('✅ Oura Ring disconnected');
      return true;
    } catch (error) {
      console.error('❌ Oura Ring disconnect error:', error);
      return false;
    }
  }

  /**
   * Calculate average from array
   */
  calculateAverage(arr) {
    if (!arr || arr.length === 0) return null;
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / arr.length);
  }

  /**
   * Auto-sync on app launch
   */
  async autoSync() {
    if (!this.isConnected) {
      return false;
    }

    // Only sync if last sync was more than 1 hour ago
    if (this.lastSyncTime) {
      const hoursSinceSync = (new Date() - this.lastSyncTime) / (1000 * 60 * 60);
      if (hoursSinceSync < 1) {
        console.log('⏭️ Oura Ring: Skipping sync (recently synced)');
        return false;
      }
    }

    console.log('🔄 Oura Ring: Auto-syncing...');
    return await this.syncDailyData();
  }
}

export default new OuraRingService();
