/**
 * Oura Ring Integration Service
 * 
 * Handles OAuth authentication and data retrieval from Oura Cloud API
 * Documentation: https://cloud.ouraring.com/docs/
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

// Oura API Configuration
const OURA_CONFIG = {
  clientId: '18a798fd-289f-45d4-99b6-ade377b3ba15',  // Oura API Client ID
  clientSecret: '07SgBRP_w7zSdetMcidQNtv3gKsUmKQokpq0_0HUw',  // Oura API Client Secret
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'praxiomhealth',
    path: 'oura-callback'
  }),
  scopes: ['daily', 'heartrate', 'workout', 'session', 'sleep'],
  authorizationEndpoint: 'https://cloud.ouraring.com/oauth/authorize',
  tokenEndpoint: 'https://api.ouraring.com/oauth/token',
  apiBaseUrl: 'https://api.ouraring.com/v2/usercollection'
};

class OuraRingService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Initialize service and restore saved tokens
   */
  async init() {
    try {
      const savedToken = await AsyncStorage.getItem('oura_access_token');
      const savedRefresh = await AsyncStorage.getItem('oura_refresh_token');
      const savedExpiry = await AsyncStorage.getItem('oura_token_expiry');

      if (savedToken && savedExpiry) {
        this.accessToken = savedToken;
        this.refreshToken = savedRefresh;
        this.tokenExpiry = parseInt(savedExpiry);

        // Check if token is expired
        if (Date.now() > this.tokenExpiry) {
          await this.refreshAccessToken();
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing Oura service:', error);
      return false;
    }
  }

  /**
   * Start OAuth authentication flow
   */
  async authenticate() {
    try {
      // Create authorization request
      const request = new AuthSession.AuthRequest({
        clientId: OURA_CONFIG.clientId,
        scopes: OURA_CONFIG.scopes,
        redirectUri: OURA_CONFIG.redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      await request.makeAuthUrlAsync({
        authorizationEndpoint: OURA_CONFIG.authorizationEndpoint,
      });

      // Prompt user to authenticate
      const result = await request.promptAsync({
        authorizationEndpoint: OURA_CONFIG.authorizationEndpoint,
      });

      if (result.type === 'success') {
        const { code } = result.params;
        
        // Exchange authorization code for access token
        await this.exchangeCodeForToken(code);
        
        return {
          success: true,
          message: 'Successfully connected to Oura Ring'
        };
      } else if (result.type === 'cancel') {
        return {
          success: false,
          message: 'Authentication cancelled'
        };
      } else {
        return {
          success: false,
          message: 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('OAuth error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await fetch(OURA_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: OURA_CONFIG.redirectUri,
          client_id: OURA_CONFIG.clientId,
          client_secret: OURA_CONFIG.clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      // Save tokens
      await AsyncStorage.setItem('oura_access_token', this.accessToken);
      await AsyncStorage.setItem('oura_refresh_token', this.refreshToken);
      await AsyncStorage.setItem('oura_token_expiry', this.tokenExpiry.toString());

      return true;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh expired access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(OURA_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: OURA_CONFIG.clientId,
          client_secret: OURA_CONFIG.clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || this.refreshToken;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      // Update saved tokens
      await AsyncStorage.setItem('oura_access_token', this.accessToken);
      if (data.refresh_token) {
        await AsyncStorage.setItem('oura_refresh_token', data.refresh_token);
      }
      await AsyncStorage.setItem('oura_token_expiry', this.tokenExpiry.toString());

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens and require re-authentication
      await this.disconnect();
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    try {
      // Check token validity
      if (!this.accessToken || Date.now() > this.tokenExpiry) {
        await this.refreshAccessToken();
      }

      const response = await fetch(`${OURA_CONFIG.apiBaseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try refresh
          await this.refreshAccessToken();
          // Retry request
          return this.makeRequest(endpoint, options);
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Get personal info
   */
  async getPersonalInfo() {
    try {
      const data = await this.makeRequest('/personal_info');
      return data;
    } catch (error) {
      console.error('Error fetching personal info:', error);
      return null;
    }
  }

  /**
   * Get daily data (includes HRV, sleep, activity)
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   */
  async getDailySummary(startDate, endDate) {
    try {
      const data = await this.makeRequest(
        `/daily_sleep?start_date=${startDate}&end_date=${endDate}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      return null;
    }
  }

  /**
   * Get today's HRV for Praxiom calculation
   */
  async getTodayHRV() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      const data = await this.makeRequest(
        `/daily_sleep?start_date=${yesterday}&end_date=${today}`
      );
      
      if (data && data.data && data.data.length > 0) {
        // Get most recent sleep session
        const latestSleep = data.data[data.data.length - 1];
        
        // Oura provides HRV in ms (same as RMSSD format Praxiom uses)
        const hrvValue = latestSleep.hrv_avg || latestSleep.hr_average;
        
        return {
          hrv: hrvValue,
          date: latestSleep.day,
          source: 'Oura Ring'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching HRV:', error);
      return null;
    }
  }

  /**
   * Get readiness score
   */
  async getReadinessScore(startDate, endDate) {
    try {
      const data = await this.makeRequest(
        `/daily_readiness?start_date=${startDate}&end_date=${endDate}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching readiness:', error);
      return null;
    }
  }

  /**
   * Get sleep data
   */
  async getSleepData(startDate, endDate) {
    try {
      const data = await this.makeRequest(
        `/sleep?start_date=${startDate}&end_date=${endDate}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      return null;
    }
  }

  /**
   * Get activity data
   */
  async getActivityData(startDate, endDate) {
    try {
      const data = await this.makeRequest(
        `/daily_activity?start_date=${startDate}&end_date=${endDate}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      return null;
    }
  }

  /**
   * Get comprehensive health summary for dashboard
   */
  async getHealthSummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Fetch multiple endpoints in parallel
      const [sleep, readiness, activity, hrv] = await Promise.all([
        this.getDailySummary(yesterday, today),
        this.getReadinessScore(yesterday, today),
        this.getActivityData(yesterday, today),
        this.getTodayHRV()
      ]);

      return {
        sleep: sleep?.data?.[0] || null,
        readiness: readiness?.data?.[0] || null,
        activity: activity?.data?.[0] || null,
        hrv: hrv || null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching health summary:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.accessToken !== null && Date.now() < this.tokenExpiry;
  }

  /**
   * Disconnect and clear tokens
   */
  async disconnect() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;

      await AsyncStorage.multiRemove([
        'oura_access_token',
        'oura_refresh_token',
        'oura_token_expiry'
      ]);

      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      return false;
    }
  }

  /**
   * Auto-sync - fetch latest data and update app context
   */
  async autoSync() {
    try {
      if (!this.isAuthenticated()) {
        console.log('Not authenticated with Oura');
        return {
          success: false,
          message: 'Not connected to Oura Ring'
        };
      }

      const summary = await this.getHealthSummary();
      
      if (!summary) {
        return {
          success: false,
          message: 'Failed to fetch Oura data'
        };
      }

      return {
        success: true,
        data: summary,
        message: 'Successfully synced with Oura Ring'
      };
    } catch (error) {
      console.error('Auto-sync error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Export singleton instance
const ouraRingService = new OuraRingService();
export default ouraRingService;
